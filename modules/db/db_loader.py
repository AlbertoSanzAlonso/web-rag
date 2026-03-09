import sqlite3
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import DB_PATH

def load_documents_from_db(db_path=DB_PATH):
    """
    Carga documentos desde la base de datos SQLite, los divide en chunks
    y los convierte en objetos Document.
    """
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT url, title, text FROM pages")
    rows = c.fetchall()
    conn.close()

    raw_documents = []
    for url, title, text in rows:
        if not text or not text.strip():
            continue
        content = f"Título: {title}\nContenido: {text}"
        raw_documents.append(Document(
            page_content=content,
            metadata={"source": url, "title": title, "url": url}
        ))
    
    # Implementación de Chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    
    documents = text_splitter.split_documents(raw_documents)
    return documents
