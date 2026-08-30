
from typing import Any


def create_document_metadata(
    document_id: str,
    title: str,
    source: str,
    organization: str,
    document_type: str,
    year: int,
) -> dict[str, Any]:
    """
    Create metadata for the source document.
    """

    return {
        "document_id": document_id,
        "title": title,
        "source": source,
        "organization": organization,
        "document_type": document_type,
        "year": year,
    }


def add_metadata(
    chunks: list[dict[str, Any]],
    document_metadata: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Attach document-level and chunk-level metadata
    to every chunk.
    """

    enriched_chunks = []

    for chunk in chunks:

        chunk_id = (
            f"{document_metadata['document_id']}"
            f"_chunk_{chunk['chunk_index']:04d}"
        )

        metadata = {
            **document_metadata,

            # Information produced by chunker.py
            "chapter": chunk.get("chapter"),
            "section": chunk.get("section"),
            "subsection": chunk.get("subsection"),
            "pages": chunk.get("pages"),
        }

        enriched_chunks.append(
            {
                "chunk_id": chunk_id,
                "text": chunk["text"],
                "metadata": metadata,
            }
        )

    return enriched_chunks