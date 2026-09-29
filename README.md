# FlyWise

Flight delay analytics and prediction platform for INF2006 Group 12.

## Architecture

```text
React/Vite (:3000)
       |
       v
FastAPI (:8000) -------- Aviationstack
       |
       v
MySQL/MariaDB
```

* **MySQL/MariaDB** — historical flight data, analytics, predictions, users and saved flights
* **Aviationstack** — live/current flight data
* **FastAPI** — backend API and authentication
* **React/Vite** — frontend

## Prerequisites

* Python 3.13+
* Node.js and npm
* MySQL/MariaDB and MySQL Workbench
* Database: `group_project`
* Aviationstack API key

Database credentials and API keys must not be committed to Git.

## Run Locally

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "<your-password>"
$env:DB_NAME = "group_project"
$env:AVIATIONSTACK_API_KEY = "<your-api-key>"
$env:AVIATIONSTACK_BASE_URL = "http://api.aviationstack.com/v1"

python -m uvicorn FastAPI:app --reload --port 8000
```

### Frontend

```powershell
npm install
npm run dev
```

Frontend: `http://localhost:3000`
API documentation: `http://localhost:8000/docs`

## Features

* **Overview** — summary metrics, route performance, congestion and prediction
* **Flight Search** — historical flight search
* **Live Flights** — manually loaded live/current flights from Aviationstack
* **Analytics** — monthly, hourly and delay-cause analysis
* **Prediction** — historical delay-risk prediction
* **Accounts** — signup, login and JWT authentication
* **Saved Flights** — save and manage historical/upcoming flights

## Main API Routes

```text
GET  /summary
GET  /airports
GET  /airlines
GET  /airports/congestion
POST /predict

GET  /flights
GET  /flights/{flight_id}

GET  /analytics/...
GET  /live-flights?airport=JFK&direction=Departure

POST /signup
POST /login
GET  /me

GET    /upcoming-saved-flights
POST   /upcoming-saved-flights
DELETE /upcoming-saved-flights/{id}
```

Aviationstack is called only when `/live-flights` is requested. The API key remains on the FastAPI backend.

## Checks

```powershell
npm run type-check
npm run lint
python -m py_compile FastAPI.py
```

## AWS Deployment

```text
React build  -> S3 + CloudFront
FastAPI      -> App Runner / ECS
Database     -> Amazon RDS
```

Frontend production build:

```powershell
$env:VITE_API_URL = "https://<your-fastapi-service-url>"
npm run build
```

Configure these environment variables on the backend:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
AVIATIONSTACK_API_KEY
AVIATIONSTACK_BASE_URL
FRONTEND_ORIGIN
```

## Important Files

```text
FastAPI.py                  FastAPI backend
requirements.txt            Python dependencies
SQL Queries/                Backend SQL queries
src/client/                 React frontend
src/client/services/api.ts  Frontend API client
src/client/trip.ts          Flight logic and prediction
vite.config.ts              Vite configuration
Dockerfile                  FastAPI container
data/                       Database documentation
```