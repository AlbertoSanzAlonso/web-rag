import os
from modules.config import PINECONE_API_KEY, PINECONE_INDEX_NAME

FAISS_INDEX_PATH = "./faiss_index"

def build_vectordb(documents, embedding):
    """Crea un nuevo índice (Pinecone o FAISS) y lo persiste."""
    if PINECONE_API_KEY:
        from langchain_pinecone import PineconeVectorStore
        from pinecone import Pinecone, ServerlessSpec
        import time
        
        # Inicializar Pinecone
        pc = Pinecone(api_key=PINECONE_API_KEY)
        
        # Eliminar índice viejo si existe para re-indexar limpio
        if PINECONE_INDEX_NAME in [idx.name for idx in pc.list_indexes()]:
            print(f"🌲 Borrando índice previo '{PINECONE_INDEX_NAME}'...")
            pc.delete_index(PINECONE_INDEX_NAME)
        
        # Determinar dimensión basándose en el embedding
        sample_vec = embedding.embed_query("test")
        dimension = len(sample_vec)
        
        print(f"🌲 Creando nuevo índice Pinecone '{PINECONE_INDEX_NAME}' (dim={dimension})...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=dimension,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
        
        # Esperar a que el índice esté listo
        while not pc.describe_index(PINECONE_INDEX_NAME).status['ready']:
            time.sleep(1)
            
        vectordb = PineconeVectorStore.from_documents(
            documents, 
            embedding, 
            index_name=PINECONE_INDEX_NAME,
            pinecone_api_key=PINECONE_API_KEY
        )
        print(f"✅ Datos indexados en Pinecone.")
    else:
        from langchain_community.vectorstores import FAISS
        vectordb = FAISS.from_documents(documents, embedding=embedding)
        vectordb.save_local(FAISS_INDEX_PATH)
        print(f"💾 Índice FAISS guardado localmente en {FAISS_INDEX_PATH}")

    # --- NUEVO: Calcular y guardar proyecciones para visualización ---
    try:
        import numpy as np
        import json
        
        # Obtener vectores (desde los documentos para que funcione con Pinecone también)
        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        vectors = np.array(embedding.embed_documents(texts))

        if len(vectors) > 1:
            # PCA simple con Numpy
            X = vectors - np.mean(vectors, axis=0)
            cov = np.cov(X.T)
            evals, evecs = np.linalg.eigh(cov)
            idx = np.argsort(evals)[::-1]
            evecs = evecs[:, idx]
            X_2d = np.dot(X, evecs[:, :2])

            # Normalizar
            x_min, x_max = X_2d[:, 0].min(), X_2d[:, 0].max()
            y_min, y_max = X_2d[:, 1].min(), X_2d[:, 1].max()
            
            def scale(val, vmin, vmax):
                if vmax == vmin: return 0
                return float(((val - vmin) / (vmax - vmin)) * 200 - 100)

            points = []
            for i in range(len(vectors)):
                points.append({
                    "id": i,
                    "x": scale(X_2d[i, 0], x_min, x_max),
                    "y": scale(X_2d[i, 1], y_min, y_max),
                    "title": metadatas[i].get("title", "Documento"),
                    "snippet": texts[i][:100] + "..."
                })
            
            with open("projections.json", "w") as f:
                json.dump(points, f)
            print("✨ Mapa de visualización generado.")
    except Exception as e:
        print(f"⚠️ No se pudo generar el visualizador: {e}")
    
    retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 4})
    return vectordb, retriever

def load_vectordb(embedding):
    """Carga el índice (Pinecone o FAISS) desde persistencia."""
    if PINECONE_API_KEY:
        try:
            from langchain_pinecone import PineconeVectorStore
            from pinecone import Pinecone
            
            pc = Pinecone(api_key=PINECONE_API_KEY)
            if PINECONE_INDEX_NAME not in [idx.name for idx in pc.list_indexes()]:
                return None, None
                
            vectordb = PineconeVectorStore(
                index_name=PINECONE_INDEX_NAME,
                embedding=embedding,
                pinecone_api_key=PINECONE_API_KEY
            )
            print(f"🌲 Conectado a Pinecone: {PINECONE_INDEX_NAME}")
            retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 4})
            return vectordb, retriever
        except Exception as e:
            print(f"⚠️ Error cargando Pinecone: {e}")
            return None, None
    else:
        if not os.path.exists(FAISS_INDEX_PATH):
            return None, None
        try:
            from langchain_community.vectorstores import FAISS
            vectordb = FAISS.load_local(
                FAISS_INDEX_PATH,
                embedding,
                allow_dangerous_deserialization=True
            )
            print(f"📂 Índice FAISS cargado localmente")
            retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 4})
            return vectordb, retriever
        except Exception as e:
            print(f"⚠️ No se pudo cargar el índice FAISS: {e}")
            return None, None

def delete_vectordb():
    """Borra el índice del disco o de Pinecone."""
    if PINECONE_API_KEY:
        try:
            from pinecone import Pinecone
            pc = Pinecone(api_key=PINECONE_API_KEY)
            if PINECONE_INDEX_NAME in [idx.name for idx in pc.list_indexes()]:
                pc.delete_index(PINECONE_INDEX_NAME)
                print(f"🌲 Índice Pinecone '{PINECONE_INDEX_NAME}' eliminado.")
        except Exception as e:
            print(f"⚠️ Error eliminando índice Pinecone: {e}")
    
    import shutil
    if os.path.exists(FAISS_INDEX_PATH):
        shutil.rmtree(FAISS_INDEX_PATH)
        print(f"🗑️ Índice FAISS local eliminado.")
    if os.path.exists("projections.json"):
        os.remove("projections.json")

def get_projections(embedding=None):
    """
    Lee las proyecciones desde el archivo JSON guardado durante la indexación.
    """
    import json
    if os.path.exists("projections.json"):
        try:
            with open("projections.json") as f:
                return json.load(f)
        except:
            return []
    return []