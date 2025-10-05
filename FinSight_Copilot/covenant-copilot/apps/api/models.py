"""
Database models and schema for Covenant Monitoring Copilot
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    qa_sessions = relationship("QASession", back_populates="user")

class QASession(Base):
    __tablename__ = "qa_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="qa_sessions")
    messages = relationship("QAMessage", back_populates="session")

class QAMessage(Base):
    __tablename__ = "qa_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("qa_sessions.id"))
    role = Column(String)  # "user" or "assistant"
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("QASession", back_populates="messages")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    cik = Column(String, unique=True)
    ticker = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    filings = relationship("Filing", back_populates="company")
    results = relationship("Result", back_populates="company")

class Filing(Base):
    __tablename__ = "filings"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    period = Column(String)  # e.g., "Q2 2025"
    json_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="filings")

class Result(Base):
    __tablename__ = "results"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    period = Column(String)
    overall_status = Column(String)  # "PASS" or "BREACH"
    details_json = Column(Text)  # JSON string of covenant test results
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="results")
    red_flags = relationship("RedFlag", back_populates="result")
    memos = relationship("Memo", back_populates="result")

class RedFlag(Base):
    __tablename__ = "red_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("results.id"))
    rule_key = Column(String)  # "leverage", "coverage", "liquidity"
    actual = Column(Float)
    threshold = Column(Float)
    status = Column(String)  # "BREACH"
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    result = relationship("Result", back_populates="red_flags")
    alerts = relationship("Alert", back_populates="red_flag")

class Memo(Base):
    __tablename__ = "memos"
    
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("results.id"))
    memo_md_path = Column(String)
    memo_pdf_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    result = relationship("Result", back_populates="memos")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    red_flag_id = Column(Integer, ForeignKey("red_flags.id"))
    email_to = Column(String)
    email_subject = Column(String)
    email_body = Column(Text)
    sent_at = Column(DateTime)
    status = Column(String)  # "sent", "failed", "pending"
    
    # Relationships
    red_flag = relationship("RedFlag", back_populates="alerts")

def create_database():
    """Create database and tables"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./copilot.db")
    engine = create_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine

def get_session():
    """Get database session"""
    engine = create_database()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()
