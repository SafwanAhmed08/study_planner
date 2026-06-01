import requests
import json
from scripts.retrieval import retrieval

url = "http://localhost:1234/v1/chat/completions"

def clarifier(query = "What are the features of Cloud Computing"):
    context_chunks = retrieval(query)
    context = "\n\n".join(context_chunks)
    payload = {
        "messages": [
            {"role": "system", "content": "You are a doubt clarifier for a student preapring for masters in AI at the university of Edinburgh. The course starts in september and they have uploaded the courses they are currently revising or planning to revise. You need to answer their queries to help them study and these must be must be strictly relevant to the topic. You cannot treat this as a generic chat. In case the course material lacks some important information or they ask you something not in the course you can answer but clarify that this is out of course."},
            {"role": "user", "content": f"Context:\n{context}\n\n Question: {query}"}
        ],
        "temperature": 0.2,
        "max_tokens": -1,
        "stream": False
    }

    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    return response.json()["choices"][0]["message"]["content"]
