from pypdf import PdfReader
from pathlib import Path
import hashlib
import re

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

import chromadb

#embedding model
model = SentenceTransformer("all-MiniLM-L6-v2") #chose MiniLM becuase its small and good enough for embeddings. might switch to allenai/specter later

#chroma
client = chromadb.PersistentClient(path = "./data/chroma")
collection = client.get_or_create_collection("Study_materials")

def clean_text(text):
    # remove pypdf float garbage
    text = re.sub(r"b'[^']*'", "", text)
    # remove multiple spaces/newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()

#generate unique hash for file content
def get_hash(filepath):
    #sha256 - sha256 acts as a stateful machine designed to enfore 3 strict rules, deterministic, one way and avalanche effect (small change leads ti a drastically different result)
    hasher = hashlib.sha256()

    #read file in binary mode and 8kb chunks and then feeds it to the hash
    with open(filepath,"rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)

    return hasher.hexdigest()

#check if the hash exists in chroma, if it does returns True else False
def already_ingested(file_hash):
    results = collection.get(
        where = { "file_hash": file_hash},
        limit = 1
    )
    return len(results["ids"])>0

#this function was seperated for identifying subtopic 
def extract_text(path):
    path = Path(path)
    reader = PdfReader(path)
    text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
    return clean_text(text)

def ingest(path,topic_id):
    path = Path(path)
    file_hash = get_hash(path)
    if already_ingested(file_hash):
        return{
            "status":"skipped",
            "reason":"duplicate",
            "file_hash":file_hash
        }
    
    text = extract_text(path)

    chunks = []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 1000,
        chunk_overlap = 200,
    )
    chunks = splitter.split_text(text)

    if not chunks:
        return{
            "status": "skipped",
            "reason": "no_text",
            "file_hash": file_hash
        }

    embeddings = model.encode(chunks)

    ids = [
        f"{file_hash}_{i}"
        for i in range(len(chunks))
    ]

    metadatas = [
        {
            "source": path.name,
            "file_hash": file_hash,
            "topic_id": topic_id,
            "chunk_index": i
        }
        for i in range(len(chunks))
    ]

    collection.add(
        ids = ids,
        documents=chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas
    )
    return {
        "status": "ingested",
        "file_hash": file_hash,
        "chunks": len(chunks)
    }

def ingest_folder(folder_path,topic_id):
    folder = Path(folder_path)

    pdfs = list(folder.glob("*.pdf"))

    if not pdfs:
        return
    
    for pdf in pdfs:
        try:
            ingest(pdf,topic_id)
        except Exception as e:
            print(f"Error processing {pdf.name}: {e}")

# ingest_folder()

results = collection.get(include=["metadatas"])

unique_files = {
    metadata["file_hash"]
    for metadata in results["metadatas"]
}

print(f"Total PDFs ingested: {len(unique_files)}")