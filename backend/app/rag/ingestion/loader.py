from pathlib import Path
from pypdf import PdfReader

def load_pdf(file_path:Path):
    return PdfReader(file_path)

def extract_pages(reader):
    return reader.pages

def extract_text(pages):
    text=[]

    for page in pages:
        text.append(page.extract_text())

    return text

def load_document(file_path:Path):
    reader=load_pdf(file_path)
    pages=extract_pages(reader)
    texts=extract_text(pages)

    return [
        {"page": index + 1, "text": text}
        for index, text in enumerate(texts)
    ]