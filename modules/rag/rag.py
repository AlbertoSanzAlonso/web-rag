from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

def create_qa_chain(retriever, api_key):
    return RetrievalQA.from_chain_type(
        llm=ChatOpenAI(openai_api_key=api_key, temperature=0),
        retriever=retriever
    )