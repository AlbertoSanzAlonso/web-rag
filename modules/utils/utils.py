from urllib.parse import urljoin, urlparse

def normalize_links(base_url, links):
    return [urljoin(base_url, link) for link in links]

def is_same_domain(base_url, link):
    return urlparse(base_url).netloc == urlparse(link).netloc
