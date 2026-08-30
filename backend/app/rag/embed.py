import os

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

MODEL_NAME = "BAAI/bge-small-en-v1.5"
HF_TOKEN = os.getenv("HF_TOKEN")


model=SentenceTransformer(
    MODEL_NAME,
    token=HF_TOKEN,
    device="cpu"
)

def embed_text(text:str)->list[float]:
    embedding=model.encode(
        text,
        normalize_embeddings=True
    )
    return embedding.tolist()

def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = model.encode(
        texts,
        batch_size=4,
        normalize_embeddings=True,
        show_progress_bar=True
    )

    return embeddings.tolist()