# FlyWise

Flight delay analytics and prediction platform for INF2006 Group 12.

## Architecture

```text
React/Vite frontend (:3000)
        |
        v
FastAPI backend (:8000) ---- Aviationstack (live flights only)
        |
        v
MySQL/MariaDB Workbench (historical data and analytics)
```

Historical searches, analytics, and predictions use the database. Aviationstack is
called only by `GET /live-flights` when a user manually loads the Live Flights page.

## Prerequisites

- Python 3.13 or compatible Python version
- Node.js and npm
- MySQL/MariaDB and MySQL Workbench
- A database named `group_project` containing `airlines`, `airports`, `routes`, and `flights`
- An Aviationstack API key for local live-flight testing

The database is not stored in Git. Share a sanitized schema/data setup script separately;
never commit database passwords or API keys.

## Run Locally

Run the backend and frontend in separate terminals from this directory.

### Terminal 1: FastAPI

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "<your-workbench-password>"
$env:DB_NAME = "group_project"
$env:AVIATIONSTACK_API_KEY = "<your-aviationstack-key>"
$env:AVIATIONSTACK_BASE_URL = "http://api.aviationstack.com/v1"

python -m uvicorn FastAPI:app --reload --port 8000
```

### Terminal 2: React

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>. FastAPI documentation is available at
<http://localhost:8000/docs>.

## Frontend Pages

- **Overview**: summary metrics, route performance, congestion, and prediction.
- **Flight Search**: historical flights from the Workbench database.
- **Live Flights**: manually refreshed Aviationstack scheduled flights.
- **Analytics**: monthly, hourly, and delay-cause analysis from the database.

## Main API Routes

```text
GET  /summary
GET  /airports
GET  /airlines/list
GET  /airlines
GET  /airports/congestion
POST /predict
GET  /flights
GET  /flights/{flight_id}
GET  /analytics/...
GET  /live-flights?airport=JFK&direction=Departure
```

The frontend uses Vite's development proxy. The Aviationstack key stays in FastAPI and
is never sent to React. The free Aviationstack plan has a 100-request monthly limit, so
Live Flights uses manual refresh rather than automatic polling.

## Checks

```powershell
npm run type-check
npm run lint
python -m py_compile FastAPI.py
```

## AWS Deployment

Recommended split:

```text
React build       -> S3 + CloudFront
FastAPI container  -> App Runner or ECS/Fargate
Database           -> Amazon RDS for MySQL/MariaDB
```

Build the FastAPI image:

```powershell
docker build -t flywise-api .
```

Build the frontend for the deployed API:

```powershell
$env:VITE_API_URL = "https://<your-fastapi-service-url>"
npm run build
```

Configure these variables in the AWS service, preferably through AWS Secrets Manager:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
AVIATIONSTACK_API_KEY
FRONTEND_ORIGIN
```

## Important Files

```text
FastAPI.py                  FastAPI backend and database/API routes
requirements.txt            Python dependencies
SQL Queries/                SQL used by the backend
src/client/                 React pages and components
src/client/services/api.ts  Frontend API client
vite.config.ts              Development proxy and build settings
Dockerfile                  FastAPI production container
data/                       Database documentation
```
