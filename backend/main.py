from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from pydantic import BaseModel  # used to ensure the data srnt by frontend is in the right shape
from ai import clarifier, generate_quiz, generate_flashcards, generate_schedule, detect_subtopics
import shutil
from scripts.ingestion import ingest, extract_text
from pathlib import Path
from database import init_db, get_db, Topic as TopicModel, Subtopic, Document
from sqlalchemy.orm import Session
from typing import List #for uploading folder
from fastapi.middleware.cors import CORSMiddleware



DATA_PATH = "/Users/safwanahmed/Desktop/Projects/study_planner/data"
#create fast api instance
app = FastAPI()
# needed because browser blocks requests from different ports. 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#initialise db
init_db()

#defines what the request body must look like, its a JSON object with a question field that must be a string. if its not, it will get rejected by fastapi with 422
class Query(BaseModel):
    question: str
    topic_id: int = None

#defines it as a post function
@app.post("/ask")
#the query: Query, automatically pases the body into Query object
def ask(query: Query, db: Session = Depends(get_db)):
    try:
        #pulls the q from Query object and passes it to clarifier
        answer = clarifier(query.question, query.topic_id)
        return {"answer":answer}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
    
@app.post("/upload")
#file: UploadFile - File(..) is a FastAPI special type which tells the framework to expect a file upload, it is highly efficient because it streams the incoming file. the Elepsis (...) tells that this file is strictly required and if its not provided, returns 422
def upload(file: UploadFile = File(...), topic_id: int = Form(...), db: Session = Depends(get_db)):
    # uses pathlib to create the directory
    save_path = Path(f"{DATA_PATH}/uploads") / file.filename
    #parents = True means if the parent folders dont exist, create that as well
    save_path.parent.mkdir(parents = True,exist_ok=True)
    #opens a new empty file at the path in write binary mode. 
    with open(save_path,"wb") as f:
        #high performance utility to stream raw data from FastAPIs temporary cache (file.file) and writes it into permanent file
        shutil.copyfileobj(file.file,f)
    subtopics = []
    result = ingest(save_path,topic_id)
    if result["status"]=="skipped":
            return {
                "filename": file.filename,
                "status": "skipped",
                "reason": result["reason"],
                "topic_id": topic_id
            }
        
    text = extract_text(save_path)
    subtopics = detect_subtopics(text[:2000])

    for name in subtopics:
            subtopic = Subtopic(name=name, topic_id=topic_id)
            db.add(subtopic)

    doc = Document(filename = file.filename, topic_id = topic_id)
    db.add(doc)
    db.commit()

    return {
        "filename": file.filename,
        "status": "ingested",
        "topic_id": topic_id,
        "subtopics": subtopics,
        "chunks": result["chunks"]
    }

@app.post("/uploadFolder")
@app.post("/uploadFolder")
def uploadFolder(
    files: List[UploadFile] = File(...),
    topic_id: int = Form(...),
    db: Session = Depends(get_db)
):
    upload_dir = Path(f"{DATA_PATH}/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    results = []

    for file in files:
        safe_filename = Path(file.filename).name
        if safe_filename == ".DS_Store":
            continue

        if safe_filename.startswith(".") or not safe_filename.lower().endswith(".pdf"):
            results.append({
                "filename": safe_filename,
                "status": "skipped",
                "reason": "not a PDF"
            })
            continue

        savepath = upload_dir / safe_filename
        subtopics = []

        try:
            file.file.seek(0)

            with open(savepath, "wb") as f:
                shutil.copyfileobj(file.file, f)

            if savepath.stat().st_size == 0:
                results.append({
                    "filename": safe_filename,
                    "status": "failed",
                    "error": "Uploaded file is empty"
                })
                continue

            result = ingest(savepath, topic_id)

            if result["status"] == "skipped":
                results.append({
                    "filename": safe_filename,
                    "status": "skipped",
                    "reason": result.get("reason"),
                    "subtopics": subtopics
                })
                continue

            text = extract_text(savepath)
            subtopics = detect_subtopics(text[:2000])

            for name in subtopics:
                db.add(Subtopic(name=name, topic_id=topic_id))

            db.add(Document(filename=safe_filename, topic_id=topic_id))
            db.commit()

            results.append({
                "filename": safe_filename,
                "status": "ingested",
                "subtopics": subtopics
            })

        except Exception as e:
            db.rollback()
            results.append({
                "filename": safe_filename,
                "status": "failed",
                "error": str(e)
            })

        finally:
            if savepath.exists():
                savepath.unlink()

    return {
        "topic_id": topic_id,
        "files_processed": len(results),
        "results": results
    }

class QuizRequest(BaseModel):
    topic: str
    num: int = 5

@app.post("/quiz")
def quiz(request: QuizRequest):
    try:
        result = generate_quiz(request.topic,request.num)
        return {"quiz":result} 
        
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
    
class FlashRequest(BaseModel):
    topic : str
    num: int = 5
    
@app.post("/flashcards")
def flashcards(request:FlashRequest):
    try:
        result = generate_flashcards(request.topic,request.num)
        return {"flashcards":result}
    except Exception as e:
        raise HTTPException(status_code=503, detail = str(e))
    
#creates a schema for incoming JSON
class TopicRequest(BaseModel):
    name: str
    priority: int = 1

#db: Session = ... => is a dependency injection ie FastAPI sees Depends(get_db) and executes db =SessionLocal() from the database.py file, this means before the route runs, the db already has a session 
@app.post("/topics")
def add_topic(topic:TopicRequest, db: Session = Depends(get_db)):
    #creates SQLAlchemy object
    new_topic = TopicModel(name = topic.name, priority = topic.priority)
    #adds object
    db.add(new_topic)
    #commits to db
    db.commit()
    #reread row/ refresh the DB, so that there is nothing none or missing
    db.refresh(new_topic)
    #retunrs new_topic as JSON object
    return new_topic

@app.get("/topics")
def get_topics(db:Session = Depends(get_db)):
    #reads every topic from DB and returns JSON
    return db.query(TopicModel).all()

class ScheduleRequest(BaseModel):
    hours_per_day: float = 2.0
    start: str
    end: str

@app.post("/schedule")
def schedule(request: ScheduleRequest, db: Session = Depends(get_db)):
    try:
        topics = db.query(TopicModel).all()
        if not topics:
            raise HTTPException(status_code=400, detail="No topics found. Add topics first")
        topics_list = [{"name":t.name,
                        "priority":t.priority,
                        "subtopics": [
                            s.name for s in db.query(Subtopic).filter(Subtopic.topic_id == t.id).all()
                        ]
                        } for t in topics]
        result = generate_schedule(topics_list, request.hours_per_day, request.start, request.end)
        return {"schedule":result}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
    

@app.get("/subtopics/{topic_id}")
def get_subtopics(topic_id: int, db: Session = Depends(get_db)):
    subtopics = db.query(Subtopic).filter(Subtopic.topic_id == topic_id).all()
    return {
        "topic_id": topic_id,
        "subtopics": [{"id": s.id, "name": s.name} for s in subtopics]
    }
