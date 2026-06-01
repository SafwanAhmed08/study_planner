import requests
import json

url = "http://localhost:1234/v1/chat/completions"

def clarifier(prompt):
    payload = {
        "messages": [
            {"role": "system", "content": "You are a doubt clarifier for a student preapring for masters in AI at the university of Edinburgh. The course starts in september and they have uploaded the courses they are currently revising or planning to revise. You need to answer their queries to help them study and these must be must be strictly relevant to the topic. You cannot treat this as a generic chat. In case the course material lacks some important information or they ask you something not in the course you can answer but clarify that this is out of course."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": -1,
        "stream": True
    }

    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code == 200:
        data = response.json()
        print(data['choices'][0]['message']['content'])
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

clarifier("Explain how kubernetes is different from docker")