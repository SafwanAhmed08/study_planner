from fastapi import FastAPI
from pydantic import BaseModel  # used to ensure the data srnt by frontend is in the right shape
from ai import clarifier

#create fast api instance
app = FastAPI()

#defines what the request body must look like, its a JSON object with a question field that must be a string. if its not, it will get rejected by fastapi with 422
class Query(BaseModel):
    question: str

#defines it as a post function
@app.post("/ask")
#the query: Query, automatically pases the body into Query object
def ask(query: Query):
    #pulls the q from Query object and passes it to clarifier
    answer = clarifier(query.question)
    return {"answer":answer}