import asyncio
from modules.scraper.site_crawler import scrape_website_async, save_to_db
from modules.vector.vector_store import build_vectordb
from modules.db.db_loader import load_documents_from_db
from modules.rag.rag import create_qa_chain
import os


async def refresh_data_async(base_url, db_path, embedding, api_key, provider="openai",
                              embedding_key=None, max_pages=50, on_progress=None):
    """
    Versión asíncrona de refresh_data.
    - Si la DB no existe, hace scraping async del sitio.
    - Construye el vector store y la QA chain.
    - on_progress(url): callback llamado tras cada página descargada.
    """
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

    documents = load_documents_from_db(db_path)
    if not documents:
        raise ValueError("No se encontraron documentos en la DB.")

    print(f"📄 Chunks generados: {len(documents)}")
    vectordb, retriever = build_vectordb(documents, embedding)
    print("🔹 Vector store creado.")

    qa = create_qa_chain(retriever, provider, api_key, embedding_key)
    print(f"🤖 QA chain inicializada con {provider}.")

    return vectordb, retriever, qa


# Wrapper síncrono (mantiene compatibilidad si se llama desde código no-async)
def refresh_data(base_url, db_path, embedding, api_key, provider="openai",
                 embedding_key=None, max_pages=50, delay=0.5):
    return asyncio.run(refresh_data_async(
        base_url, db_path, embedding, api_key, provider, embedding_key, max_pages
    ))