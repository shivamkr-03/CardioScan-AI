# CardioScan AI

CardioScan AI is a full-stack educational clinical decision support demo for heart disease risk prediction. It uses a FastAPI backend, a scikit-learn Gradient Boosting classifier, and a React/Vite dashboard with Tailwind CSS, Recharts, and Framer Motion.

This project is for educational and research purposes only. It is not a medical diagnosis tool and is not a substitute for professional medical advice.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Framer Motion
- Backend: Python, FastAPI, SQLAlchemy, SQLite
- ML: scikit-learn Gradient Boosting Classifier
- Auth: JWT tokens, passlib bcrypt password hashing
- Reports: ReportLab PDF generation
- Dataset: UCI Machine Learning Repository Heart Disease dataset

## Features

- [x] AI heart disease risk prediction with saved assessment history
- [x] JWT authentication with registration, login, profile editing, and onboarding
- [x] Protected assessment, results, profile, and history routes
- [x] Recharts analytics dashboards and model-performance visualizations
- [x] Health notes timeline linked optionally to assessments
- [x] Side-by-side assessment comparison mode
- [x] Professional backend-generated PDF reports
- [x] Research and educational-use disclaimers throughout the app

Built for research internship portfolio presentation and local experimentation.

## Project Structure

```text
backend/
  main.py
  model_trainer.py
  requirements.txt
  Dockerfile
frontend/
  src/
    pages/
    components/
    lib/
  package.json
  vercel.json
```

## Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python model_trainer.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The trainer auto-downloads the official UCI Heart Disease dataset if `backend/heart_disease_uci.csv` is not present, then saves model artifacts under `backend/artifacts/`.

## Database Setup

SQLite is used by default for local development. The database file is created automatically at `backend/cardioscan.db` when FastAPI starts.

Optional environment variables:

| Variable | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./cardioscan.db` | SQLAlchemy database connection string |
| `JWT_SECRET_KEY` | `replace-with-a-long-random-secret` | Secret used to sign JWT tokens |
| `PORT` | `8000` | Backend port on hosting platforms |
| `VITE_API_URL` | `http://localhost:8000` | Frontend API base URL |

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to your FastAPI backend URL. For local development:

```text
VITE_API_URL=http://localhost:8000
```

## API Documentation

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Create user and return JWT |
| `POST` | `/auth/login` | No | Authenticate user and return JWT |
| `GET` | `/auth/me` | Yes | Return current user profile |
| `PUT` | `/auth/profile` | Yes | Update profile, avatar, medical background, or password |
| `POST` | `/predict` | Yes | Predict risk and auto-save assessment |
| `GET` | `/analytics` | No | Return public dataset/model analytics |
| `GET` | `/assessments/history` | Yes | Return current user's assessment history and summary |
| `GET` | `/assessments/{id}` | Yes | Return one saved assessment |
| `DELETE` | `/assessments/{id}` | Yes | Delete one saved assessment |
| `POST` | `/notes` | Yes | Create a health note |
| `GET` | `/notes` | Yes | List current user's health notes |
| `DELETE` | `/notes/{id}` | Yes | Delete one note |
| `POST` | `/report/generate` | Optional | Generate PDF from saved assessment or provided data |

`POST /predict` accepts these 13 clinical fields:

```json
{
  "age": 55,
  "sex": 1,
  "cp": 0,
  "trestbps": 145,
  "chol": 233,
  "fbs": 1,
  "restecg": 1,
  "thalach": 150,
  "exang": 0,
  "oldpeak": 2.3,
  "slope": 2,
  "ca": 0,
  "thal": 1
}
```

`GET /analytics` returns model metrics, ROC curves, confusion matrix values, dataset summaries, feature importances, and chart-ready analytics.

## Screenshots

- [screenshot] Landing page
- [screenshot] Login and registration
- [screenshot] Assessment form
- [screenshot] Results report
- [screenshot] Profile and history dashboard

## Model Performance

Metrics are recomputed when `backend/model_trainer.py` runs. The original project notebook identified Gradient Boosting as the best model with about 84.78% test accuracy.

| Model | Notes |
| --- | --- |
| Logistic Regression | Linear comparison baseline |
| Random Forest | Tree ensemble comparison model |
| Gradient Boosting | Deployed prediction model |

Gradient Boosting parameters:

```python
{
  "learning_rate": 0.01,
  "max_depth": 3,
  "n_estimators": 200,
  "subsample": 1.0
}
```

## Deployment

### Frontend on Vercel

1. Set the project root to `frontend`.
2. Add `VITE_API_URL` with the deployed backend URL.
3. Build command: `npm run build`.
4. Output directory: `dist`.

### Backend on Render or Railway

1. Use `backend/` as the service root.
2. Install command: `pip install -r requirements.txt`.
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. The first startup trains the model if artifacts are missing.

Docker deployment is also supported through `backend/Dockerfile`.

## Disclaimer

CardioScan AI is intended for education, experimentation, and research demonstrations. It should not be used to make clinical decisions without professional medical oversight.
