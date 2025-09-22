import requests
from bs4 import BeautifulSoup
import openai
from config import OPENAI_API_KEY
from prompts import system_prompt

openai.api_key = OPENAI_API_KEY

class Website:
    """
    Representa un sitio web scrappeado y prepara su texto para procesamiento.
    """
    def __init__(self, url):
        self.url = url
        response = requests.get(url)
        self.body = response.content
        soup = BeautifulSoup(self.body, 'html.parser')
        self.title = soup.title.string if soup.title else "Sin título"
        if soup.body:
            for irrelevant in soup.body(["script", "style", "img", "input"]):
                irrelevant.decompose()
            self.text = soup.body.get_text(separator="\n", strip=True)
        else:
            self.text = ""
        links = [link.get('href') for link in soup.find_all('a')]
        self.links = [link for link in links if link]

    def get_contents(self):
        return f"Título de la Web:\n{self.title}\nContenido de la Web:\n{self.text}\n\n"

def user_prompt_for(website: Website) -> str:
    """
    Genera el prompt de usuario para el LLM basado en el contenido del sitio web.
    """
    prompt = (
        f"Estas viendo un sitio web titulado: {website.title}\n"
        "Proporciona un breve resumen de este sitio web en formato Markdown. "
        "Si incluye noticias, productos o anuncios, resúmelos también.\n\n"
        f"{website.text}"
    )
    return prompt

def messages_for(website: Website):
    """
    Construye la lista de mensajes para la API de chat.
    """
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt_for(website)}
    ]

def summarize(url: str) -> str:
    """
    Resumen de la página web usando OpenAI Chat API (v1.0+).
    """
    website = Website(url)
    if not website.text:
        return "❌ No se pudo extraer contenido del sitio web."

    messages = messages_for(website)

    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ Error en la llamada a OpenAI: {e}")
        return "❌ Error al generar el resumen."

def get_links_user_prompt(website):
    user_prompt = f"Aquí hay una lista de enlaces de la página web {website.url} - "
    user_prompt += "Por favor, decide cuáles de estos son enlaces web relevantes para un folleto sobre la empresa. Responde con la URL https completa en formato JSON. \
No incluyas Términos y Condiciones, Privacidad ni enlaces de correo electrónico.\n"
    user_prompt += "Links (puede que algunos sean links relativos):\n"
    user_prompt += "\n".join(website.links)
    return user_prompt

