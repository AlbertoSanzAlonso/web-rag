from fastapi import FastAPI
from langchain_openai import OpenAIEmbeddings
from config import OPENAI_API_KEY, BASE_URL, DB_PATH
from modules.data_manager import refresh_data  # módulo que contiene toda la inicialización

app = FastAPI()

# Inicializamos embeddings

embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# ---------------------------
# Inicialización de la DB, vector store y chain RAG

# ---------------------------
vectordb, retriever, qa = refresh_data(BASE_URL, DB_PATH, embedding, OPENAI_API_KEY)

# ---------------------------
# Endpoints FastAPI
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
        global vectordb, retriever, qa
        vectordb, retriever, qa = refresh_data(BASE_URL, DB_PATH, embedding, OPENAI_API_KEY)
        return {"status": "ok", "message": "Datos actualizados correctamente"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
