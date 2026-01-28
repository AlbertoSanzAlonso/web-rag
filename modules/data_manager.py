from modules.scraper.site_crawler import scrape_website, save_to_db
from modules.vector.vector_store import build_vectordb
from modules.db.db_loader import load_documents_from_db
from modules.rag.rag import create_qa_chain
import os


def refresh_data(base_url, db_path, embedding, api_key, provider="openai", embedding_key=None, max_pages=50, delay=0.5):
    if not os.path.exists(db_path):
        print(f"🚀 DB no encontrada. Iniciando scraping...")
        all_data = scrape_website(base_url, max_pages=max_pages, delay=delay)
        save_to_db(all_data, db_path)
        print("💾 Scraping completado.")
    else:
        print(f"📂 DB encontrada. Cargando documentos desde {db_path}...")

    documents = load_documents_from_db(db_path)
    if not documents:
        raise ValueError("No se encontraron documentos en la DB.")

    print(f"📄 Documentos cargados: {len(documents)}")
    vectordb, retriever = build_vectordb(documents, embedding)
    print("🔹 Vector store creado.")
    
    # Pasamos el provider para crear el LLM correcto
    qa = create_qa_chain(retriever, provider, api_key, embedding_key)
    print(f"🤖 QA chain inicializada con {provider}.")
    
    return vectordb, retriever, qa