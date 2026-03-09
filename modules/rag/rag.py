from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_classic.chains import ConversationalRetrievalChain
from langchain_classic.memory import ConversationBufferMemory

def create_embeddings(provider: str, api_key: str, base_url: str = None):
    if provider == "openai":
        return OpenAIEmbeddings(openai_api_key=api_key)
    elif provider == "gemini":
        return GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
    elif provider == "claude":
        return OpenAIEmbeddings(openai_api_key=api_key)
    elif provider == "ollama":
        from langchain_community.embeddings import OllamaEmbeddings
        ollama_url = base_url or "http://localhost:11434"
        return OllamaEmbeddings(model="nomic-embed-text", base_url=ollama_url)
    else:
        raise ValueError(f"Provider {provider} not supported for embeddings")

def create_llm(provider: str, api_key: str, base_url: str = None):
    if provider == "openai":
        return ChatOpenAI(openai_api_key=api_key, temperature=0, model_name="gpt-3.5-turbo")
    elif provider == "gemini":
        return ChatGoogleGenerativeAI(google_api_key=api_key, temperature=0, model="gemini-1.5-flash")
    elif provider == "claude":
        return ChatAnthropic(anthropic_api_key=api_key, temperature=0, model_name="claude-3-opus-20240229")
    elif provider == "ollama":
        from langchain_community.llms import Ollama
        ollama_url = base_url or "http://localhost:11434"
        return Ollama(model="llama3.2", base_url=ollama_url, temperature=0)
    else:
        raise ValueError(f"Provider {provider} not supported")

def create_qa_chain(retriever, provider: str, api_key: str, embedding_key: str = None, base_url: str = None):
    llm = create_llm(provider, api_key, base_url=base_url)

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=False,
        verbose=False,
    )
    return chain