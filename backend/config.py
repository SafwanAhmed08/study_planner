import os 
from pathlib import Path

DATA_PATH = Path(
    os.getenv("DATA_PATH", Path(__file__).parent.parent / "data")
)

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


LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL",
    "http://localhost:1234/v1/chat/completions",
)