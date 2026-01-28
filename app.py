from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from modules.data_manager import refresh_data
from modules.rag.rag import create_embeddings
import os
import shutil
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_state = {
    "qa_chain": None,
    "vectordb": None,
    "retriever": None,
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
    provider: str = "openai" # openai, gemini, claude
    embedding_key: Optional[str] = None # Solo para claude si necesitamos key de openai para embeddings

class AskRequest(BaseModel):
    query: str

@app.post("/api/configure")
def configure(request: ConfigRequest):
    try:
        app_state["config"]["api_key"] = request.api_key
        app_state["config"]["base_url"] = request.base_url
        app_state["config"]["provider"] = request.provider
        app_state["config"]["embedding_key"] = request.embedding_key
        
        # Determine embedding key
        # If openai -> use api_key
        # If gemini -> use api_key
        # If claude -> use embedding_key (OpenAI Key)
        
        embed_key = request.api_key
        if request.provider == "claude":
             if not request.embedding_key:
                  raise HTTPException(status_code=400, detail="Claude requires an OpenAI API Key for embeddings.")
             embed_key = request.embedding_key
        
        # Initialize Embeddings
        embedding = create_embeddings(request.provider, embed_key)
        
        # Refresh Data
        vectordb, retriever, qa = refresh_data(
            base_url=request.base_url,
            db_path=app_state["config"]["db_path"],
            embedding=embedding,
            api_key=request.api_key,
            provider=request.provider,
            embedding_key=request.embedding_key
        )
        
        app_state["vectordb"] = vectordb
        app_state["retriever"] = retriever
        app_state["qa_chain"] = qa
        
        return {"status": "success", "message": "Configuration updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ask")
def ask(request: AskRequest):
    if not app_state["qa_chain"]:
        raise HTTPException(status_code=400, detail="Not configured.")
    
    try:
        response = app_state["qa_chain"].run(request.query)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
def status():
    return {
        "configured": app_state["qa_chain"] is not None,
        "current_url": app_state["config"]["base_url"],
        "provider": app_state["config"].get("provider", "openai")
    }

@app.post("/api/reset")
def reset():
    try:
        if os.path.exists(app_state["config"]["db_path"]):
            os.remove(app_state["config"]["db_path"])
        if os.path.exists("./vectordb"):
            shutil.rmtree("./vectordb")
            
        app_state["qa_chain"] = None
        app_state["vectordb"] = None
        app_state["retriever"] = None
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
