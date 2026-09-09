#sqllite is just a file on ypur disk, unlike MySQL which runs as a server, makes it more lightweight to run
#SQLalchemy allows you to run SQL without basic SQL commands like INSERT INTO, it instead uses Python objects. 
#import database utilities
from sqlalchemy import create_engine, Column, String, Integer, ForeignKey, Boolean, Float
#ORM - Object Relational Mapper => Python object <=> DB row
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE = "/Users/safwanahmed/Desktop/Projects/study_planner/data"
DB = f"sqlite:///{BASE}/study_planner.db"
#create engine is used to create a connection to the database. "sqlite:///" means you are using SQlite and ./data/study_planner.db is the file name
engine = create_engine(DB)
#creates a session factory, A session is how you talk to the database
#DB <=> Engine [knows where the db is, how to connect and how to send sql] <=> Session Factory [OOAD factory class] <=> Session
SessionLocal = sessionmaker(bind = engine)

#this creates SQLAlchemy's base class. it is the parent class for all DB tables. every table inherits from this
class Base(DeclarativeBase):
    pass

#creates the topic table
class Topic(Base):
    __tablename__ = "topics"
    #Column represents a table column. String represents textual data and integer represents numbers
    #the first column is a string called id, make this the primary key which is a must
    id = Column(Integer,primary_key=True,autoincrement=True)
    name = Column(String, nullable = False)
    # default value of the second column is 1
    priority = Column(Integer, default = 1)

class Subtopic(Base):
    __tablename__ = "subtopics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable = False)
    topic_id = Column(Integer,ForeignKey("topics.id"))

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    topic_id = Column(Integer,ForeignKey("topics.id"))
    subtopic_id = Column(Integer,ForeignKey("subtopics.id"))

class ScheduleItem(Base):
    __tablename__ = "schedule_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    week = Column(Integer, nullable=False)
    day = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    hours = Column(Float, nullable=False)
    session_type = Column(String, nullable=False)
    completed = Column(Boolean, default=False)

def init_db():
    #creates a database conversation, w/o this everything is saved only in memory
    # this says, it says look at every class inherinting from Base and create corresponding tables
    #CREATE TABLE topics (id TEXT NOT NULL,priority INTEGER)
    Base.metadata.create_all(engine)

def get_db():
    #this creates a db session, and DB connection starts
    db = SessionLocal()
    try:
        #returns session for fastAPI
        yield db
    finally:
        #closes connection
        db.close()

