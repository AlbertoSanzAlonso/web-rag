from langchain_community.vectorstores import Chroma

# Crear vector store desde documentos

def build_vectordb(documents, embedding):
    vectordb = Chroma.from_documents(
        documents,
        embedding=embedding,
        persist_directory="./vectordb"
    )

        # Crear retriever
    retriever = vectordb.as_retriever(search_type="similarity", search_kwargs={"k": 3})
    return vectordb, retriever