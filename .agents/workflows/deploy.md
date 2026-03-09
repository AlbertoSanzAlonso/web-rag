---
description: How to push changes and monitor Render deployment.
---

# 🚀 Render Deployment Workflow

1.  **Check RAM constraints**: Ensure that you haven't added any heavy dependencies (like `torch` or `transformers`) to `requirements.txt`.
2.  **Verify lazy imports**: Confirm that any new heavy AI import in `app.py` is inside an `async def` or a function handler, not at the module's top level.
3.  **Commit changes**:
    ```bash
    git add .
    git commit -m "Your descriptive message"
    ```
4.  **Push to main**:
    ```bash
    git push origin main
    ```
5.  **Monitor Render Dashboard**:
    -   Go to [dashboard.render.com](https://dashboard.render.com).
    -   Select the `web-rag-backend` service.
    -   Check the **Logs** tab.
    -   Look for `DEBUG: Starting app` and verify that the health check on `/api/status` returns `200 OK`.
6.  **Verify Port Binding**: If the log says `Port scan timeout reached`, double-check that `uvicorn` is starting immediately (non-blocking `on_startup`).
