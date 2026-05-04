from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cardioscan.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(40), nullable=True)
    medical_background = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("HealthNote", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    email_report_delivery = Column(Boolean, default=True)
    email_risk_alerts = Column(Boolean, default=True)
    email_reminders = Column(Boolean, default=True)
    reminder_frequency = Column(String(20), default="quarterly")
    reminder_next_date = Column(Date, nullable=True)
    height_unit = Column(String(10), default="cm")
    cholesterol_unit = Column(String(10), default="mg/dl")
    weight_unit = Column(String(10), default="kg")
    bp_unit = Column(String(10), default="mmHg")
    default_age = Column(Integer, nullable=True)
    default_gender = Column(String(40), nullable=True)
    default_smoker = Column(Boolean, default=False)
    default_diabetic = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="settings")


class UserSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    device_info = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_active = Column(DateTime(timezone=True), default=utc_now)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="sessions")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    age = Column(Integer, nullable=False)
    sex = Column(Integer, nullable=False)
    cp = Column(Integer, nullable=False)
    trestbps = Column(Integer, nullable=False)
    chol = Column(Integer, nullable=False)
    fbs = Column(Integer, nullable=False)
    restecg = Column(Integer, nullable=False)
    thalach = Column(Integer, nullable=False)
    exang = Column(Integer, nullable=False)
    oldpeak = Column(Float, nullable=False)
    slope = Column(Integer, nullable=False)
    ca = Column(Integer, nullable=False)
    thal = Column(Integer, nullable=False)

    prediction = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    feature_contributions = Column(JSON, nullable=False)

    user = relationship("User", back_populates="assessments")
    notes = relationship("HealthNote", back_populates="assessment")


class HealthNote(Base):
    __tablename__ = "health_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="notes")
    assessment = relationship("Assessment", back_populates="notes")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    if DATABASE_URL.startswith("sqlite"):
        db_path = DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_path):
            try:
                with sqlite3.connect(db_path) as conn:
                    conn.execute("ALTER TABLE users ADD COLUMN deleted_at DATETIME")
            except sqlite3.OperationalError:
                pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
