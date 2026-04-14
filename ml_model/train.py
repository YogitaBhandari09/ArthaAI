import os
import pickle
import sys

import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder

ROOT_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(ROOT_DIR, "data", "training_data.csv")
MODEL_PATH = os.path.join(ROOT_DIR, "model.pkl")
FEATURE_IMPORTANCE_PATH = os.path.join(ROOT_DIR, "feature_importance.txt")


def ensure_training_data():
    if os.path.exists(DATA_PATH):
        return

    print("Training data not found. Generating synthetic data...")
    sys.path.insert(0, os.path.join(ROOT_DIR, "data"))
    from generate_data import main as generate_main

    generate_main()


def prepare_features(dataframe):
    goal_encoder = LabelEncoder()
    risk_encoder = LabelEncoder()
    label_encoder = LabelEncoder()

    dataframe = dataframe.copy()
    dataframe["goal_encoded"] = goal_encoder.fit_transform(dataframe["goal"])
    dataframe["risk_encoded"] = risk_encoder.fit_transform(dataframe["risk_tolerance"])

    feature_columns = [
        "age",
        "monthly_income",
        "savings",
        "goal_encoded",
        "risk_encoded",
        "dependents",
    ]

    X = dataframe[feature_columns]
    y = label_encoder.fit_transform(dataframe["recommendation"])

    return X, y, feature_columns, goal_encoder, risk_encoder, label_encoder


def choose_best_model(X_train, y_train):
    candidates = {
        "RandomForestClassifier": RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            random_state=42,
        ),
        "GradientBoostingClassifier": GradientBoostingClassifier(random_state=42),
    }

    cv_scores = {}
    for name, model in candidates.items():
        scores = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy")
        cv_scores[name] = scores.mean()
        print(f"{name} cross-val accuracy: {scores.mean():.4f} (+/- {scores.std():.4f})")

    best_name = max(cv_scores, key=cv_scores.get)
    best_model = candidates[best_name]
    best_model.fit(X_train, y_train)
    return best_name, best_model


def save_feature_importance_text(model, feature_columns):
    if hasattr(model, "feature_importances_"):
        ranked = sorted(
            zip(feature_columns, model.feature_importances_),
            key=lambda item: item[1],
            reverse=True,
        )
        lines = ["Feature importance ranking (higher means more influence):"]
        lines.extend([f"- {name}: {score:.4f}" for name, score in ranked])
    else:
        lines = [
            "Feature importance is not directly available for the selected model.",
            "Use permutation importance in future iterations.",
        ]

    with open(FEATURE_IMPORTANCE_PATH, "w", encoding="utf-8") as file:
        file.write("\n".join(lines))
    print(f"Saved feature importance notes to {FEATURE_IMPORTANCE_PATH}")


def main():
    ensure_training_data()
    dataframe = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset with shape: {dataframe.shape}")

    X, y, feature_columns, goal_encoder, risk_encoder, label_encoder = prepare_features(dataframe)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model_name, model = choose_best_model(X_train, y_train)
    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    print(f"\nSelected model: {model_name}")
    print(f"Test accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, predictions, target_names=label_encoder.classes_))

    artifact = {
        "model": model,
        "model_name": model_name,
        "feature_columns": feature_columns,
        "goal_encoder": goal_encoder,
        "risk_encoder": risk_encoder,
        "label_encoder": label_encoder,
        "accuracy": accuracy,
    }

    with open(MODEL_PATH, "wb") as file:
        pickle.dump(artifact, file)
    print(f"Saved model artifact at {MODEL_PATH}")

    save_feature_importance_text(model, feature_columns)


if __name__ == "__main__":
    main()
