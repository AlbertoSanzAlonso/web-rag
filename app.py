from fastapi import FastAPI
from langchain_openai import OpenAIEmbeddings
from langchain_community.chat_models import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.docstore.document import Document
import sqlite3
import os
from site_crawler import scrape_website, save_to_db
from config import OPENAI_API_KEY, BASE_URL, DB_PATH

app = FastAPI()

# Inicializamos embeddings
embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# ---------------------------
# Función para cargar documentos desde SQLite
# ---------------------------
def load_documents_from_db(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT url, title, text FROM pages")
    rows = c.fetchall()
    conn.close()

    documents = []
    for url, title, text in rows:
        content = f"Título: {title}\nContenido: {text}"
        documents.append(Document(page_content=content, metadata={"url": url}))
    return documents

# ---------------------------
# Inicialización de la DB y vector store
# ---------------------------
def initialize_data():
    global vectordb, qa

    # Scrapeo solo si no existe la DB
    if not os.path.exists(DB_PATH):
        print(f"🚀 DB no encontrada, iniciando scraping de {BASE_URL}")
        all_data = scrape_website(BASE_URL, max_pages=50, delay=0.5)
        save_to_db(all_data, db_path=DB_PATH)
        print(f"💾 Scraping completado. Datos guardados en {DB_PATH}")

    # Cargar documentos
    documents = load_documents_from_db(DB_PATH)

    if not documents:
        raise ValueError("No se encontraron documentos en la DB para inicializar el vector store.")
    
    documents = load_documents_from_db(DB_PATH)
    print(f"Documentos cargados: {len(documents)}")
    for doc in documents[:5]:
        print(doc.metadata, doc.page_content[:100])

    # Crear vector store desde documentos
    vectordb = Chroma.from_documents(
        documents,
        embedding_function=embedding,
        persist_directory="./vectordb"
    )

    # Persistir la base de datos
    vectordb.persist()

    # Crear retriever
    retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 3})

    # Crear chain RAG
    qa = RetrievalQA.from_chain_type(
        llm=ChatOpenAI(openai_api_key=OPENAI_API_KEY, temperature=0),
        retriever=retriever
    )

# Inicialización al arrancar la app

initialize_data()

# ---------------------------
# Endpoint FastAPI
# ---------------------------

@app.get("/ask")
def ask(query: str):
    """
    Recibe una consulta del usuario y devuelve la respuesta usando RAG
    """
    response = qa.run(query)
    return {"answer": response}

@app.post("/update")
def update_data():
    """
    Forzar actualización: scrapear la web y regenerar vector store
    """
    try:
        print(f"🚀 Actualizando scraping de {BASE_URL}")
        all_data = scrape_website(BASE_URL, max_pages=50, delay=0.5)
        save_to_db(all_data, db_path=DB_PATH)
        initialize_data()  # recarga vectordb y QA chain
        return {"status": "ok", "message": "Datos actualizados correctamente"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
