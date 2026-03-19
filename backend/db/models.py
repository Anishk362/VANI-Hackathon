from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import datetime
from .database import Base, engine

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True) # e.g., "UB-2026-09173"
    language = Column(String)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    english_summary = Column(Text, nullable=True)
    native_summary = Column(Text, nullable=True)
    transcript = Column(JSON, nullable=True) # Stores the array of TranscriptLine objects

    # Link to the Intent table
    intents = relationship("Intent", back_populates="session")

class Intent(Base):
    __tablename__ = "intents"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    intent = Column(String) # e.g., "account opening"
    triggered_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Link back to the Session table
    session = relationship("Session", back_populates="intents")

# Anish requested create_all() on startup. This generates the vani.db file and tables.
Base.metadata.create_all(bind=engine)