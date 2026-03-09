import asyncio
from modules.scraper.site_crawler import scrape_website_async, save_to_db
from modules.vector.vector_store import build_vectordb, load_vectordb
from modules.db.db_loader import load_documents_from_db
from modules.rag.rag import create_qa_chain
import os


async def refresh_data_async(base_url, db_path, embedding, api_key, provider="openai",
                              embedding_key=None, max_pages=50, on_progress=None, ollama_url=None):
    """
    Versión asíncrona de refresh_data.
    Orden de prioridad:
      1. Si ya existe el índice FAISS en disco → cargarlo (instantáneo).
      2. Si existe la DB SQLite pero no el índice → reconstruir vectores.
      3. Si nada existe → scraping completo + vectorización.
    """
    from modules.vector.vector_store import FAISS_INDEX_PATH

    # ── Intentar carga rápida desde disco ──────────────────────────────────
    vectordb, retriever = load_vectordb(embedding)
    if vectordb is not None:
        print(f"⚡ Índice FAISS cargado desde disco. Sin necesidad de re-indexar.")
        qa = create_qa_chain(retriever, provider, api_key, embedding_key, base_url=ollama_url)
        return vectordb, retriever, qa

    # ── Scraping si no hay DB ──────────────────────────────────────────────
    if not os.path.exists(db_path):
        print(f"🚀 DB no encontrada. Iniciando scraping async de {base_url}...")
        all_data = await scrape_website_async(
            base_url,
            max_pages=max_pages,
            concurrency=10,
            on_progress=on_progress,
        )
        save_to_db(all_data, db_path)
        print("💾 Scraping completado.")
    else:
        print(f"📂 DB encontrada. Cargando documentos desde {db_path}...")

    # ── Construir vectores ────────────────────────────────────────────────
    documents = load_documents_from_db(db_path)
    if not documents:
        raise ValueError("No se encontraron documentos en la DB.")

    print(f"📄 Chunks generados: {len(documents)}")
    vectordb, retriever = build_vectordb(documents, embedding)
    print("🔹 Vector store creado y persistido.")

    qa = create_qa_chain(retriever, provider, api_key, embedding_key, base_url=ollama_url)
    print(f"🤖 QA chain inicializada con {provider}.")

    return vectordb, retriever, qa


# Wrapper síncrono (mantiene compatibilidad si se llama desde código no-async)
def refresh_data(base_url, db_path, embedding, api_key, provider="openai",
                 embedding_key=None, max_pages=50, delay=0.5):
    return asyncio.run(refresh_data_async(
        base_url, db_path, embedding, api_key, provider, embedding_key, max_pages
    ))