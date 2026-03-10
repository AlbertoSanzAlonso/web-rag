# Web RAG Explorer

Una herramienta potente y estética para convertir cualquier sitio web en una base de conocimientos interactiva utilizando RAG (Retrieval-Augmented Generation).

## Características

- **Scraping Dinámico**: Analiza y extrae contenido de cualquier URL en tiempo real.
- **Multi-Proveedor de IA**: Soporte para OpenAI (GPT), Google (Gemini) y Anthropic (Claude).
- **Interfaz Moderna**: UI minimalista y elegante construida con React, Tailwind CSS y Framer Motion.
- **Base de Datos Vectorial**: Soporte para **Pinecone** (recomendado para producción) y **FAISS** (local) para indexar y recuperar información relevante.

## Estructura del Proyecto

- `/backend`: Servidor FastAPI que gestiona el scraping, la vectorización y las cadenas de QA.
- `/frontend`: Aplicación React moderna para la interacción con el usuario.

## Instalación y Ejecución

### Backend

1. Crear un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Linux/macOS
   ```
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Ejecutar el servidor:
   ```bash
   uvicorn app:app --reload
   ```

### Frontend

1. Ir al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

## Notas Técnicas

- El proyecto utiliza **LangChain** para orquestar la lógica de RAG.
- Se requiere un archivo `.env` en la raíz del backend con:
  - `PINECONE_API_KEY`: Tu clave de Pinecone para persistencia en la nube.
  - `PINECONE_INDEX_NAME`: El nombre de tu índice (opcional, por defecto `web-rag`).
- Si no se define una clave de Pinecone, la aplicación utiliza **FAISS** localmente.
- Los datos scrapeados se almacenan en `webdata.db` (SQLite).
- Para **Claude**, se requiere una API Key de OpenAI para generar los embeddings.
