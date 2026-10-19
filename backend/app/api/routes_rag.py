from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from app.config import settings
from app.rag.retriever import search_document
from app.rag.pipeline import ingest_document
from app.schemas.rag import RAGSearchRequest,RAGSearchResponse,RAGIngestRequest,RAGIngestResponse
from app.services.auth import get_current_user, require_admin
router=APIRouter(prefix="/rag",tags=["RAG"])


def resolve_document_path(file_path:str)->Path:
    """Resolve a path relative to the RAG documents dir, refusing anything that escapes it."""
    documents_dir=Path(settings.rag_documents_dir).resolve()
    resolved=(documents_dir/file_path).resolve()
    if not resolved.is_relative_to(documents_dir) or not resolved.is_file():
        raise HTTPException(400,f"file_path must name a file inside {settings.rag_documents_dir}")
    return resolved


@router.post("/search",response_model=RAGSearchResponse,dependencies=[Depends(get_current_user)])
def rag_search(request:RAGSearchRequest):
    results=search_document(query=request.query,top_k=request.top_k)
    return {
        "result":results
    }

@router.post("/ingest",response_model=RAGIngestResponse,dependencies=[Depends(require_admin)])
def rag_ingest(request:RAGIngestRequest):
    chunks_upserted=ingest_document(
        file_path=resolve_document_path(request.file_path),
        document_id=request.document_id,
        title=request.title,
        source=request.source,
        organization=request.organization,
        document_type=request.document_type,
        year=request.year,
    )
    return {
        "chunks_upserted":chunks_upserted
    }
