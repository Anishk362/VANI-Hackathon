from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class InteractionReceipt(Base):
    __tablename__ = "interaction_receipts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    customer_language = Column(String(50))
    original_transcript = Column(Text)
    english_summary = Column(Text)
    native_summary = Column(Text)