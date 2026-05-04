from __future__ import annotations

import json
from io import StringIO
from pathlib import Path
from typing import Any
from urllib.request import urlopen

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    auc,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

try:
    from ucimlrepo import fetch_ucirepo
except Exception:  # pragma: no cover - handled at runtime with a clearer error.
    fetch_ucirepo = None


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "heart_disease_uci.csv"
ARTIFACT_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "model.pkl"
SCALER_PATH = ARTIFACT_DIR / "scaler.pkl"
ANALYTICS_PATH = ARTIFACT_DIR / "analytics.json"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"

FEATURE_ORDER = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
]

CATEGORICAL_FEATURES = ["sex", "cp", "fbs", "restecg", "exang", "slope", "thal", "dataset"]

UCI_PROCESSED_FILES = {
    "Cleveland": "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data",
    "Hungary": "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.hungarian.data",
    "Switzerland": "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.switzerland.data",
    "VA Long Beach": "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.va.data",
}

RAW_COLUMNS = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
    "num",
]

FEATURE_LABELS = {
    "age": "Age",
    "sex": "Sex",
    "cp": "Chest Pain Type",
    "trestbps": "Resting Blood Pressure",
    "chol": "Cholesterol",
    "fbs": "Fasting Blood Sugar",
    "restecg": "Resting ECG",
    "thalach": "Max Heart Rate",
    "exang": "Exercise Angina",
    "oldpeak": "ST Depression",
    "slope": "ST Slope",
    "ca": "Major Vessels",
    "thal": "Thalassemia",
}

VALUE_MAPS = {
    "sex": {"female": 0, "male": 1, "0": 0, "1": 1},
    "cp": {
        "typical angina": 0,
        "atypical angina": 1,
        "non-anginal": 2,
        "non-anginal pain": 2,
        "asymptomatic": 3,
        "0": 0,
        "1": 1,
        "2": 2,
        "3": 3,
    },
    "fbs": {"false": 0, "true": 1, "0": 0, "1": 1},
    "restecg": {
        "normal": 0,
        "st-t abnormality": 1,
        "lv hypertrophy": 2,
        "0": 0,
        "1": 1,
        "2": 2,
    },
    "exang": {"false": 0, "true": 1, "0": 0, "1": 1},
    "slope": {"upsloping": 0, "flat": 1, "downsloping": 2, "0": 0, "1": 1, "2": 2},
    "thal": {
        "normal": 0,
        "fixed defect": 1,
        "reversable defect": 2,
        "reversible defect": 2,
        "0": 0,
        "1": 1,
        "2": 2,
        "3": 2,
    },
}


def _json_safe(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    if pd.isna(value):
        return None
    return value


def load_dataset() -> pd.DataFrame:
    if DATA_PATH.exists():
        existing = pd.read_csv(DATA_PATH)
        if len(existing) >= 900:
            return existing

    frames = []
    try:
        for center, url in UCI_PROCESSED_FILES.items():
            with urlopen(url, timeout=30) as response:
                text = response.read().decode("utf-8")
            frame = pd.read_csv(StringIO(text), header=None, names=RAW_COLUMNS, na_values="?")
            frame["dataset"] = center
            frames.append(frame)
        df = pd.concat(frames, ignore_index=True)
        df.insert(0, "id", range(1, len(df) + 1))
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
        return df
    except Exception:
        if fetch_ucirepo is None:
            raise RuntimeError(
                "heart_disease_uci.csv is missing and the official UCI files could not be downloaded."
            )

    heart_disease = fetch_ucirepo(id=45)
    features = heart_disease.data.features.copy()
    targets = heart_disease.data.targets.copy()
    df = pd.concat([features, targets], axis=1)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    return df


def normalize_schema(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [column.strip().lower() for column in df.columns]

    if "thalch" in df.columns and "thalach" not in df.columns:
        df = df.rename(columns={"thalch": "thalach"})
    if "target" not in df.columns:
        if "num" not in df.columns:
            raise ValueError("Dataset must include a 'num' or 'target' column.")
        df["target"] = df["num"].apply(lambda value: 0 if float(value) == 0 else 1)
    else:
        df["target"] = df["target"].apply(lambda value: 0 if float(value) == 0 else 1)

    missing_features = [feature for feature in FEATURE_ORDER if feature not in df.columns]
    if missing_features:
        raise ValueError(f"Dataset missing required feature columns: {missing_features}")

    if "dataset" not in df.columns:
        df["dataset"] = "UCI Repository"

    return df


def _encode_known_values(series: pd.Series, feature: str) -> pd.Series:
    value_map = VALUE_MAPS.get(feature)
    if value_map is None:
        return series

    def convert(value: Any) -> float | None:
        if pd.isna(value):
            return np.nan
        if isinstance(value, (int, float, np.integer, np.floating)):
            return float(value)
        key = str(value).strip().lower()
        return value_map.get(key, np.nan)

    return series.apply(convert)


def _align_clinical_codes(processed: pd.DataFrame) -> pd.DataFrame:
    processed = processed.copy()

    cp_values = set(pd.to_numeric(processed["cp"], errors="coerce").dropna().astype(int).unique())
    if cp_values and cp_values.issubset({1, 2, 3, 4}):
        processed["cp"] = pd.to_numeric(processed["cp"], errors="coerce") - 1

    slope_values = set(pd.to_numeric(processed["slope"], errors="coerce").dropna().astype(int).unique())
    if slope_values and slope_values.issubset({1, 2, 3}):
        processed["slope"] = pd.to_numeric(processed["slope"], errors="coerce") - 1

    thal_values = set(pd.to_numeric(processed["thal"], errors="coerce").dropna().astype(int).unique())
    if thal_values and thal_values.issubset({3, 6, 7}):
        processed["thal"] = pd.to_numeric(processed["thal"], errors="coerce").map({3: 0, 6: 1, 7: 2})

    return processed


def preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    df = normalize_schema(df)
    analytics_df = df.copy()
    processed = df.copy()

    for feature in CATEGORICAL_FEATURES:
        if feature not in processed.columns:
            continue

        known_encoded = _encode_known_values(processed[feature], feature)
        if known_encoded.notna().any():
            processed[feature] = known_encoded
        else:
            filled = processed[feature].fillna(processed[feature].mode(dropna=True)[0])
            processed[feature] = LabelEncoder().fit_transform(filled.astype(str))

    processed = _align_clinical_codes(processed)

    for column in processed.columns:
        if column == "target":
            continue
        if processed[column].isna().sum() == 0:
            continue
        if column in CATEGORICAL_FEATURES:
            processed[column] = processed[column].fillna(processed[column].mode(dropna=True)[0])
        else:
            processed[column] = processed[column].fillna(processed[column].median())

    for feature in FEATURE_ORDER:
        processed[feature] = pd.to_numeric(processed[feature], errors="coerce")
        processed[feature] = processed[feature].fillna(processed[feature].median())

    X = processed[FEATURE_ORDER]
    y = processed["target"].astype(int)
    return X, y, analytics_df


def _metric_bundle(model: Any, X_test: np.ndarray, y_test: pd.Series) -> dict[str, Any]:
    prediction = model.predict(X_test)
    probability = model.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, probability)
    return {
        "accuracy": round(float(accuracy_score(y_test, prediction)), 4),
        "precision": round(float(precision_score(y_test, prediction, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, prediction, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, prediction, zero_division=0)), 4),
        "auc": round(float(auc(fpr, tpr)), 4),
        "roc_curve": [
            {"fpr": round(float(x), 4), "tpr": round(float(y), 4)}
            for x, y in zip(fpr, tpr)
        ],
        "confusion_matrix": {
            "tn": int(confusion_matrix(y_test, prediction).ravel()[0]),
            "fp": int(confusion_matrix(y_test, prediction).ravel()[1]),
            "fn": int(confusion_matrix(y_test, prediction).ravel()[2]),
            "tp": int(confusion_matrix(y_test, prediction).ravel()[3]),
        },
    }


def _age_bins(df: pd.DataFrame) -> list[dict[str, Any]]:
    age_series = pd.to_numeric(df["age"], errors="coerce").dropna()
    bins = list(range(20, 86, 5))
    labels = [f"{bins[i]}-{bins[i + 1] - 1}" for i in range(len(bins) - 1)]
    counts = pd.cut(age_series, bins=bins, labels=labels, include_lowest=True).value_counts().sort_index()
    return [{"bin": str(label), "count": int(counts.loc[label])} for label in counts.index]


def _gender_breakdown(df: pd.DataFrame) -> list[dict[str, Any]]:
    output = []
    temp = df.copy()
    temp["sex_label"] = temp["sex"].apply(
        lambda value: "Male" if str(value).strip().lower() in {"1", "male"} else "Female"
    )
    for sex, group in temp.groupby("sex_label"):
        output.append(
            {
                "gender": sex,
                "count": int(len(group)),
                "disease_rate": round(float(group["target"].mean()), 4),
                "disease": int(group["target"].sum()),
                "no_disease": int((group["target"] == 0).sum()),
            }
        )
    return output


def _chest_pain_counts(df: pd.DataFrame) -> list[dict[str, Any]]:
    labels = {0: "Typical Angina", 1: "Atypical Angina", 2: "Non-Anginal Pain", 3: "Asymptomatic"}
    temp = df.copy()
    temp["cp_code"] = _encode_known_values(temp["cp"], "cp").fillna(temp["cp"])
    output = []
    for cp, group in temp.groupby("cp_code", dropna=False):
        cp_int = int(cp) if str(cp).replace(".0", "").isdigit() else cp
        output.append(
            {
                "type": labels.get(cp_int, str(cp)),
                "count": int(len(group)),
                "disease": int(group["target"].sum()),
                "no_disease": int((group["target"] == 0).sum()),
            }
        )
    return output


def _age_prevalence(df: pd.DataFrame) -> list[dict[str, Any]]:
    temp = df.copy()
    temp["age_group"] = pd.cut(
        pd.to_numeric(temp["age"], errors="coerce"),
        bins=[0, 39, 50, 60, 120],
        labels=["Under 40", "40-50", "50-60", "60+"],
        include_lowest=True,
    )
    rows = []
    for group_name, group in temp.groupby("age_group", observed=False):
        rows.append(
            {
                "group": str(group_name),
                "count": int(len(group)),
                "disease_rate": round(float(group["target"].mean()), 4) if len(group) else 0,
            }
        )
    return rows


def _thalach_ranges(df: pd.DataFrame) -> list[dict[str, Any]]:
    rows = []
    temp = df.copy()
    temp["thalach"] = pd.to_numeric(temp["thalach"], errors="coerce")
    for target, group in temp.groupby("target"):
        rows.append(
            {
                "status": "Disease" if int(target) == 1 else "No Disease",
                "min": round(float(group["thalach"].quantile(0.1)), 2),
                "q1": round(float(group["thalach"].quantile(0.25)), 2),
                "median": round(float(group["thalach"].median()), 2),
                "q3": round(float(group["thalach"].quantile(0.75)), 2),
                "max": round(float(group["thalach"].quantile(0.9)), 2),
            }
        )
    return rows


def _correlation_matrix(X: pd.DataFrame, y: pd.Series) -> list[dict[str, Any]]:
    cols = ["age", "trestbps", "chol", "thalach", "oldpeak", "ca"]
    temp = X[cols].copy()
    temp["target"] = y
    corr = temp.corr(numeric_only=True).round(2)
    return [
        {"x": row, "y": col, "value": float(corr.loc[row, col])}
        for row in corr.index
        for col in corr.columns
    ]


def build_analytics(
    source_df: pd.DataFrame,
    X: pd.DataFrame,
    y: pd.Series,
    metrics: dict[str, dict[str, Any]],
    best_model: GradientBoostingClassifier,
) -> dict[str, Any]:
    analytics_df = normalize_schema(source_df)
    for feature in FEATURE_ORDER:
        analytics_df[feature] = X[feature].values
    analytics_df["target"] = y.values
    disease_distribution = [
        {"label": "No Disease", "value": int((y == 0).sum())},
        {"label": "Disease", "value": int((y == 1).sum())},
    ]
    return {
        "dataset": {
            "patients": int(len(analytics_df)),
            "centers": 4,
            "features": len(FEATURE_ORDER),
            "source": "UCI Machine Learning Repository",
        },
        "disease_distribution": disease_distribution,
        "age_distribution": _age_bins(analytics_df),
        "gender_breakdown": _gender_breakdown(analytics_df),
        "chest_pain_counts": _chest_pain_counts(analytics_df),
        "age_prevalence": _age_prevalence(analytics_df),
        "model_metrics": metrics,
        "confusion_matrix": metrics["Gradient Boosting"]["confusion_matrix"],
        "roc_curves": {name: bundle["roc_curve"] for name, bundle in metrics.items()},
        "feature_importance": [
            {
                "feature": FEATURE_LABELS[feature],
                "key": feature,
                "importance": round(float(importance), 4),
            }
            for feature, importance in sorted(
                zip(FEATURE_ORDER, best_model.feature_importances_),
                key=lambda item: item[1],
                reverse=True,
            )
        ],
        "correlation_matrix": _correlation_matrix(X, y),
        "thalach_ranges": _thalach_ranges(analytics_df),
    }


def train_and_save() -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    raw_df = load_dataset()
    X, y, analytics_df = preprocess(raw_df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Logistic Regression": LogisticRegression(C=0.01, max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(
            max_depth=10,
            min_samples_leaf=2,
            min_samples_split=5,
            n_estimators=100,
            random_state=42,
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            learning_rate=0.01,
            max_depth=3,
            n_estimators=200,
            subsample=1.0,
            random_state=42,
        ),
    }

    metrics: dict[str, dict[str, Any]] = {}
    trained_models = {}
    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        trained_models[name] = model
        metrics[name] = _metric_bundle(model, X_test_scaled, y_test)
        print(f"{name}: {metrics[name]}")

    best_model = trained_models["Gradient Boosting"]
    analytics = build_analytics(analytics_df, X, y, metrics, best_model)
    metadata = {
        "feature_order": FEATURE_ORDER,
        "feature_labels": FEATURE_LABELS,
        "scaler_mean": [_json_safe(value) for value in scaler.mean_],
        "scaler_scale": [_json_safe(value) for value in scaler.scale_],
        "best_model": "Gradient Boosting",
    }

    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    ANALYTICS_PATH.write_text(json.dumps(analytics, indent=2, default=_json_safe), encoding="utf-8")
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, default=_json_safe), encoding="utf-8")

    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved scaler to {SCALER_PATH}")
    print(f"Saved analytics to {ANALYTICS_PATH}")
    return {"metrics": metrics, "metadata": metadata}


if __name__ == "__main__":
    train_and_save()
