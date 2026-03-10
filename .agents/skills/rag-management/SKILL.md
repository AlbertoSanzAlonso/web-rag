---
name: RAG-Management
description: |
  Knowledge about managing the Retrieval-Augmented Generation (RAG) system, adding AI providers, 
  and configuring embeddings for different models (OpenAI, Gemini, Claude, and Groq).
---

# 🤖 RAG Management Skill

## 🎯 Purpose
Maintain and extend the core RAG logic of the application without breaking resource limits.

## 🛠️ Components
- **`modules/rag/rag.py`**: The heart of the system. Contains `create_embeddings`, `create_llm`, and `create_qa_chain`.
- **`modules/data_manager.py`**: Orchestrates scraping -> DB -> Vector Store. Includes RAM-safe batching.
- **`modules/vector/vector_store.py`**: Manages FAISS (Local) and Pinecone (Cloud) persistence. Includes 2D projection logic for UI.

## 🧱 Key Patterns

### 1. Adding a New LLM Provider
To add a new provider (e.g., Mistral):
1.  Update `app.py`'s `Provider` type and `ConfigRequest` schema.
2.  In `modules/rag/rag.py:create_llm`, add its LangChain class (lazy-loaded if possible).
3.  In `modules/rag/rag.py:create_embeddings`, define its embedding source.
4.  Update the frontend `Setup.tsx` to include the new provider in the UI.

### 2. Handling Embeddings
-   **OpenAI/Gemini**: Use their respective API-based embeddings.
-   **Claude**: Claude doesn't have embeddings; use `OpenAIEmbeddings` as a proxy (requires API Key).
-   **Groq/Local**: Use **`FastEmbedEmbeddings`** (`BAAI/bge-small-en-v1.5`). Never use `HuggingFaceEmbeddings` (Torch) to save RAM.

### 3. Vector Space Visualization
- **`modules/vector/vector_store.py:get_projections`**: Reads pre-calculated proyections from `projections.json`.
- **Pre-calculation**: Projections are calculated during `build_vectordb` using a NumPy-based PCA in small batches.

### 4. Pinecone vs FAISS
- **FAISS**: Default for local dev or if `PINECONE_API_KEY` is missing. Stores in `./faiss_index`.
- **Pinecone**: Automatic if API key present. Creates/deletes indices dynamically.

### 5. Advanced RAG Patterns
- **Singleton Embeddings**: Models are cached in `_EMBEDDING_CACHE` to avoid reloading them and causing OOM.
- **Strict QA Prompting**: Uses `QA_PROMPT` to prevent LLM hallucinations by forcing context use.
- **Streaming**: Set `streaming=True` in all LLM constructors and use `AsyncIteratorCallbackHandler` for SSE.
