from langchain_community.vectorstores import FAISS

# Crear vector store desde documentos

def build_vectordb(documents, embedding):
    vectordb = FAISS.from_documents(
        documents,
        embedding=embedding
    )
    
    # Opcional: guardar localmente
    # vectordb.save_local("./faiss_index")

    # Crear retriever
    retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 3})
    return vectordb, retriever