import os
import json
import fitz  # PyMuPDF
from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions

def ingest_pdfs(source_dir, db_path):
    print(f"Scanning directory: {source_dir}")
    
    # Initialize ChromaDB
    client = chromadb.PersistentClient(path=db_path)
    # Use default sentence-transformer model
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    collection = client.get_or_create_collection(
        name="judgments",
        embedding_function=emb_fn
    )
    
    count = 0
    # Walk through years
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if file.lower().endswith(".pdf"):
                path = os.path.join(root, file)
                try:
                    doc = fitz.open(path)
                    # Extract first 2 pages for context
                    text = ""
                    for i in range(min(2, len(doc))):
                        text += doc[i].get_text()
                    
                    year = Path(path).parent.name
                    title = file.replace(".PDF", "").replace("_", " ")
                    
                    # Store in ChromaDB
                    collection.add(
                        documents=[text[:2000]], # Text snippet for embedding/retrieval
                        metadatas=[{
                            "title": title,
                            "year": year,
                            "action": title, # Using title as action for historical
                            "outcome": f"Historical SC Judgment ({year})"
                        }],
                        ids=[f"doc_{count}_{year}"]
                    )
                    
                    count += 1
                    if count % 10 == 0:
                        print(f"Processed {count} judgments...")
                    
                    # Limit to 50 for prototype speed
                    if count >= 50:
                        break
                except Exception as e:
                    print(f"Error processing {file}: {e}")
        if count >= 50: break

    print(f"Done! Vectorized and added {count} historical cases to ChromaDB at {db_path}")

if __name__ == "__main__":
    KAGGE_DIR = os.path.join(os.path.dirname(__file__), "../backend/data/archive (1)/supreme_court_judgments")
    DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
    
    if os.path.exists(KAGGE_DIR):
        ingest_pdfs(KAGGE_DIR, DB_PATH)
    else:
        print(f"Directory not found: {KAGGE_DIR}")
