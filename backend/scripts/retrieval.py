import chromadb
import requests
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

client = chromadb.PersistentClient(path = "../data/chroma")
collection = client.get_or_create_collection("Study_materials")

#Basic retrieval didnt work so switched to HyDE- Hypothetical Document Embeddings. 
# Hyde failed, which is why im now working on getting the basic RAG fixed
# used reranking, with a combo of bi encoder - which is quite fast but not precise and a cross encoder - which is slow, thats why im using it only on top 20. The bi encoder is used while saving data into the vector database, the cross encoder has been added explicitly later.


def retrieval(query, topic_id = None):
    result = collection.query(query_texts=[query], n_results=20)
    chunks = result["documents"][0]

    # rerank them
    scores = reranker.predict([(query, chunk) for chunk in chunks])
    ranked = sorted(zip(scores, chunks), reverse=True)
    top_chunks = [chunk for _, chunk in ranked[:3]]

    return top_chunks
