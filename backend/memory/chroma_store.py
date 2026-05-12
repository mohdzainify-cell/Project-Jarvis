import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings
import hashlib


class ChromaMemory:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.chroma_path,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="jarvis_memory",
            metadata={"hnsw:space": "cosine"}
        )

    async def add(self, user_input: str, assistant_response: str):
        doc_id = hashlib.md5(f"{user_input}{assistant_response}".encode()).hexdigest()
        self.collection.upsert(
            documents=[f"User: {user_input}\nJARVIS: {assistant_response}"],
            ids=[doc_id],
        )

    async def query(self, text: str, n_results: int = 3) -> list[dict]:
        if self.collection.count() == 0:
            return []
        try:
            results = self.collection.query(
                query_texts=[text],
                n_results=min(n_results, self.collection.count()),
            )
            docs = results.get("documents", [[]])[0]
            return [{"document": d} for d in docs]
        except Exception:
            return []