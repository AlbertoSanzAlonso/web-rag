import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
BASE_URL = os.getenv("BASE_URL", "https://example.com")
DB_PATH = os.getenv("DB_PATH", "webdata.db")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "web-rag")
