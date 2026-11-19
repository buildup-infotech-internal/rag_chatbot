
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

# Load .env from the backend folder
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing from the .env file")

# Use psycopg 3 with SQLAlchemy
database_url = make_url(DATABASE_URL).set(
    drivername="postgresql+psycopg"
)

engine = create_engine(
    database_url,
    connect_args={"sslmode": "require"},
    pool_pre_ping=True
)
