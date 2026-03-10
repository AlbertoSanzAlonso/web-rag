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
    elif provider == "groq":
        # FastEmbed is much lighter and faster than HuggingFace/Torch for Render Free Tier
        from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
        return FastEmbedEmbeddings(
            model_name="BAAI/bge-small-en-v1.5" # Very lightweight and high performance
        )
    else:
        raise ValueError(f"Provider {provider} not supported for embeddings")

def create_llm(provider: str, api_key: str, base_url: str = None):
    if provider == "openai":
        return ChatOpenAI(openai_api_key=api_key, temperature=0, model_name="gpt-3.5-turbo", streaming=True)
    elif provider == "gemini":
        return ChatGoogleGenerativeAI(google_api_key=api_key, temperature=0, model="gemini-1.5-flash", streaming=True)
    elif provider == "claude":
        return ChatAnthropic(anthropic_api_key=api_key, temperature=0, model_name="claude-3-opus-20240229", streaming=True)
    elif provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            groq_api_key=api_key,
            model_name="llama-3.1-8b-instant",
            temperature=0,
            streaming=True
        )
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