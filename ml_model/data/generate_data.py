import os
import random

import numpy as np
import pandas as pd

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "training_data.csv")

GOALS = ["emergency", "growth", "retirement", "education", "short_term"]
RISKS = ["low", "medium", "high"]


def weighted_choice(values, weights):
    return random.choices(values, weights=weights, k=1)[0]


def assign_label(profile):
    age = profile["age"]
    income = profile["monthly_income"]
    savings = profile["savings"]
    goal = profile["goal"]
    risk = profile["risk_tolerance"]

    if age > 55 or risk == "low":
        label = "FD_long"
        tenure = random.randint(12, 24)
    elif income < 15000 and savings < 20000:
        label = "FD_short"
        tenure = random.randint(3, 6)
    elif income > 50000 and risk == "high" and age < 40:
        label = "RD_plus_MF"
        tenure = random.randint(12, 24)
    elif goal == "emergency" and savings < income * 3:
        label = "SavingsAccount"
        tenure = random.randint(1, 3)
    elif goal == "education" and age < 45:
        label = "RD"
        tenure = random.randint(12, 36)
    else:
        label = "FD_medium"
        tenure = random.randint(6, 12)

    return label, tenure


def generate_sample():
    age = random.randint(18, 70)
    monthly_income = int(np.clip(np.random.lognormal(mean=10.1, sigma=0.65), 5000, 200000))
    savings = int(np.clip(np.random.lognormal(mean=10.8, sigma=1.0), 1000, 1000000))
    goal = weighted_choice(GOALS, [0.28, 0.2, 0.16, 0.2, 0.16])
    risk_tolerance = weighted_choice(RISKS, [0.5, 0.34, 0.16])
    dependents = random.randint(0, 5)
    has_existing_fd = bool(random.getrandbits(1))

    profile = {
        "age": age,
        "monthly_income": monthly_income,
        "savings": savings,
        "goal": goal,
        "risk_tolerance": risk_tolerance,
        "dependents": dependents,
        "has_existing_fd": has_existing_fd,
    }

    recommendation, tenure_months = assign_label(profile)
    profile["recommendation"] = recommendation
    profile["tenure_months"] = tenure_months
    return profile


def generate_dataset(samples=1000):
    random.seed(42)
    np.random.seed(42)
    rows = [generate_sample() for _ in range(samples)]
    dataset = pd.DataFrame(rows)
    return dataset


def main():
    dataset = generate_dataset(1000)
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    dataset.to_csv(OUTPUT_PATH, index=False)
    print(f"Generated {len(dataset)} samples at {OUTPUT_PATH}")
    print(dataset["recommendation"].value_counts())


if __name__ == "__main__":
    main()
