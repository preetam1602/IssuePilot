from app.rag.qdrant_client import get_qdrant_client

def check_qdrant():
    client=get_qdrant_client()
    collections=client.get_collections()
    return{
        "status":"connected",
        "collections":[
            collection.name
            for collection in collections.collections
        ]
    }