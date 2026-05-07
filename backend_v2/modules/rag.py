import os
import chromadb
from chromadb.utils import embedding_functions

# Initialize ChromaDB at module level to avoid reloading on every request
DB_PATH = os.path.join(os.path.dirname(__file__), "../chroma_db")

# Global variables for the client and embedding function
_client = None
_emb_fn = None
_collection = None

def get_collection():
    global _client, _emb_fn, _collection
    if _collection is None:
        if not os.path.exists(DB_PATH):
            return None
        
        try:
            _client = chromadb.PersistentClient(path=DB_PATH)
            _emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            _collection = _client.get_collection(
                name="judgments",
                embedding_function=_emb_fn
            )
        except Exception as e:
            print(f"Failed to initialize ChromaDB: {e}")
            return None
    return _collection

def find_similar_cases(text: str):
    """
    Search for similar cases in ChromaDB.
    """
    collection = get_collection()
    if collection is None:
        return []

    try:
        results = collection.query(
            query_texts=[text[:2000]],
            n_results=3
        )

        formatted_results = []
        if results and results['documents']:
            for i in range(len(results['documents'][0])):
                meta = results['metadatas'][0][i]
                raw_text = results['documents'][0][i]
                # Trim to a clean sentence boundary (max 300 chars)
                directive_snippet = raw_text[:400] # Take a bit more to find a good break
                
                # Try to find the last sentence end within the first 300-400 chars
                last_stop = -1
                for marker in ['. ', '! ', '? ']:
                    pos = directive_snippet.rfind(marker, 0, 350)
                    if pos > last_stop:
                        last_stop = pos
                
                if last_stop > 100:  # only trim if we found a reasonable sentence end
                    directive_snippet = directive_snippet[:last_stop + 1]
                else:
                    # If no sentence end found, try to break at a space
                    space_pos = directive_snippet.rfind(' ', 0, 300)
                    if space_pos > 200:
                        directive_snippet = directive_snippet[:space_pos] + "..."
                    else:
                        directive_snippet = directive_snippet[:300].strip() + "..."

                # Sanitize the snippet
                directive_snippet = directive_snippet.replace('"', '"').replace('"', '"').replace("'", "'").replace("'", "'")
                directive_snippet = directive_snippet.replace('\\"', '"').strip()

                formatted_results.append({
                    "case_id": results['ids'][0][i],
                    "title": meta.get("title", "Similar Case").replace("_", " "),
                    "similarity": 1.0 - (results['distances'][0][i] if 'distances' in results else 0),
                    "relevant_directive": directive_snippet,
                    "year": meta.get("year", "N/A"),
                    "action_plan": meta.get("action", "No historical action plan available")
                })

        return formatted_results
    except Exception as e:
        print(f"RAG Error: {e}")
        return []
