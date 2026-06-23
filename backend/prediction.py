from functools import lru_cache
from pathlib import Path
import json

import joblib
import pandas as pd

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "best_model.pkl"
BIOLOGICAL_AGE_MODEL_PATH = ARTIFACTS_DIR / "biological_age_model.pkl"
FEATURES_PATH = ARTIFACTS_DIR / "features_metadata.json"
ALZHEIMER_CLASS = "Alzheimer's disease"
DEFAULT_RISK_THRESHOLDS = {"low": 0.33, "medium": 0.66}


class ModelCompatibilityError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def load_feature_manifest():
    with FEATURES_PATH.open(encoding="utf-8") as source:
        return json.load(source)


@lru_cache(maxsize=1)
def load_model_bundle():
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model artifact not found at {MODEL_PATH}")
    try:
        return joblib.load(MODEL_PATH)
    except (AttributeError, ModuleNotFoundError) as error:
        raise ModelCompatibilityError(
            "The prediction model requires the same scikit-learn version used during training. "
            "Install backend/requirements.txt and restart the API."
        ) from error


@lru_cache(maxsize=1)
def load_biological_age_bundle():
    if not BIOLOGICAL_AGE_MODEL_PATH.exists():
        return None
    try:
        return joblib.load(BIOLOGICAL_AGE_MODEL_PATH)
    except (AttributeError, ModuleNotFoundError) as error:
        raise ModelCompatibilityError(
            "The biological-age model requires the same scikit-learn version used during training. "
            "Install backend/requirements.txt and restart the API."
        ) from error


def _risk_level(value, thresholds=DEFAULT_RISK_THRESHOLDS):
    if value < thresholds["low"]:
        return "low"
    if value < thresholds["medium"]:
        return "medium"
    return "high"


def _as_float(value, column_name):
    try:
        return float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"Column '{column_name}' must contain numeric values") from error


def _normalize_patient_rows(rows, feature_order, manifest):
    if not rows:
        raise ValueError("The CSV file is empty")

    columns = set(rows[0])
    if "CpG_site" in columns:
        raise ValueError(
            "This CSV uses a CpG matrix layout (CpG_site as rows). For this platform model, "
            "upload one patient per row with: sample_id, age, gender, sample_type, and the "
            "selected CpG columns listed in backend/artifacts/selected_methylation_features.csv."
        )

    required_columns = manifest["raw_input_columns_required_by_platform"]
    missing_columns = [column for column in required_columns if column not in columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")

    missing_values = [
        column
        for column in required_columns
        if any(str(row.get(column, "")).strip() == "" for row in rows)
    ]
    if missing_values:
        raise ValueError(f"Missing required values: {', '.join(missing_values)}")

    gender_mapping = manifest["gender_mapping"]
    sample_type_mapping = manifest["sample_type_mapping"]
    methylation_features = set(manifest["methylation_features"])

    normalized = []
    for index, row in enumerate(rows):
        patient = {}
        patient["_c0"] = _as_float(row.get("_c0", index), "_c0")
        patient["age"] = _as_float(row["age"], "age")

        gender = str(row["gender"]).strip()
        sample_type = str(row["sample_type"]).strip()
        if gender not in gender_mapping:
            allowed = ", ".join(gender_mapping)
            raise ValueError(f"Unsupported gender '{gender}'. Allowed values: {allowed}")
        if sample_type not in sample_type_mapping:
            allowed = ", ".join(sample_type_mapping)
            raise ValueError(f"Unsupported sample_type '{sample_type}'. Allowed values: {allowed}")

        for feature in feature_order:
            if feature in methylation_features:
                patient[feature] = _as_float(row[feature], feature)

        patient["gender_index"] = float(gender_mapping[gender])
        patient["type_index"] = float(sample_type_mapping[sample_type])
        normalized.append(patient)

    return pd.DataFrame(normalized, columns=feature_order)


def _age_range(age):
    if age < 30:
        return "under 30"
    if age <= 45:
        return "30-45"
    if age <= 60:
        return "46-60"
    if age <= 75:
        return "61-75"
    return "over 75"


def _prediction_label(class_value, mapping):
    return mapping.get(str(int(class_value)), str(class_value))


def predict_rows(rows):
    manifest = load_feature_manifest()
    required_columns = manifest["raw_input_columns_required_by_platform"]
    frame = _normalize_patient_rows(rows, manifest["final_feature_order"], manifest)
    bundle = load_model_bundle()
    biological_age_bundle = load_biological_age_bundle()
    model = bundle["model"]

    probabilities = model.predict_proba(frame)
    predictions = model.predict(frame)
    class_labels = [_prediction_label(value, manifest["label_mapping_prediction_index_to_disease"]) for value in model.classes_]

    if ALZHEIMER_CLASS not in class_labels:
        raise RuntimeError("The model does not contain an Alzheimer's disease class")

    biological_ages = None
    if biological_age_bundle:
        biological_age_frame = _normalize_patient_rows(
            rows,
            biological_age_bundle["feature_order"],
            manifest,
        )
        biological_ages = biological_age_bundle["model"].predict(biological_age_frame)

    alzheimer_index = class_labels.index(ALZHEIMER_CLASS)
    results = []
    for index, (probability_row, predicted_class) in enumerate(zip(probabilities, predictions)):
        probability = float(probability_row[alzheimer_index])
        biological_age = None
        age_acceleration = None
        biological_age_range = "not available"
        if biological_ages is not None:
            biological_age = max(0.0, float(biological_ages[index]))
            chronological_age = _as_float(rows[index]["age"], "age")
            age_acceleration = biological_age - chronological_age
            biological_age_range = _age_range(biological_age)

        results.append(
            {
                "row": index + 1,
                "sample_id": rows[index].get("sample_id") or f"row-{index + 1}",
                "predicted_disease": _prediction_label(
                    predicted_class, manifest["label_mapping_prediction_index_to_disease"]
                ),
                "alzheimer_risk_probability": round(probability, 4),
                "alzheimer_risk_percentage": round(probability * 100, 2),
                "alzheimer_risk_level": _risk_level(probability),
                "biological_age": round(biological_age, 1) if biological_age is not None else None,
                "biological_age_range": biological_age_range,
                "age_acceleration": round(age_acceleration, 1) if age_acceleration is not None else None,
            }
        )

    return required_columns, results
