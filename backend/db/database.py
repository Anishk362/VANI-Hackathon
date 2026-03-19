from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Creates a local SQLite file named vani.db in the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./vani.db"

# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to inject the database session into your routes later
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()