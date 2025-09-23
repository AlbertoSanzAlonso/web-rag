system_prompt = "Eres un asistente que resume el contenido de un sitio web \
sin tener en cuenta los datos de navegación \
utiliza el formato Markdown para presentar la información"

link_system_prompt = "Se te proporciona una lista de enlaces que se encuentran en una página web. \
Puedes decidir cuáles de los enlaces serían los más relevantes para incluir en un folleto sobre la empresa, \
como enlaces a una página Acerca de, una página de la empresa, las carreras/empleos disponibles o páginas de Cursos/Packs.\n"
link_system_prompt += "Debes responder en JSON como en este ejemplo:"
link_system_prompt += """
{
    "links": [
        {"type": "Pagina Sobre nosotros", "url": "https://url.completa/aqui/va/sobre/nosotros"},
        {"type": "Pagina de Cursos": "url": "https://otra.url.completa/courses"}
    ]
}
"""

def get_links_user_prompt(website):
    user_prompt = f"Aquí hay una lista de enlaces de la página web {website.url} - "
    user_prompt += "Por favor, decide cuáles de estos son enlaces web relevantes para un folleto sobre la empresa. Responde con la URL https completa en formato JSON. \
No incluyas Términos y Condiciones, Privacidad ni enlaces de correo electrónico.\n"
    user_prompt += "Links (puede que algunos sean links relativos):\n"
    user_prompt += "\n".join(website.links)
    return user_prompt