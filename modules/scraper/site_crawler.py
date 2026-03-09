"""
Crawler asíncrono que recorre un sitio web de forma concurrente,
extrayendo título, texto y links de cada página, y guardando los
resultados en SQLite. Usa httpx + asyncio para mayor velocidad.
"""

import asyncio
import httpx
import sqlite3
import json
from bs4 import BeautifulSoup
from modules.utils.utils import normalize_links, is_same_domain

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; WebRAG-Bot/1.0; +https://github.com/web-rag)"
    )
}

# ── Parseo HTML ──────────────────────────────────────────────────────────────

def parse_page(url: str, html: bytes) -> dict:
    """Extrae título, texto limpio y links de un blob HTML."""
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.string.strip() if soup.title else "Sin título"
    if soup.body:
        for tag in soup.body(["script", "style", "img", "input", "noscript", "nav", "footer"]):
            tag.decompose()
        text = soup.body.get_text(separator="\n", strip=True)
    else:
        text = ""
    raw_links = [a.get("href") for a in soup.find_all("a") if a.get("href")]
    links = normalize_links(url, raw_links)
    return {"url": url, "title": title, "text": text, "links": links, "summary": ""}

# ── Descarga concurrente de un lote de URLs ──────────────────────────────────

async def fetch_batch(
    urls: list[str],
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    on_progress=None,
) -> list[dict]:
    """Descarga un lote de URLs en paralelo respetando el semáforo."""

    async def fetch_one(url: str) -> dict | None:
        async with semaphore:
            try:
                resp = await client.get(url, follow_redirects=True, timeout=10.0)
                page = parse_page(url, resp.content)
                if on_progress:
                    on_progress(url)
                return page
            except Exception as e:
                print(f"❌ Error al scrapear {url}: {e}")
                return None

    results = await asyncio.gather(*[fetch_one(u) for u in urls])
    return [r for r in results if r is not None]

# ── Crawler principal ─────────────────────────────────────────────────────────

async def scrape_website_async(
    base_url: str,
    max_pages: int = 50,
    concurrency: int = 10,
    on_progress=None,
) -> list[dict]:
    """
    Recorre un sitio web de forma asíncrona y concurrente.
    - concurrency: máximo de peticiones HTTP simultáneas.
    - on_progress(url): callback llamado cada vez que se termina una página.
    """
    visited: set[str] = set()
    pending: list[str] = [base_url]
    data: list[dict] = []

    semaphore = asyncio.Semaphore(concurrency)

    async with httpx.AsyncClient(headers=HEADERS, verify=False) as client:
        while pending and len(visited) < max_pages:
            # Tomar el siguiente lote respetando el límite total
            remaining = max_pages - len(visited)
            batch = []
            for url in pending:
                if url not in visited and len(batch) < remaining:
                    batch.append(url)
            pending = [u for u in pending if u not in batch]
            visited.update(batch)

            pages = await fetch_batch(batch, client, semaphore, on_progress)
            data.extend(pages)
            print(f"📥 Descargadas {len(data)}/{max_pages} páginas...")

            # Encolar nuevos links del mismo dominio
            for page in pages:
                for link in page.get("links", []):
                    if is_same_domain(base_url, link) and link not in visited:
                        pending.append(link)

    return data

# ── Wrapper síncrono (para compatibilidad si se llama desde código sync) ─────

def scrape_website(base_url: str, max_pages: int = 50, delay: float = 0.0) -> list[dict]:
    """Wrapper síncrono sobre scrape_website_async."""
    return asyncio.run(scrape_website_async(base_url, max_pages=max_pages))

# ── Guardar en SQLite ────────────────────────────────────────────────────────

def save_to_db(data: list[dict], db_path: str = "webdata.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS pages (
            url TEXT PRIMARY KEY,
            title TEXT,
            text TEXT,
            links TEXT,
            summary TEXT
        )
    """)
    for page in data:
        c.execute(
            "INSERT OR REPLACE INTO pages (url, title, text, links, summary) VALUES (?, ?, ?, ?, ?)",
            (page["url"], page["title"], page["text"], json.dumps(page["links"]), page.get("summary", ""))
        )
    conn.commit()
    conn.close()
    print(f"💾 Guardadas {len(data)} páginas en {db_path}")