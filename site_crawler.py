"""
Este módulo implementa un crawler que recorre un sitio web completo,
utilizando la clase Website para extraer título, texto y links de cada página,
y guarda los resultados en una base de datos SQLite.
"""

from urllib.parse import urljoin, urlparse
from scraper import Website, summarize 
import sqlite3
import time
import requests
from config import BASE_URL
import json

# ---------------------------
# Funciones auxiliares
# ---------------------------

def normalize_links(base_url, links):
    return [urljoin(base_url, link) for link in links]

def is_same_domain(base_url, link):
    """Comprueba si un link pertenece al mismo dominio que base_url"""
    return urlparse(base_url).netloc == urlparse(link).netloc

# ---------------------------
# Scraping de una página
# ---------------------------

def scrape_page(url, delay=0.5):
    """
    Crea un objeto Website para una URL y devuelve un diccionario con:
    url, title, text, links normalizados.
    Maneja errores y espera delay segundos para no saturar el servidor.
    """
    try:
        website = Website(url)
        time.sleep(delay)
        page_data = {
            "url": website.url,
            "title": website.title,
            "text": website.text,
            "links": normalize_links(website.url, website.links),
            "summary": summarize(url)
        }
        return page_data
    except requests.RequestException as e:
        print(f"❌ Error al scrapear {url}: {e}")
        return {"url": url, "title": "", "text": "", "links": []}

# ---------------------------
# Crawler del sitio completo
# ---------------------------

def scrape_website(base_url, max_pages=50, delay=0.5):
    """
    Recorre un sitio web empezando desde base_url.
    Devuelve una lista de diccionarios con datos de cada página.
    """
    visited = set()
    to_visit = [base_url]
    data = []

    while to_visit and len(visited) < max_pages:
        url = to_visit.pop(0)
        if url in visited:
            continue
        visited.add(url)

        page_data = scrape_page(url, delay=delay)
        data.append(page_data)
        print(f"✅ Scrapée: {url} ({len(data)} páginas acumuladas)")

        # Añadimos nuevos links del mismo dominio
        for link in page_data["links"]:
            if is_same_domain(base_url, link) and link not in visited:
                to_visit.append(link)

    return data

# ---------------------------
# Guardar en base de datos
# ---------------------------

def save_to_db(data, db_path="webdata.db"):
    """
    Guarda la lista de páginas en una base de datos SQLite.
    Incluye URL, título, texto y links (JSON).
    """
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
        c.execute("""
            INSERT OR REPLACE INTO pages (url, title, text, links, summary) VALUES (?, ?, ?, ?, ?)
            """, 
            (page["url"], page["title"], page["text"], json.dumps(page["links"]), page.get("summary", "")))

    conn.commit()
    conn.close()
    print(f"💾 Guardadas {len(data)} páginas en {db_path}")

# ---------------------------
# Uso del módulo
# ---------------------------

if __name__ == "__main__":
    base_url = BASE_URL  # cambia por el sitio que quieras scrapear
    all_data = scrape_website(base_url, max_pages=100, delay=0.5)
    save_to_db(all_data)