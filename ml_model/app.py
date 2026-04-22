import os
import pickle

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

ROOT_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ROOT_DIR, "model.pkl")

app = Flask(__name__)
CORS(app)

artifact = None

BANK_OPTIONS = [
    {"bank": "Unity Small Finance Bank", "rate": 9.0},
    {"bank": "Suryoday Small Finance Bank", "rate": 8.5},
    {"bank": "ESAF Small Finance Bank", "rate": 8.25},
    {"bank": "Utkarsh Small Finance Bank", "rate": 8.0},
    {"bank": "State Bank of India", "rate": 6.8},
]

TENURE_HINTS = {
    "FD_short": 6,
    "FD_medium": 9,
    "FD_long": 18,
    "RD": 12,
    "SavingsAccount": 3,
    "RD_plus_MF": 18,
}


def load_model():
    global artifact
    if not os.path.exists(MODEL_PATH):
        artifact = None
        return
    with open(MODEL_PATH, "rb") as file:
        artifact = pickle.load(file)


def safe_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def safe_int(value, default):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return int(default)


def safe_label_transform(encoder, value):
    classes = list(encoder.classes_)
    if value in classes:
        return int(encoder.transform([value])[0])
    return int(encoder.transform([classes[0]])[0])


def map_recommendation_for_response(label):
    if label == "RD_plus_MF":
        return "RD"
    return label


def build_reasoning(recommendation, confidence, profile):
    age = safe_int(profile.get("age"), 30)
    income = safe_int(profile.get("income"), 15000)
    goal = profile.get("goal", "emergency")

    if recommendation == "SavingsAccount":
        return f"आपकी बचत और लक्ष्य को देखकर पहले लिक्विड पैसे रखना बेहतर है। (विश्वास {confidence:.0%})"
    if recommendation == "FD_short":
        return f"कम आय और सुरक्षा को देखते हुए छोटी अवधि की FD सही रहेगी। (विश्वास {confidence:.0%})"
    if recommendation == "FD_long":
        return f"उम्र {age} और जोखिम प्रोफाइल के आधार पर लंबी FD स्थिर विकल्प है। (विश्वास {confidence:.0%})"
    if recommendation == "RD":
        return f"आय ₹{income} और लक्ष्य {goal} के लिए नियमित निवेश वाली RD उपयोगी रहेगी। (विश्वास {confidence:.0%})"
    return f"प्रोफाइल के हिसाब से मध्यम अवधि निवेश संतुलित रहेगा। (विश्वास {confidence:.0%})"


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "model": "loaded" if artifact else "missing",
        }
    )


@app.post("/predict")
def predict():
    if artifact is None:
        return jsonify({"message": "Model not loaded. Run train.py first."}), 503

    payload = request.get_json(silent=True) or {}
    profile = {
        "age": safe_int(payload.get("age"), 30),
        "income": safe_int(payload.get("income"), 15000),
        "savings": safe_int(payload.get("savings"), 0),
        "goal": payload.get("goal", "emergency"),
        "risk": payload.get("risk", "low"),
        "dependents": safe_int(payload.get("dependents"), 0),
    }

    goal_encoded = safe_label_transform(artifact["goal_encoder"], profile["goal"])
    risk_encoded = safe_label_transform(artifact["risk_encoder"], profile["risk"])

    feature_row = pd.DataFrame(
        [
            {
                "age": profile["age"],
                "monthly_income": profile["income"],
                "savings": profile["savings"],
                "goal_encoded": goal_encoded,
                "risk_encoded": risk_encoded,
                "dependents": profile["dependents"],
            }
        ]
    )

    model = artifact["model"]
    predicted = model.predict(feature_row)[0]
    recommendation_raw = artifact["label_encoder"].inverse_transform([predicted])[0]
    recommendation = map_recommendation_for_response(recommendation_raw)

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(feature_row)[0]
        confidence = float(np.max(probabilities))
    else:
        confidence = 0.65

    tenure = TENURE_HINTS.get(recommendation_raw, TENURE_HINTS.get(recommendation, 12))
    reasoning = build_reasoning(recommendation, confidence, profile)

    return jsonify(
        {
            "recommendation": recommendation,
            "confidence": round(confidence, 4),
            "tenure_months": int(tenure),
            "reasoning": reasoning,
        }
    )


@app.post("/compare")
def compare():
    payload = request.get_json(silent=True) or {}
    amount = safe_float(payload.get("amount"), 10000)
    months = max(1, safe_int(payload.get("months"), 12))

    def maturity(principal, rate, tenure):
        return round(principal * ((1 + rate / 100 / 12) ** tenure), 2)

    options = []
    for bank in BANK_OPTIONS:
        matured = maturity(amount, bank["rate"], months)
        options.append(
            {
                "bank": bank["bank"],
                "rate": bank["rate"],
                "months": months,
                "maturity": matured,
                "profit": round(matured - amount, 2),
            }
        )

    options.sort(key=lambda option: option["maturity"], reverse=True)
    return jsonify({"options": options[:5]})


if __name__ == "__main__":
    load_model()
    port = int(os.environ.get("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=False)
else:
    load_model()
