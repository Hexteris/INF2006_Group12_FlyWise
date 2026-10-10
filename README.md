# FlyWise

**INF2006 Group 12 — Flight Delay Analytics and Prediction Platform**

## Problem Statement

Flight delays can significantly affect passengers and airline operations, while large amounts of flight data can be difficult to interpret. **FlyWise** combines historical flight data, live flight information and machine learning to provide flight search, delay analytics, live flight tracking and delay-risk predictions through a web-based platform.

## Team Members

* Chong Xin Huei - 2502122
* Damien Teh Zhanrong - 2500837
* Daniel Tay Zhu Hao - 2501690
* Wong Jinghong - 2503049
* Wong Zheng Sheng, Jasper - 2500024

## Quick Start

### Prerequisites

* Python 3.13+
* Node.js and npm
* MySQL/MariaDB (with MySQL Workbench)
* Database: `group_project`
* Aviationstack API key

Database credentials and API keys must not be committed to Git.

### Setup

All application code lives in `src/`. Run every command below from inside `src/` so the `.env` file resolves.

```powershell
cd src
Copy-Item .env.example .env        # then fill in real values
```

### Backend

```powershell
python -m venv ../.venv
../.venv/Scripts/Activate.ps1      # Linux/macOS: source ../.venv/bin/activate
pip install -r requirements.txt
python -m uvicorn FastAPI:app --reload --port 8000
```

### Frontend

```powershell
npm install
npm run dev                        # proxies API calls to :8000
```

### Docker (optional)

```powershell
docker build -t flywise .
docker run --env-file .env -p 8000:8000 flywise
```

* Frontend: <http://localhost:3000>
* API Docs: <http://localhost:8000/docs>

The full source CSVs are not committed. Place them in `data/raw/`.

## Architecture

![FlyWise Architecture](docs/architecture.png)

```text
React/Vite frontend (:3000)
        |  ↑
        |  JWT Auth (localStorage)
        v  |
FastAPI backend (:8000) ---- Aviationstack (live flights only)
        |
        v
MySQL/MariaDB (historical data, analytics, users, saved flights)
```

Historical searches, analytics and predictions use the database. Aviationstack is called only by `GET /live-flights` when a user manually loads the Live Flights page. The API key stays in FastAPI and is never sent to the frontend.

## Technologies

* **Frontend:** React, TypeScript, Vite
* **Backend:** Python, FastAPI
* **Database:** MySQL/MariaDB
* **Machine Learning:** XGBoost, scikit-learn
* **Data Processing:** pandas, NumPy
* **Authentication:** JWT, bcrypt
* **External API:** Aviationstack
* **Deployment:** Docker, AWS S3, CloudFront, App Runner/ECS, RDS

## Features

* Historical flight search and delay comparison
* Live/current flight information
* Monthly, hourly and delay-cause analytics
* XGBoost flight delay prediction (sign-in required)
* User signup, login and JWT authentication
* Saved historical and upcoming flights

### Frontend Pages

* **Overview:** summary metrics, route performance, congestion and prediction
* **Flight Search:** historical flights from the database
* **Live Flights:** manually refreshed Aviationstack scheduled flights
* **Analytics:** monthly, hourly and delay-cause analysis

## Main API Routes

```text
GET  /summary
GET  /airports
GET  /airlines
GET  /airports/congestion
GET  /flights
GET  /flights/{flight_id}
GET  /analytics/...
GET  /live-flights?airport=JFK&direction=Departure
POST /predict

POST /signup
POST /login
GET  /me

GET    /upcoming-saved-flights
POST   /upcoming-saved-flights
DELETE /upcoming-saved-flights/{id}
```

## Checks

```powershell
cd src
npm run type-check
npm run lint
python -m py_compile FastAPI.py
```

## Known Limitations

* Live flight data depends on Aviationstack availability. The free plan allows 100 requests per month, so Live Flights uses manual refresh instead of polling.
* Predictions depend on the coverage and quality of the historical training data.
* Predictions for international flights may be less reliable because the model was trained on the 2025 US BTS On-Time Performance dataset.
* Airport coordinates must be available in `data/airports.json` for prediction distance calculations.
* Historical and live flight data come from different sources and may have different coverage.
* Local development requires configured database credentials and API keys.

## AWS Deployment

```text
React build  -> S3 + CloudFront
FastAPI      -> App Runner / ECS
Database     -> Amazon RDS
Live data    -> Aviationstack (called from FastAPI)
```

Frontend production build:

```powershell
$env:VITE_API_URL = "https://<your-fastapi-service-url>"
npm run build
```

Backend environment variables:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET_KEY
AVIATIONSTACK_API_KEY
AVIATIONSTACK_BASE_URL
FRONTEND_ORIGIN
```

## Important Files

```text
src/FastAPI.py                       FastAPI backend
src/requirements.txt                 Python dependencies
src/.env.example                     Environment variable template (placeholders only)
src/SQL Queries/                     SQL used by the backend
src/client/                          React pages and components
src/client/services/api.ts           Frontend API client
src/client/context/AuthContext.tsx   Authentication state
src/types.ts                         TypeScript interfaces
src/vite.config.ts                   Dev proxy and build settings
src/Dockerfile                       FastAPI production container
ML Model/                            Trained XGBoost model and preprocessor
database/                            SQL summary tables
data/                                Airport data (full CSVs go in data/raw/)
```
