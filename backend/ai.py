import requests
import json
from scripts.retrieval import retrieval

url = "http://localhost:1234/v1/chat/completions"

headers ={
        "Content-Type":"application/json"
    }

def clarifier(query):
    context_chunks = retrieval(query)
    context = "\n\n".join(context_chunks)
    #role: system - sets the guardrails and behavior for AI. role: user - explains the users prompt. 
    payload = {
        "messages": [
            {"role": "system", "content": "You are a doubt clarifier for a student preapring for masters in AI at the university of Edinburgh. The course starts in september and they have uploaded the courses they are currently revising or planning to revise. You need to answer their queries to help them study and these must be must be strictly relevant to the topic. You cannot treat this as a generic chat. In case the course material lacks some important information or they ask you something not in the course you can answer but clarify that this is out of course."},
            {"role": "user", "content": f"Context:\n{context}\n\n Question: {query}"}
        ],
        "temperature": 0.2,     # controls randomness of the model - 0.2 forces it to be determenistic and factual
        "max_tokens": -1,       #max_tokens - doesnt cap the answer length
        "stream": False         #tells server to wait until the final answer is ready
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
    except:
        raise Exception("LM Studio is not running. Please open LM Studio and load the model.")


    return response.json()["choices"][0]["message"]["content"]

def generate_quiz(topic,num_questions):
    content_chunks = retrieval(topic)
    context = "\n\n".join(content_chunks)
    payload = {
        "messages":[
            {
                "role":"system","content":'You are a quiz generator. You need to generate quizzes for a student who is trying to study in order to prrapre for the Masters of AI at the University of Edinburgh. Generate a mix of: factual questions, conceptual questions anscenario-based questions You cannot treat this as a generic chat. Make sure the quiz is generated only in a JSON array and no other text. Output format - {"question":"...", "options":["A","B","C","D"], "answer": "...", "explanation":"..."}. Use only the retrieved data and not your pretrained knowledge. Make sure you dont just duplicate questions and ask relevant, diverse questions. Do not invent facts. Make questions conceptually challenging, do not keep irrelevant questions. each question must have exactly 4 options and only one must be correct. Provide a concise but clear explanation for each correct answer. Do not include markdown, code fences, comments or extra text. return only a VALID JSON array'
            },
            {
                "role":"user","content":f"Quiz questions about: {topic} Context: {context} \n\n Generate: {num_questions} MCQs \n\n "
            }
        ],
        "temperature":0.1,
        "stream":False
    }

    headers = {
        "Content-Type" : "application/json"
    }

    try:
        response = requests.post(url, headers=headers, data = json.dumps(payload))
        data = response.json()
        raw = data["choices"][0]["message"]["content"]
        raw = raw.strip().removeprefix("```json").removesuffix("```").strip()
        return json.loads(raw)
    
    except Exception as e:
        print(e)
        raise Exception("LM Studio is not running. Please open LM Studio and load the model.")

def generate_flashcards(topic,num):
    content_chunks = retrieval(topic)
    context = "\n\n".join(content_chunks)
    payload = {
        "messages":[
            {
                "role":"system","content":' You are a flashcard generator for a student preparing to do masters in the university of edinburgh. You need to generate complex flashcards in which the answers should be concise (1-3 sentences maximum) while still containing the key concept. they suitable for a student preparing to study at this level. The flashcards need to be strictly in a JSON array with no other text-{"front": "Question", "back":"Answer"}, where the question and answer are generated based on the topic " Do not Hallucinate, do not give wrong answers, the answer should be short and concise with a clear answer. Use only the provided content. Return only a VALID JSON array. Generate a mix of: definition cards, conceptual understanding cards, comparison cards and application/scenario cards. Avoid generating multiple flashcards that test the same concept unless they test clearly different angles.'
            },
            {
                "role":"user","content":f"For this context {context}, create {num} flash cards about {topic}"
            }
        ],
        "temperature" : 0.1,
        "stream" : False
    }
    headers = {
        "content-type":"application/json"
    }

    try:
        response = requests.post(url,headers = headers, data = json.dumps(payload))
        data = response.json()
        raw = data["choices"][0]["message"]["content"]
        raw = raw.strip().removeprefix("```json").removesuffix("```").strip()
        return json.loads(raw)
    
    except Exception as e:
        print(e)
        raise Exception("LM Studio is not running. Please open LM Studio and load the model.")
    

def generate_schedule(topics, hours_per_day, start, end):
    topics_text = "\n".join(
        f"-{t['name']} (priority: {t['priority']}/3)"
        for t in topics
    )

    payload = {
        "messages": [
            {
                "role":"system",
                "content":"""You are a study scheduler for a student about to join the university of Edinburgh's MSc in AI program. Generate a study schedule as a JSON Array only and no other text. Each item: {"week":1, "day":"Monday", "topic":"...","hours":2,"session_type":"study/revision/quiz"}
                Rules:
                - Mix topics across each week, do not do one topic per week
                - Higher priority topics get more time
                - Mix session types: study for new content, review for revision, quiz for testing
                - Respect the hours per day limit
                - Return ONLY the JSON array"""
            },
            {
                "role":"user",
                "content":f"Topics:\n{topics_text}\n\nHours per day:{hours_per_day}\n Start date: {start}\n End date: {end}\n\n Generate the schedule"
            }
        ],
        "temperature":0.1,
        "stream":False
    }

    response = requests.post(url,headers=headers, data = json.dumps(payload))
    raw = response.json()["choices"][0]["message"]["content"]
    raw = raw.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(raw)

def detect_subtopics(text_sample):
    payload = {
        "messages": [
            {
                "role":"system",
                "content": """You are a topic analyser. Given a sample of study material, identify the specific subtopics covered.
                Return ONLY a JSON array of subtopic names, nothing else. No explanation, no markdown.
                Example: ["Virtual Machines", "Hypervisors", "Container Technology"]"""
            },
            {
                "role":"user",
                "content":f"Identify the subtopics in this study material:\n\n{text_sample[:2000]}"
            }
        ],
        "temperature":0.1,
        "stream":False
    }
    
    response = requests.post(url,headers=headers, data = json.dumps(payload))
    raw = response.json()["choices"][0]["message"]["content"]
    raw = raw.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(raw)

