import os 
from pathlib import Path

DATA_PATH = Path(os.get("DATA_PATH", Path(__file__).parent.parent/ "data"))
DATA_PATH.mkdir(parents=True, exist_ok=True)

UPLOADS_PATH = DATA_PATH / "uploads"
CHROMA_PATH = DATA_PATH / "chroma"
DATABASE_PATH = DATA_PATH / "study_planner.db"

# Make sure required directories exist
DATA_PATH.mkdir(parents=True, exist_ok=True)
UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
CHROMA_PATH.mkdir(parents=True, exist_ok=True)


FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:3000"
)