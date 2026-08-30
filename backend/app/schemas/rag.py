from typing import Any

from pydantic import BaseModel

class RAGSearchRequest(BaseModel):
    query:str
    top_k:int

class RAGSearchResult(BaseModel):
    score:float
    chunk_id:str
    text:str
    metadata:dict[str,Any]

class RAGSearchResponse(BaseModel):
    result:list[RAGSearchResult]

class RAGIngestRequest(BaseModel):
    file_path:str
    document_id:str
    title:str
    source:str
    organization:str
    document_type:str
    year:int

class RAGIngestResponse(BaseModel):
    chunks_upserted:int