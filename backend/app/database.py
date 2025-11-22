from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os
from dotenv import load_dotenv

load_dotenv()

# Create Database URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/whatscookin")

# Engine manages actual connection to PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Creates a new database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()