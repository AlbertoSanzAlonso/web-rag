# Web RAG Explorer

Una herramienta potente y estética para convertir cualquier sitio web en una base de conocimientos interactiva utilizando RAG (Retrieval-Augmented Generation).

## Características

- **Scraping Dinámico**: Analiza y extrae contenido de cualquier URL en tiempo real.
- **Multi-Proveedor de IA**: Soporte para OpenAI (GPT), Google (Gemini) y Anthropic (Claude).
- **Interfaz Moderna**: UI minimalista y elegante construida con React, Tailwind CSS y Framer Motion.
- **Base de Datos Vectorial**: Utiliza ChromaDB para indexar y recuperar información relevante rápidamente.

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
- Para **Claude**, se requiere una API Key de OpenAI para generar los embeddings del texto, ya que Anthropic no proporciona un modelo de embeddings directo en esta implementación.
- Los datos se almacenan temporalmente en `webdata.db` (SQLite) y en la carpeta `vectordb/`.
