from app.vectorstore.chroma_client import get_chroma_client

async def retrieve_context(query: str, k: int = 3):
    if not query.strip():
        return ""
        
    vectorstore = get_chroma_client()
    docs = await vectorstore.asimilarity_search(query, k=k)
    return "\n\n".join([doc.page_content for doc in docs])
