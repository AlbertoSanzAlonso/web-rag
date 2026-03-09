from langchain_community.vectorstores import FAISS
import os

FAISS_INDEX_PATH = "./faiss_index"


def build_vectordb(documents, embedding):
    """Crea un nuevo índice FAISS y lo persiste en disco."""
    vectordb = FAISS.from_documents(documents, embedding=embedding)
    vectordb.save_local(FAISS_INDEX_PATH)
    print(f"💾 Índice FAISS guardado en {FAISS_INDEX_PATH}")
    retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 4})
    return vectordb, retriever


def load_vectordb(embedding):
    """Carga el índice FAISS desde disco si existe. Devuelve (vectordb, retriever) o (None, None)."""
    if not os.path.exists(FAISS_INDEX_PATH):
        return None, None
    try:
        vectordb = FAISS.load_local(
            FAISS_INDEX_PATH,
            embedding,
            allow_dangerous_deserialization=True
        )
        print(f"📂 Índice FAISS cargado desde {FAISS_INDEX_PATH}")
        retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 4})
        return vectordb, retriever
    except Exception as e:
        print(f"⚠️ No se pudo cargar el índice FAISS: {e}")
        return None, None


def delete_vectordb():
    """Borra el índice FAISS del disco."""
    import shutil
    if os.path.exists(FAISS_INDEX_PATH):
        shutil.rmtree(FAISS_INDEX_PATH)
        print(f"🗑️ Índice FAISS eliminado.")