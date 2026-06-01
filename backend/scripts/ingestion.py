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
    # remove non-printable characters
    text = re.sub(r"[^\x20-\x7E\n]", "", text)
    return text.strip()

#generate unique hash for file content
def get_hash(filepath):
    hasher = hashlib.shake_256()

    with open(filepath,"rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)

def already_ingested(file_hash):
    results = collection.get(
        where = { "file_hash": file_hash},
        limit = 1
    )
    return len(results["ids"])>0

def ingest(path):
    file_hash = get_hash(path)

    if already_ingested(file_hash):
        return
    
    reader = PdfReader(path)
    text = "\n\n".join(page.extract_text() for page in reader.pages)
    cleaned = clean_text(text)
    chunks = []
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 1000,
        chunk_overlap = 200,
    )
    chunks = splitter.split_text(cleaned)

    if not chunks:
        return

    embeddings = model.encode(chunks)

    ids = [
        f"{file_hash}_{i}"
        for i in range(len(chunks))
    ]

    metadatas = [
        {
            "source": path.name,
            "file_hash": file_hash,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]

    collection.add(
        ids = ids,
        documents=chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas
    )

def ingest_folder(folder_path = "materials"):
    folder = Path(folder_path)

    pdfs = list(folder.glob("*.pdf"))

    if not pdfs:
        return
    
    for pdf in pdfs:
        try:
            ingest(pdf)
        except Exception as e:
            print(f"Error processing {pdf.name}: {e}")

ingest_folder()