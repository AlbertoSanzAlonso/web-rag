import sqlite3
from langchain_core.documents import Document
from config import DB_PATH

def load_documents_from_db(db_path=DB_PATH):
    """
    Carga documentos desde la base de datos SQLite y los convierte en objetos Document
    """
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
