# अर्थ AI — Voice-First Financial Copilot for Bharat

> **Banner idea:** A smartphone chat UI in dark navy + gold, with a mic pulse and Hindi bubbles saying "मेरे पास ₹10,000 है, क्या करूँ?"

**Tagline:** *"Mere paas 10,000 hai, kya karu? — Artha knows the answer."*

---

## Problem

India has massive fintech growth, but access + understanding are still unequal:

- 500M+ people have historically remained underbanked/financially excluded across low-income and rural segments.
- Financial literacy remains low (widely cited national estimates around ~1 in 4 adults being financially literate).
- Most fintech experiences are text-heavy, English-first, and intimidating for first-time users.

For rural users, the real question is simple: **"मेरे पैसे का सही फैसला क्या है?"**

---

## Solution

**Artha AI** is a voice-first Hindi financial copilot designed for Bharat users:

- WhatsApp-style conversational UI
- Voice input + voice output
- Simple Hindi guidance (not jargon-heavy finance language)
- FD-focused actionable advice cards
- ML-backed recommendation engine with fallback logic

---

## Features

- 🎤 Voice-first onboarding (नाम, उम्र, आय, लक्ष्य)
- 💬 Hindi conversational AI chat
- 🧠 ML recommendation microservice (risk + profile based)
- 📊 FD calculator + growth chart + maturity comparison
- 🏦 Live-style FD rates panel
- 🌐 Language switcher (हि / বাং / தமி)
- 🛡️ Backend rate limiting + secure API routing
- ⚙️ Graceful degradation when ML or AI service fails

---

## Architecture

```text
[React + Vite Frontend]
        |
        |  /api/chat, /api/calculate, /api/recommend
        v
[Node.js + Express Backend]
   |             |
   |             +--> [Google Gemini 1.5 Flash]
   |
   +--> [Flask ML Service]
            |
            +--> [Trained model.pkl (RF/GB best model)]
```

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, lucide-react |
| Backend API | Node.js, Express, Helmet, CORS |
| LLM | Google Gemini 1.5 Flash |
| ML Service | Python, Flask, scikit-learn |
| ML Models | RandomForestClassifier, GradientBoostingClassifier |
| Deployment Targets | Vercel (frontend), Render (backend + ML) |

---

## Quick Start

```bash
git clone <your-repo-url>
cd artha-ai
npm run install:all
# Add your GEMINI_API_KEY to backend/.env
python -m pip install -r ml_model/requirements.txt
npm run train:ml   # train the ML model first
npm run dev        # starts frontend + backend + ML
```

---

## API Documentation

### 1) `POST /api/chat`
- Input:
```json
{
  "message": "मेरे पास 10000 हैं, क्या करूँ?",
  "profile": { "age": 30, "income": 20000, "savings": 10000, "goal": "emergency", "risk": "low" }
}
```
- Output:
```json
{
  "reply": "....",
  "product": "FD",
  "bank": "Unity Small Finance Bank",
  "rate": 9,
  "amount": 10000,
  "months": 12,
  "returns": 10938,
  "tip": "....",
  "mlConfidence": 0.82
}
```

### 2) `POST /api/calculate`
- Input:
```json
{ "amount": 10000, "rate": 8.5, "months": 12 }
```
- Output:
```json
{
  "maturity": 10884,
  "profit": 884,
  "effectiveRate": 0.0884,
  "comparison": [
    { "bank": "Unity Small Finance Bank", "rate": 9, "maturity": 10938 }
  ]
}
```

### 3) `POST /api/recommend`
- Input:
```json
{
  "profile": { "age": 32, "income": 22000, "savings": 8000, "goal": "emergency", "risk": "low" }
}
```
- Output:
```json
{
  "recommendation": "FD_long",
  "confidence": 0.95,
  "tenure_months": 18,
  "reasoning": "..."
}
```

---

## ML Model

- **Synthetic dataset size:** 1000 user profiles
- **Features used:** age, monthly_income, savings, goal, risk_tolerance, dependents
- **Models trained:** RandomForest (150 trees, depth 8) vs GradientBoosting
- **Best model selected:** GradientBoostingClassifier
- **Observed test accuracy:** **0.9700**
- **Artifacts:** `ml_model/model.pkl`, `ml_model/feature_importance.txt`

---

## Demo

- `docs/screenshots/chat-home.png` (placeholder)
- `docs/screenshots/advice-card.png` (placeholder)
- `docs/screenshots/onboarding-voice.png` (placeholder)

---

## Hackathon Context

Built for **Blostem AI Builder Hackathon** as a practical AI solution for inclusive financial guidance in rural India.

---

## Deployment (Free Tier)

- **Frontend:** Deploy `frontend/` to Vercel
- **Backend:** Deploy `backend/` to Render Web Service
- **ML Service:** Deploy `ml_model/` to Render Web Service
- Set backend env:
  - `GEMINI_API_KEY`
  - `ML_SERVICE_URL` (Render URL of ML service)
  - `CORS_ORIGIN` (Vercel frontend URL)

---

## License

MIT
