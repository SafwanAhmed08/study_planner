from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel  # used to ensure the data srnt by frontend is in the right shape
from ai import clarifier, generate_quiz, generate_flashcards
import shutil
from scripts.ingestion import ingest
from pathlib import Path

#create fast api instance
app = FastAPI()

#defines what the request body must look like, its a JSON object with a question field that must be a string. if its not, it will get rejected by fastapi with 422
class Query(BaseModel):
    question: str

#defines it as a post function
@app.post("/ask")
#the query: Query, automatically pases the body into Query object
def ask(query: Query):
    try:
        #pulls the q from Query object and passes it to clarifier
        answer = clarifier(query.question)
        return {"answer":answer}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
    
@app.post("/upload")
#file: UploadFile - File(..) is a FastAPI special type which tells the framework to expect a file upload, it is highly efficient because it streams the incoming file. the Elepsis (...) tells that this file is strictly required and if its not provided, returns 422
def upload(file: UploadFile = File(...)):
    # uses pathlib to create the directory
    save_path = Path("./data/uploads") / file.filename
    #parents = True means if the parent folders dont exist, create that as well
    save_path.parent.mkdir(parents = True,exist_ok=True)
    #opens a new empty file at the path in write binary mode. 
    with open(save_path,"wb") as f:
        #high performance utility to stream raw data from FastAPIs temporary cache (file.file) and writes it into permanent file
        shutil.copyfileobj(file.file,f)
    
    try:
    #ingest
        ingest(save_path)

    #delete 
    finally:
        if save_path.exists():
            save_path.unlink()
    return {"filename":file.filename, "status":"ingested"}

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