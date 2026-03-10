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
- **Wrong**: `from langchain_openai import ChatOpenAI` (at top)
- **Correct**: `from langchain_openai import ChatOpenAI` (inside `create_llm`)

### 2. Startup Tasks (Avoid Health-Check Timeouts)
Render starts scanning for a listening port as soon as the container starts.
-   **Pattern**: Wrap the restoration logic in an `asyncio.create_task(restore_state())` inside `on_startup`. This allows `uvicorn` to bind to the port immediately without waiting for models to load.

### 3. RAM Conservation
-   **`FastEmbed` over `Torch`**: Using `fastembed` (ONNX) is mandatory for local embeddings to avoid 512MB RAM crashes.
-   **Single Worker**: Always set `uvicorn --workers 1`.
-   **Minimize `requirements.txt`**: Don't include unused heavy libraries like `transformers`, `torch`, `sentence-transformers` if not absolutely necessary.
- **Explicit Cleanup**: After heavy vectorization or scraping, use `import gc; gc.collect()` to free up RAM immediately.

### 4. Low-RAM Indexing (Crucial for 512MB)
- **Cap Scraping**: Set `max_pages` to a small value (e.g., **15 pages**) by default. Free tier RAM cannot handle processing the source text of 50+ pages simultaneously.
- **Avoid Heavy Scikit-Learn**: For visualizations, use direct NumPy math for PCA instead of importing `scikit-learn` to save ~80MB of RAM.

### 5. Health Checks
- Ensure `/api/status` returns `200 OK` even if the loading `asyncio.create_task` is still running in the background.
- Render uses this path to verify the service is "Live".

### 6. Frontend & CORS Sync
- **Backend**: Set `allow_origins=["*"]` in `app.py`'s `CORSMiddleware` for production.
- **Frontend (Vercel)**: Always define `VITE_API_URL` without a trailing slash (e.g., `https://backend.onrender.com`) to match internal path construction.
