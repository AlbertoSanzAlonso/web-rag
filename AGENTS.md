# 🕵️‍♂️ Web-RAG Agent Knowledge Base

This project is a high-performance **Retrieval-Augmented Generation (RAG)** application designed to run efficiently on resource-constrained environments like Render Free Tier (512MB RAM).

## 🚀 Core Mission
The "Knowledge Agent" indexes websites, stores their content in a persistent vector database (Pinecone or FAISS), and allows users to query that information through multiple AI providers (OpenAI, Gemini, Claude, Groq).

## 🧩 Architecture Overview
- **Backend**: FastAPI (Python 3.11) - Deployed on Render (`https://web-rag-glxd.onrender.com`)
- **Frontend**: Vite + React + Tailwind + Framer Motion - Deployed on Vercel
- **RAG Engine**: LangChain + Pinecone (Cloud) / FAISS (Local) + BGE-Embeddings (FastEmbed)
- **Streaming**: Token-by-token response enabled for all providers (OpenAI, Gemini, Claude, Groq).
- **Prompting**: Strict QA Prompt to prevent hallucinations and focus on web context.
- **Visualization**: PCA 2D projections saved to `projections.json` + Framer Motion.
- **Storage**: SQLite (Scraped data) + Pinecone/FAISS (Vector index)

## 🤖 Agent Interaction Protocol
As an AI agent working on this codebase, you must follow these specific patterns:

1.  **Lazy Imports**: Never import heavy AI libraries (Torch, Transformers, FastEmbed, LangChain) at the root level of `app.py`. Always import them inside handlers or the `on_startup` event to avoid Render's "Port scan timeout".
2.  **RAM Efficiency**: Use `FastEmbed` for local embeddings (Groq). Never use `sentence-transformers` as it pulls in PyTorch, which exceeds the 512MB limit.
3.  **Singleton Embeddings**: Always use the `_EMBEDDING_CACHE` in `modules/rag/rag.py`. Never instantiate new embedding objects per request to avoid OOM crashes.
4.  **Batch Processing**: When generating embeddings or visualizations, process documents in small batches (e.g., 5 at a time) and call `gc.collect()` manually.
5.  **Modular Config**: All environment variables and hardcoded constants must live in `modules/config.py`. Key vars: `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`.
6.  **Async Scraping**: Use the existing `scrape_website_async` for crawling to prevent blocking the event loop.
7.  **Environment Sync**: When updating the backend URL, ensure `VITE_API_URL` is updated in Vercel's Environment Variables and a new deployment is triggered.

## 📂 Specialized Skills
Detailed documentation for specific subsystems can be found in:
- [.agents/skills/rag-management/SKILL.md](.agents/skills/rag-management/SKILL.md): Managing AI providers, embeddings, and QA chains.
- [.agents/skills/render-optimization/SKILL.md](.agents/skills/render-optimization/SKILL.md): Patterns for deploying heavy RAG apps on free tiers.

## 🏎️ Standard Workflows
- [.agents/workflows/deploy.md](.agents/workflows/deploy.md): How to push changes and monitor Render deployment.
