import pytest
from fastapi.testclient import TestClient
from modules.db.db_loader import load_documents_from_db
from modules.vector.vector_store import build_vectordb
from modules.rag.rag import create_qa_chain
from app import app
from modules.config import DB_PATH
from langchain_openai import OpenAIEmbeddings
from modules.config import OPENAI_API_KEY

client = TestClient(app)

embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# ---------------------------
# Tests FastAPI endpoints
# ---------------------------
def test_ask_endpoint():
    response = client.post("/api/ask", json={"query": "Hola"})
    assert response.status_code == 200
    assert "answer" in response.json()

def test_update_endpoint():
    response = client.post("/api/configure", json={"base_url": "https://example.com", "api_key": "test_key"})
    assert response.status_code == 200
    assert response.json()["status"] in ["ok", "error"]

# ---------------------------
# Tests módulos internos
# ---------------------------
def test_load_documents():
    documents = load_documents_from_db(DB_PATH)
    assert isinstance(documents, list)
    assert len(documents) > 0
    for doc in documents:
        assert "page_content" in dir(doc)
        assert "metadata" in dir(doc)

def test_build_vectordb():
    embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
    documents = load_documents_from_db(DB_PATH)
    vectordb, retriever = build_vectordb(documents, embedding)
    assert vectordb is not None
    assert retriever is not None

def test_create_qa_chain():
    embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
    documents = load_documents_from_db(DB_PATH)
    vectordb, retriever = build_vectordb(documents, embedding)
    qa = create_qa_chain(retriever, "dummy_api_key")
    assert qa is not None
    assert hasattr(qa, "run")
