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

def get_projections(embedding):
    """
    Obtiene los vectores y calcula proyecciones 2D para visualización.
    Usa un PCA simplificado con Numpy para no cargar scikit-learn (ahorro de RAM).
    """
    import numpy as np
    
    # Por ahora implementado para FAISS principalmente
    if not os.path.exists(FAISS_INDEX_PATH):
        return []

    try:
        from langchain_community.vectorstores import FAISS
        vectordb = FAISS.load_local(FAISS_INDEX_PATH, embedding, allow_dangerous_deserialization=True)
        
        # Extraer vectores reales de FAISS
        index = vectordb.index
        n = index.ntotal
        if n == 0: return []
        
        vectors = np.array([index.reconstruct(i) for i in range(n)])
        metadatas = [vectordb.docstore.search(vectordb.index_to_docstore_id[i]).metadata for i in range(n)]
        contents = [vectordb.docstore.search(vectordb.index_to_docstore_id[i]).page_content for i in range(n)]

        # PCA simple con Numpy
        # 1. Normalizar
        X = vectors - np.mean(vectors, axis=0)
        # 2. Matriz de covarianza
        cov = np.cov(X.T)
        # 3. Autovalores y autovectores
        evals, evecs = np.linalg.eigh(cov)
        # 4. Proyectar a las 2 dimensiones top
        idx = np.argsort(evals)[::-1]
        evecs = evecs[:, idx]
        X_2d = np.dot(X, evecs[:, :2])

        # Normalizar a rango -100 a 100 para el frontend
        x_min, x_max = X_2d[:, 0].min(), X_2d[:, 0].max()
        y_min, y_max = X_2d[:, 1].min(), X_2d[:, 1].max()
        
        def scale(val, vmin, vmax):
            if vmax == vmin: return 0
            return ((val - vmin) / (vmax - vmin)) * 200 - 100

        points = []
        for i in range(n):
            points.append({
                "id": i,
                "x": float(scale(X_2d[i, 0], x_min, x_max)),
                "y": float(scale(X_2d[i, 1], y_min, y_max)),
                "title": metadatas[i].get("title", "Documento"),
                "snippet": contents[i][:100] + "..."
            })
        
        return points
    except Exception as e:
        print(f"⚠️ Error calculando proyecciones: {e}")
        return []