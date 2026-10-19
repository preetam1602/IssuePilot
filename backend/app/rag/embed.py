from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import settings

MODEL_NAME = "BAAI/bge-small-en-v1.5"


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    # Loaded on first use rather than at import, so processes that never embed
    # (and app startup) don't pay for it.
    return SentenceTransformer(
        MODEL_NAME,
        token=settings.hf_token,
        device="cpu"
    )


def embed_text(text:str)->list[float]:
    embedding=get_model().encode(
        text,
        normalize_embeddings=True
    )
    return embedding.tolist()

def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = get_model().encode(
        texts,
        batch_size=32,
        normalize_embeddings=True,
        show_progress_bar=len(texts) > 100
    )

    return embeddings.tolist()
