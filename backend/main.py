from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from auth_utils import create_access_token, get_current_user, get_optional_user, hash_password, verify_password, get_current_session
from database import Assessment, HealthNote, User, UserSettings, UserSession, get_db, init_db
from model_trainer import (
    ANALYTICS_PATH,
    FEATURE_LABELS,
    FEATURE_ORDER,
    METADATA_PATH,
    MODEL_PATH,
    SCALER_PATH,
    train_and_save,
)
from report_generator import generate_pdf_report


app = FastAPI(
    title="CardioScan AI API",
    description="Educational heart disease risk prediction API powered by scikit-learn.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
metadata = None


class PatientInput(BaseModel):
    age: int = Field(..., ge=20, le=100)
    sex: int = Field(..., ge=0, le=1)
    cp: int = Field(..., ge=0, le=3)
    trestbps: int = Field(..., ge=60, le=240)
    chol: int = Field(..., ge=80, le=700)
    fbs: int = Field(..., ge=0, le=1)
    restecg: int = Field(..., ge=0, le=2)
    thalach: int = Field(..., ge=50, le=230)
    exang: int = Field(..., ge=0, le=1)
    oldpeak: float = Field(..., ge=0, le=10)
    slope: int = Field(..., ge=0, le=2)
    ca: int = Field(..., ge=0, le=3)
    thal: int = Field(..., ge=0, le=2)


class FeatureContribution(BaseModel):
    feature: str
    value: float | int
    impact: float
    direction: Literal["positive", "negative"]


class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    risk_level: Literal["Low", "Moderate", "High"]
    feature_contributions: list[FeatureContribution]
    risk_percentage: int
    assessment_id: int | None = None


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)
    date_of_birth: date | None = None
    gender: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    avatar_url: str | None = None
    medical_background: list[str] | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    password: str

class SettingsUpdateRequest(BaseModel):
    email_report_delivery: bool | None = None
    email_risk_alerts: bool | None = None
    email_reminders: bool | None = None
    reminder_frequency: str | None = None
    reminder_next_date: date | None = None
    height_unit: str | None = None
    cholesterol_unit: str | None = None
    weight_unit: str | None = None
    bp_unit: str | None = None
    default_age: int | None = None
    default_gender: str | None = None
    default_smoker: bool | None = None
    default_diabetic: bool | None = None

class SettingsResponse(BaseModel):
    email_report_delivery: bool
    email_risk_alerts: bool
    email_reminders: bool
    reminder_frequency: str
    reminder_next_date: date | None
    height_unit: str
    cholesterol_unit: str
    weight_unit: str
    bp_unit: str
    default_age: int | None
    default_gender: str | None
    default_smoker: bool
    default_diabetic: bool

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: int
    device_info: str | None
    ip_address: str | None
    created_at: datetime
    last_active: datetime
    is_active: bool
    is_current: bool = False

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    avatar_url: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    medical_background: list[str] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class HealthNoteCreate(BaseModel):
    note_text: str = Field(..., min_length=1)
    assessment_id: int | None = None


class HealthNoteResponse(BaseModel):
    id: int
    assessment_id: int | None
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportRequest(BaseModel):
    assessment_id: int | None = None
    assessment_data: dict[str, Any] | None = None


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        medical_background=user.medical_background or [],
        created_at=user.created_at,
    )


def assessment_to_dict(assessment: Assessment) -> dict[str, Any]:
    patient = {feature: getattr(assessment, feature) for feature in FEATURE_ORDER}
    return {
        "id": assessment.id,
        "timestamp": assessment.timestamp,
        **patient,
        "prediction": assessment.prediction,
        "probability": assessment.probability,
        "risk_level": assessment.risk_level,
        "risk_percentage": int(round(assessment.probability * 100)),
        "feature_contributions": assessment.feature_contributions,
        "top_risk_factor": assessment.feature_contributions[0]["feature"] if assessment.feature_contributions else "-",
    }


def _ensure_artifacts() -> None:
    if not MODEL_PATH.exists() or not SCALER_PATH.exists() or not ANALYTICS_PATH.exists():
        train_and_save()


def _load_artifacts() -> None:
    global model, scaler, metadata
    _ensure_artifacts()
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))


@app.on_event("startup")
def startup() -> None:
    init_db()
    _load_artifacts()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def build_prediction(payload: PatientInput) -> PredictionResponse:
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model artifacts are not loaded.")

    patient = payload.model_dump()
    frame = pd.DataFrame([[patient[feature] for feature in FEATURE_ORDER]], columns=FEATURE_ORDER)
    scaled = scaler.transform(frame)
    prediction = int(model.predict(scaled)[0])
    probability = float(model.predict_proba(scaled)[0][1])
    risk_percentage = int(round(probability * 100))

    if probability < 0.3:
        risk_level = "Low"
    elif probability < 0.6:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    importances = getattr(model, "feature_importances_", np.ones(len(FEATURE_ORDER)))
    impacts = scaled[0] * importances
    ranked = sorted(zip(FEATURE_ORDER, impacts), key=lambda item: abs(float(item[1])), reverse=True)[:6]
    contributions = [
        FeatureContribution(
            feature=FEATURE_LABELS.get(feature, feature),
            value=patient[feature],
            impact=round(float(impact), 4),
            direction="positive" if impact >= 0 else "negative",
        )
        for feature, impact in ranked
    ]

    return PredictionResponse(
        prediction=prediction,
        probability=round(probability, 4),
        risk_level=risk_level,
        feature_contributions=contributions,
        risk_percentage=risk_percentage,
    )


def save_assessment(db: Session, user: User, payload: PatientInput, result: PredictionResponse) -> Assessment:
    assessment = Assessment(
        user_id=user.id,
        **payload.model_dump(),
        prediction=result.prediction,
        probability=result.probability,
        risk_level=result.risk_level,
        feature_contributions=[item.model_dump() for item in result.feature_contributions],
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@app.post("/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(User).filter(User.email == payload.email.lower(), User.deleted_at == None).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        medical_background=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    settings = UserSettings(user_id=user.id)
    db.add(settings)
    
    device_info = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    session = UserSession(user_id=user.id, device_info=device_info, ip_address=ip_address, token_hash="")
    db.add(session)
    db.commit()
    db.refresh(session)
    
    token = create_access_token(user, session.id)
    session.token_hash = hash_password(token) # Or just simple hash since it's just a token
    db.commit()
    
    return AuthResponse(token=token, user=user_to_response(user))


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower(), User.deleted_at == None).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
        
    device_info = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    session = UserSession(user_id=user.id, device_info=device_info, ip_address=ip_address, token_hash="")
    db.add(session)
    db.commit()
    db.refresh(session)
    
    token = create_access_token(user, session.id)
    session.token_hash = hash_password(token)
    db.commit()
    
    return AuthResponse(token=token, user=user_to_response(user))


@app.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return user_to_response(current_user)


@app.put("/auth/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.date_of_birth is not None:
        current_user.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        current_user.gender = payload.gender
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.medical_background is not None:
        current_user.medical_background = payload.medical_background
    db.commit()
    db.refresh(current_user)
    return user_to_response(current_user)

@app.put("/auth/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"status": "success"}

@app.put("/auth/change-email")
def change_email(
    payload: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Password is incorrect.")
    
    existing = db.query(User).filter(User.email == payload.new_email.lower(), User.id != current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use.")
        
    current_user.email = payload.new_email.lower()
    db.commit()
    return {"status": "success"}

@app.get("/settings", response_model=SettingsResponse)
def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/settings", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
        
    db.commit()
    db.refresh(settings)
    return settings

@app.get("/auth/sessions", response_model=list[SessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    current_session: UserSession = Depends(get_current_session),
    db: Session = Depends(get_db)
):
    sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id, UserSession.is_active == True).order_by(UserSession.last_active.desc()).all()
    result = []
    for s in sessions:
        s_resp = SessionResponse.model_validate(s)
        if s.id == current_session.id:
            s_resp.is_current = True
        result.append(s_resp)
    return result

@app.delete("/auth/sessions/all")
def delete_all_sessions(
    current_user: User = Depends(get_current_user),
    current_session: UserSession = Depends(get_current_session),
    db: Session = Depends(get_db)
):
    db.query(UserSession).filter(UserSession.user_id == current_user.id, UserSession.id != current_session.id).update({"is_active": False})
    db.commit()
    return {"status": "success"}

@app.delete("/auth/sessions/{session_id}")
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    session.is_active = False
    db.commit()
    return {"status": "success"}

@app.get("/user/export-data")
def export_user_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    assessments = db.query(Assessment).filter(Assessment.user_id == current_user.id).all()
    notes = db.query(HealthNote).filter(HealthNote.user_id == current_user.id).all()
    
    return {
        "profile": user_to_response(current_user).model_dump(mode='json'),
        "settings": SettingsResponse.model_validate(settings).model_dump(mode='json') if settings else {},
        "assessments": [assessment_to_dict(a) for a in assessments],
        "notes": [{"id": n.id, "text": n.note_text, "created_at": n.created_at.isoformat()} for n in notes]
    }

@app.delete("/user/delete-account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.email = f"deleted_{current_user.id}@cardioscan.local"
    current_user.name = "Deleted User"
    current_user.password_hash = ""
    current_user.avatar_url = None
    current_user.medical_background = []
    current_user.date_of_birth = None
    current_user.gender = None
    
    db.query(UserSession).filter(UserSession.user_id == current_user.id).update({"is_active": False})
    
    db.commit()
    return {"status": "account deleted"}


@app.post("/predict", response_model=PredictionResponse)
def predict(
    payload: PatientInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    result = build_prediction(payload)
    assessment = save_assessment(db, current_user, payload, result)
    result.assessment_id = assessment.id
    return result


@app.get("/analytics")
def analytics() -> dict:
    if not Path(ANALYTICS_PATH).exists():
        raise HTTPException(status_code=503, detail="Analytics artifact is not available.")
    return json.loads(Path(ANALYTICS_PATH).read_text(encoding="utf-8"))


@app.get("/assessments/history")
def assessment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.timestamp.desc())
        .all()
    )
    rows = [assessment_to_dict(item) for item in assessments]
    probabilities = [item.probability for item in assessments]
    summary = {
        "total": len(assessments),
        "average_risk": round(float(np.mean(probabilities) * 100), 1) if probabilities else 0,
        "lowest": min(rows, key=lambda item: item["probability"]) if rows else None,
        "highest": max(rows, key=lambda item: item["probability"]) if rows else None,
    }
    return {"assessments": rows, "summary": summary}


@app.get("/assessments/{assessment_id}")
def assessment_detail(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return assessment_to_dict(assessment)


@app.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    db.delete(assessment)
    db.commit()
    return {"status": "deleted"}


@app.post("/notes", response_model=HealthNoteResponse)
def create_note(
    payload: HealthNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthNoteResponse:
    if payload.assessment_id:
        assessment = (
            db.query(Assessment)
            .filter(Assessment.id == payload.assessment_id, Assessment.user_id == current_user.id)
            .first()
        )
        if not assessment:
            raise HTTPException(status_code=404, detail="Linked assessment not found.")
    note = HealthNote(user_id=current_user.id, assessment_id=payload.assessment_id, note_text=payload.note_text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.get("/notes", response_model=list[HealthNoteResponse])
def list_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[HealthNoteResponse]:
    return db.query(HealthNote).filter(HealthNote.user_id == current_user.id).order_by(HealthNote.created_at.desc()).all()


@app.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    note = db.query(HealthNote).filter(HealthNote.id == note_id, HealthNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    db.delete(note)
    db.commit()
    return {"status": "deleted"}


@app.post("/report/generate")
def generate_report(
    payload: ReportRequest,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> Response:
    patient: dict[str, Any]
    result: dict[str, Any]
    assessment_date: datetime | None = None
    user_payload = user_to_response(current_user).model_dump() if current_user else None

    if payload.assessment_id:
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required to download a saved assessment report.")
        assessment = (
            db.query(Assessment)
            .filter(Assessment.id == payload.assessment_id, Assessment.user_id == current_user.id)
            .first()
        )
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found.")
        patient = {feature: getattr(assessment, feature) for feature in FEATURE_ORDER}
        result = {
            "prediction": assessment.prediction,
            "probability": assessment.probability,
            "risk_level": assessment.risk_level,
            "feature_contributions": assessment.feature_contributions,
        }
        assessment_date = assessment.timestamp
    elif payload.assessment_data:
        patient = payload.assessment_data.get("patient", {})
        result = payload.assessment_data.get("result", {})
    else:
        raise HTTPException(status_code=400, detail="Provide assessment_id or assessment_data.")

    pdf = generate_pdf_report(patient=patient, result=result, user=user_payload, assessment_date=assessment_date)
    headers = {"Content-Disposition": "attachment; filename=cardioscan-ai-report.pdf"}
    return Response(content=pdf, media_type="application/pdf", headers=headers)
