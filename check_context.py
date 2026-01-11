import asyncio
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.vectorstore.retriever import retrieve_context

async def main():
    try:
        from app.vectorstore.chroma_client import get_chroma_client
        vs = get_chroma_client()
        count = vs._collection.count()
        print(f"COUNT: {count}")
        if count > 0:
            all_docs = vs._collection.get(limit=5)
            print(f"SAMPLE: {all_docs['metadatas']}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
