from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from modules.data_manager import refresh_data_async
from modules.rag.rag import create_embeddings
import os
import shutil
import asyncio
import json
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_state = {
    "qa_chain": None,
    "vectordb": None,
    "retriever": None,
    "indexing": False,       # True mientras se scrapea/indexa
    "pages_done": 0,         # Páginas descargadas hasta ahora
    "error": None,           # Último error de indexación
    "config": {
        "api_key": None,
        "base_url": None,
        "provider": "openai",
        "embedding_key": None,
        "db_path": "webdata.db"
    }
}

class ConfigRequest(BaseModel):
    api_key: str
    base_url: str
    provider: str = "openai"  # openai, gemini, claude, mock
    embedding_key: Optional[str] = None

class AskRequest(BaseModel):
    query: str


async def run_indexing(request: ConfigRequest):
    """Tarea de fondo: scrapea el sitio y construye el índice vectorial."""
    app_state["indexing"] = True
    app_state["pages_done"] = 0
    app_state["error"] = None
    app_state["qa_chain"] = None

    def on_progress(url: str):
        app_state["pages_done"] += 1

    try:
        embed_key = request.api_key
        if request.provider == "claude":
            if not request.embedding_key:
                raise ValueError("Claude requires an OpenAI API Key for embeddings.")
            embed_key = request.embedding_key

        embedding = create_embeddings(request.provider, embed_key)

        vectordb, retriever, qa = await refresh_data_async(
            base_url=request.base_url,
            db_path=app_state["config"]["db_path"],
            embedding=embedding,
            api_key=request.api_key,
            provider=request.provider,
            embedding_key=request.embedding_key,
            on_progress=on_progress,
        )

        app_state["vectordb"] = vectordb
        app_state["retriever"] = retriever
        app_state["qa_chain"] = qa
        print(f"✅ Indexación completa. {app_state['pages_done']} páginas procesadas.")

    except Exception as e:
        app_state["error"] = str(e)
        print(f"❌ Error en indexación: {e}")
    finally:
        app_state["indexing"] = False


@app.post("/api/configure")
async def configure(request: ConfigRequest, background_tasks: BackgroundTasks):
    """
    Inicia la configuración y el scraping en segundo plano.
    Devuelve inmediatamente con status 'indexing'.
    """
    # Guardar config
    app_state["config"]["api_key"] = request.api_key
    app_state["config"]["base_url"] = request.base_url
    app_state["config"]["provider"] = request.provider
    app_state["config"]["embedding_key"] = request.embedding_key

    # Limpiar DB anterior si existe para re-indexar nueva URL
    db_path = app_state["config"]["db_path"]
    if os.path.exists(db_path):
        os.remove(db_path)
    if os.path.exists("./vectordb"):
        shutil.rmtree("./vectordb")

    # Lanzar indexación en background (no bloquea)
    background_tasks.add_task(run_indexing, request)

    return {"status": "indexing", "message": "Indexación iniciada en segundo plano."}


@app.get("/api/status")
def status():
    return {
        "configured": app_state["qa_chain"] is not None,
        "indexing": app_state["indexing"],
        "pages_done": app_state["pages_done"],
        "current_url": app_state["config"]["base_url"],
        "provider": app_state["config"].get("provider", "openai"),
        "error": app_state["error"],
    }


@app.post("/api/ask")
def ask(request: AskRequest):
    if not app_state["qa_chain"]:
        if app_state["indexing"]:
            raise HTTPException(status_code=400, detail="El agente aún está indexando. Por favor espera.")
        raise HTTPException(status_code=400, detail="Not configured.")

    try:
        result = app_state["qa_chain"].invoke({"question": request.query})
        return {"answer": result.get("answer", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ask/stream")
async def ask_stream(request: AskRequest):
    """Endpoint de streaming: devuelve tokens via Server-Sent Events (SSE)."""
    if not app_state["qa_chain"]:
        if app_state["indexing"]:
            raise HTTPException(status_code=400, detail="El agente aún está indexando.")
        raise HTTPException(status_code=400, detail="Not configured.")

    provider = app_state["config"].get("provider", "openai")
    chain = app_state["qa_chain"]

    async def generate_mock():
        """Para mock: llama sync en un executor, luego hace stream palabra a palabra."""
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, lambda: chain.invoke({"question": request.query})
        )
        answer = result.get("answer", "")
        words = answer.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'token': token})}\n\n"
            await asyncio.sleep(0.07)  # Simula latencia de generación
        yield "data: [DONE]\n\n"

    async def generate_real():
        """Para OpenAI/Gemini/Claude: usa AsyncIteratorCallbackHandler para tokens reales."""
        try:
            from langchain_classic.callbacks import AsyncIteratorCallbackHandler
        except ImportError:
            from langchain.callbacks import AsyncIteratorCallbackHandler

        callback = AsyncIteratorCallbackHandler()

        # Lanzar la cadena en background con el callback de streaming
        task = asyncio.create_task(
            chain.ainvoke(
                {"question": request.query},
                config={"callbacks": [callback]}
            )
        )

        try:
            async for token in callback.aiter():
                yield f"data: {json.dumps({'token': token})}\n\n"
        finally:
            # Esperar que la tarea termine para que la memoria se actualice
            await task

        yield "data: [DONE]\n\n"

    generator = generate_mock() if provider == "mock" else generate_real()

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.post("/api/reset")
def reset():
    try:
        db_path = app_state["config"]["db_path"]
        if os.path.exists(db_path):
            os.remove(db_path)
        if os.path.exists("./vectordb"):
            shutil.rmtree("./vectordb")

        app_state["qa_chain"] = None
        app_state["vectordb"] = None
        app_state["retriever"] = None
        app_state["indexing"] = False
        app_state["pages_done"] = 0
        app_state["error"] = None

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
