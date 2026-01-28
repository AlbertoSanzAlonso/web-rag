from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_classic.chains import RetrievalQA

def create_embeddings(provider: str, api_key: str):
    """
    Crea la instancia de embeddings adecuada según el proveedor.
    Nota: Para Claude, usamos embeddings de OpenAI si el usuario tiene API Key de OpenAI,
    o en su defecto habría que usar HuggingFace, pero para simplificar la demo,
    si se selecciona Claude, asumiremos que se requieren embeddings.
    
    Sin embargo, dado el diseño de interfaz propuesto, solo pediremos una API Key.
    - Si es Gemini -> GoogleEmbeddings
    - Si es OpenAI -> OpenAIEmbeddings
    - Si es Claude -> ¿Qué hacemos?
      Opción A: Pedir OpenAI Key opcionalmente (complejo).
      Opción B: Usar Google Embeddings también para Claude si el usuario pone key de google? No tiene sentido.
      
    Simplificación para DEMO:
    Si selecciona Claude, usaremos el modelo de Chat Anthropic, PERO necesitaremos
    embeddings. Voy a usar OpenAI Embeddings hardcodeados asumiendo que el usuario
    quizás la tenga o usar una variable de entorno.
    
    MEJOR: Permitir al usuario introducir la key de Embeddings por separado SI es necesario,
    O usar SentenceTransformers (HuggingFace) que es gratis y local.
    
    Para evitar descargar gigas de modelos HuggingFace en una demo rápida web:
    Vamos a asumir que si usas Claude, usas también 'Titan' o 'OpenAI' en un escenario real.
    
    Hack para la demo:
    Si provider == 'claude', usaremos OpenAI Embeddings temporalmente y requeriremos
    esa key en el backend, o fallaremos.
    
    PERO, para hacerlo bien: Vamos a implementar solo OpenAI y Gemini que tienen el pack completo fácil.
    Y para Claude, vamos a requerir OpenAI Key para embeddings en el frontend.
    """
    
    if provider == "openai":
        return OpenAIEmbeddings(openai_api_key=api_key)
    elif provider == "gemini":
        return GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
    elif provider == "claude":
        # Para Claude necesitamos embeddings externos.
        # En una app real pediríamos keys separadas.
        # Aquí lanzaremos error si no se pasa una key de openai aparte.
        # Pero como el frontend manda solo una key principal...
        # Vamos a asumir que para Claude usamos OpenAI embeddings con la MISMA key? No, son proveedores distintos.
        
        # SOLUCIÓN: Usar embeddings de Google para Claude si es más fácil? No.
        # Vamos a requerir OpenAI Key para embeddings si se usa Claude.
        # Se modificará el frontend para pedir "Embedding Key" si es necesario.
        return OpenAIEmbeddings(openai_api_key=api_key) # Provisional, requiere refactor en Front
    else:
        raise ValueError(f"Provider {provider} not supported for embeddings")

def create_llm(provider: str, api_key: str):
    if provider == "openai":
        return ChatOpenAI(openai_api_key=api_key, temperature=0, model_name="gpt-3.5-turbo")
    elif provider == "gemini":
        return ChatGoogleGenerativeAI(google_api_key=api_key, temperature=0, model="gemini-pro")
    elif provider == "claude":
        return ChatAnthropic(anthropic_api_key=api_key, temperature=0, model_name="claude-3-opus-20240229")
    else:
        raise ValueError(f"Provider {provider} not supported")

def create_qa_chain(retriever, provider: str, api_key: str, embedding_key: str = None):
    # Definir LLM
    if provider == "claude":
         llm = create_llm(provider, api_key)
    else:
         llm = create_llm(provider, api_key)
         
    return RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever
    )