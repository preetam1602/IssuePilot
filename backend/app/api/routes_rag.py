from pathlib import Path

from fastapi import APIRouter

from app.rag.retriever import search_document
from app.rag.pipeline import ingest_document
from app.schemas.rag import RAGSearchRequest,RAGSearchResponse,RAGIngestRequest,RAGIngestResponse
router=APIRouter(prefix="/rag",tags=["RAG"])

@router.post("/search",response_model=RAGSearchResponse)
def rag_search(request:RAGSearchRequest):
    results=search_document(query=request.query,top_k=request.top_k)
    return {
        "result":results
    }

@router.post("/ingest",response_model=RAGIngestResponse)
def rag_ingest(request:RAGIngestRequest):
    chunks_upserted=ingest_document(
        file_path=Path(request.file_path),
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
