# FlyWise

**INF2006 Group 12 — Flight Delay Analytics and Prediction Platform**

## Problem Statement

Flight delays can significantly affect passengers and airline operations, while large amounts of flight data can be difficult to interpret. **FlyWise** combines historical flight data, live flight information and machine learning to provide flight search, delay analytics, live flight tracking and delay-risk predictions through a web-based platform.

## Team Members

* [Chong Xin Huei - 2502122]
* [Damien Teh Zhanrong - 2500837]
* [Daniel Tay Zhu Hao - 2501690]
* [Wong Jinghong - 2503049]
* [Wong Zheng Sheng, Jasper - 2500024]

## Quick Start

### Prerequisites

* Python 3.13+
* Node.js and npm
* MySQL/MariaDB
* Aviationstack API key
* Database: `group_project`

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
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

* Frontend: `http://localhost:3000`
* API Docs: `http://localhost:8000/docs`

## Architecture

![FlyWise Architecture](docs/architecture.png)

```text
React/Vite
    |
    v
FastAPI -------- Aviationstack
    |
    v
MySQL/MariaDB
```

## Technologies

* **Frontend:** React, TypeScript, Vite
* **Backend:** Python, FastAPI
* **Database:** MySQL/MariaDB
* **Machine Learning:** XGBoost, scikit-learn
* **Data Processing:** pandas, NumPy
* **Authentication:** JWT, bcrypt
* **External API:** Aviationstack
* **Deployment:** AWS S3, CloudFront, App Runner/ECS, RDS

## Features

* Flight search and historical flight data
* Live/current flight information
* Monthly, hourly and delay-cause analytics
* XGBoost flight delay prediction
* User signup, login and JWT authentication
* Saved historical and upcoming flights

## Main API Routes

```text
GET  /summary
GET  /airports
GET  /airlines
GET  /flights
GET  /analytics/...
GET  /live-flights
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
npm run type-check
npm run lint
python -m py_compile FastAPI.py
```

## Known Limitations

* Live flight data depends on Aviationstack availability and API limits.
* Predictions depend on the coverage and quality of historical training data.
* Prediction requires the selected airline, airports and route information to be available in the historical database.
* Historical and live flight data come from different sources and may have different coverage.
* Local development requires configured database credentials and API keys.

## AWS Deployment

```text
React/Vite → S3 + CloudFront
                 |
              FastAPI
                 |
             Amazon RDS
                 |
           Aviationstack
```

Production backend environment variables:

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