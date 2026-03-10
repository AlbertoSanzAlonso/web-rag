---
name: Render-Optimization
description: |
  Patterns and documentation for deploying heavy AI apps (Python/FastAPI) to Render's 512MB RAM free tier.
---

# 🚀 Render Optimization Skill

## 🎯 Purpose
Maintain stability on Render's 512MB RAM limit and avoid Port Scan Timeouts.

## 🛠️ Components
- **`render.yaml`**: The deployment config.
- **`app.py`**: The server's entry point.
- **`requirements.txt`**: Dependency management.

## 🧱 Key Patterns

### 1. Lazy Imports (Crucial)
Never import heavy libraries at the module's top-level in `app.py`.
- **Correct**: `from langchain_openai import ChatOpenAI` (inside `create_llm`)
- **Singleton Pattern**: Cache heavy models (embeddings/LLMs) in a global dictionary once loaded. Re-instantiating models is the #1 cause of OOM crashes on Render.

### 2. Startup Tasks (Avoid Health-Check Timeouts)
Render starts scanning for a listening port as soon as the container starts.
-   **Pattern**: Wrap the restoration logic in an `asyncio.create_task(restore_state())` inside `on_startup`. This allows `uvicorn` to bind to the port immediately without waiting for models to load.

### 3. RAM Conservation
-   **`FastEmbed` over `Torch`**: Using `fastembed` (ONNX) is mandatory for local embeddings to avoid 512MB RAM crashes.
-   **Single Worker**: Always set `uvicorn --workers 1`.
-   **Minimize `requirements.txt`**: Don't include unused heavy libraries like `transformers`, `torch`, `sentence-transformers` if not absolutely necessary.
- **Explicit Cleanup**: After heavy vectorization or scraping, use `import gc; gc.collect()` to free up RAM immediately.

### 4. Low-RAM Indexing (Crucial for 512MB)
- **Batch Processing**: Always process document embeddings in batches (e.g., 5 at a time) to keep the memory peak low.
- **Avoid Heavy Libraries**: Use direct NumPy math for PCA instead of importing `scikit-learn` to save ~80MB of RAM.
- **Cap Scraping**: Set `max_pages` to a small value (max 15) by default.

### 5. Health Checks
- Ensure `/api/status` returns `200 OK` even if the loading `asyncio.create_task` is still running in the background.
- Render uses this path to verify the service is "Live".

### 6. Frontend & CORS Sync
- **Backend**: Set `allow_origins=["*"]` in `app.py`'s `CORSMiddleware` for production.
- **Frontend (Vercel)**: Always define `VITE_API_URL` without a trailing slash (e.g., `https://backend.onrender.com`) to match internal path construction.
