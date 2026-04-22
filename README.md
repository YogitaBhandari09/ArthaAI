# Artha AI

Voice-first financial copilot for Bharat users.

[![Live MVP](https://img.shields.io/badge/Live_MVP-Open_Now-10b981?style=for-the-badge)](https://frontend-psi-smoky-62.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://frontend-psi-smoky-62.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-API-2563eb?style=for-the-badge)](https://backend-eta-two-89.vercel.app/api/health)
[![ML Service](https://img.shields.io/badge/ML_Service-Online-f59e0b?style=for-the-badge)](https://mlmodel-lime.vercel.app/health)

## Live Demo

- MVP: **https://frontend-psi-smoky-62.vercel.app**
- Backend health: `https://backend-eta-two-89.vercel.app/api/health`
- Backend status: `https://backend-eta-two-89.vercel.app/api/status`
- ML health: `https://mlmodel-lime.vercel.app/health`

## Why Artha AI

Many first-time investors do not need complicated finance dashboards. They need:

- simple guidance in their own language
- voice-first interaction
- practical next steps, not only product rates
- reliable responses even when AI services are unavailable

Artha AI solves this with a hybrid architecture: **LLM + ML + safe rule-based fallback**.

## Key Highlights

- Multilingual experience: **Hindi, Bengali, Tamil**
- Voice input + voice output
- Voice Assist toggle for low-literacy users
- FD-focused recommendation cards with maturity and profit
- What-if FD simulator (amount, rate, tenure)
- Live system status bar (Backend / ML / AI)
- Resilient fallback mode when AI fails or quota is hit
- Deployed end-to-end on Vercel

## Product Experience

1. User completes quick onboarding (name, age, income, goal)
2. User speaks or types in selected language
3. Backend gets ML recommendation + confidence
4. LLM generates structured advice with reasoning and action steps
5. If LLM is weak/unavailable, fallback engine returns safe localized guidance
6. UI reads answer aloud and shows actionable investment card

## Architecture

```text
[React + Vite Frontend]
      |
      | /api/chat /api/recommend /api/calculate /api/status
      v
[Node.js + Express Backend]
   |                |
   |                +--> [Gemini API]
   |
   +--> [Flask ML Service]
            |
            +--> [Trained model.pkl]
```

## Tech Stack

- Frontend: React, Vite, Lucide
- Backend: Node.js, Express, Helmet, CORS
- LLM: Google Gemini
- ML Service: Python, Flask, scikit-learn
- Model Artifact: `ml_model/model.pkl`
- Deployment: Vercel (frontend, backend, ML)

## Reliability and Safety

- Language-aware response enforcement (`hi-IN`, `bn-IN`, `ta-IN`)
- Structured JSON output contract from LLM
- Weak-output detection and guarded fallback responses
- API status endpoint with ML reachability + latency
- User-visible fallback badge for transparency

## API Endpoints

### `POST /api/chat`
Returns localized financial guidance with card metadata.

### `POST /api/recommend`
Returns recommendation, confidence, and tenure.

### `POST /api/calculate`
Returns maturity, profit, effective rate, and top bank comparison.

### `GET /api/status`
Returns backend, ML, and AI configuration health.

## Local Setup

```bash
git clone <your-repo-url>
cd ArthaAI
npm run install:all
python -m pip install -r ml_model/requirements.txt
npm run train:ml
npm run dev
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key
ML_SERVICE_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:5173
GEMINI_MODEL=gemini-2.0-flash
```

## Project Structure

```text
frontend/
backend/
ml_model/
README.md
```

## Submission Ready Notes

- Solo-friendly MVP
- Working deployed URL
- Real code and live architecture
- Clear user problem fit in fintech inclusion
- Strong demo narrative with multilingual voice-first UX

## Live Link for Evaluators

**https://frontend-psi-smoky-62.vercel.app**
