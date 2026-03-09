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
- **`modules/data_manager.py`**: Orchestrates the scraping -> DB -> FAISS flow.
- **`modules/vector/vector_store.py`**: Manages FAISS index persistence and loading.

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

### 3. QA Chain Configuration
-   Uses `ConversationalRetrievalChain.from_llm`.
-   **Memory**: `ConversationBufferMemory` is used for chat history.
-   **Streaming**: Handled via `AsyncIteratorCallbackHandler` for OpenAI/Groq/Claude.
