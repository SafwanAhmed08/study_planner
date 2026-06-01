from pypdf import PdfReader
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer("all-MiniLM-L6-v2") #chose MiniLM becuase its small and good enough for embeddings. might switch to allenai/specter later


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

def ingest(path = "/Users/safwanahmed/Desktop/Projects/study_planner/CC.pdf"):
    reader = PdfReader(path)
    text = "\n\n".join(page.extract_text() for page in reader.pages)
    cleaned = clean_text(text)
    chunks = []
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 1000,
        chunk_overlap = 200,
    )
    chunks = splitter.split_text(cleaned)


    embeddings = model.encode(chunks)

    collection.add(
        documents=chunks,
        embeddings=embeddings.tolist(),
        ids = [f"chunk_{i}" for i in range(len(chunks))]
    )
    # results = collection.query(query_texts=["what is cloud computing"], n_results=1)
    # print(results["documents"])

ingest()