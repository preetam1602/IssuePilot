from pathlib import Path

from app.rag.ingestion.loader import load_document
from app.rag.ingestion.cleaner import clean_document
from app.rag.ingestion.chunker import chunk_document
from app.rag.ingestion.metadata import create_document_metadata, add_metadata
from app.rag.embed import embed_texts
from app.rag.qdrant_client import ensure_collection, upsert_chunks


def ingest_document(
    file_path: Path,
    document_id: str,
    title: str,
    source: str,
    organization: str,
    document_type: str,
    year: int,
) -> int:
    """Load, clean, chunk, embed, and upsert a PDF into Qdrant. Returns chunk count."""

    pages = load_document(file_path)
    pages = clean_document(pages)
    chunks = chunk_document(pages)

    document_metadata = create_document_metadata(
        document_id=document_id,
        title=title,
        source=source,
        organization=organization,
        document_type=document_type,
        year=year,
    )
    enriched_chunks = add_metadata(chunks, document_metadata)

    texts = [chunk["text"] for chunk in enriched_chunks]
    embeddings = embed_texts(texts)

    for chunk, embedding in zip(enriched_chunks, embeddings):
        chunk["embedding"] = embedding

    ensure_collection()
    upsert_chunks(enriched_chunks)

    return len(enriched_chunks)
