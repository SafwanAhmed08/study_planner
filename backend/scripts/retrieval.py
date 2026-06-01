import chromadb
import requests
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

client = chromadb.PersistentClient(path = "./data/chroma")
collection = client.get_collection("Study_materials")

#Basic retrieval didnt work so switched to HyDE- Hypothetical Document Embeddings. 
# Hyde failed, which is why im now working on getting the basic RAG fixed


def retrieval(query = "What are the features of Cloud Computing"):
    result = collection.query(query_texts=query, n_results=20)
    chunks = result["documents"][0]

    # rerank them
    scores = reranker.predict([(query, chunk) for chunk in chunks])
    ranked = sorted(zip(scores, chunks), reverse=True)
    top_chunks = [chunk for _, chunk in ranked[:3]]

    print(top_chunks)

retrieval()