# FlyWise

Flight delay analytics and prediction platform for INF2006 Group 12.

## Architecture

```text
React/Vite frontend (:3000)
        |  ↑
        |  JWT Auth (LocalStorage)
        v  |
FastAPI backend (:8000) ---- Aviationstack (live flights only)
        |  ↑
        |  User Auth DB (future)
        v
MySQL/MariaDB Workbench (historical data and analytics)
```

**Authentication Flow:**
1. Frontend handles JWT token management in localStorage
2. Tokens automatically validated on app load
3. Auth state controls UI/feature access (partial gate)
4. Backend auth endpoints ready for implementation
5. Future: User database for persistent account storage

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

## User Authentication Flow

The FlyWise platform implements a **partial-gate authentication system** where most features are publicly accessible, but prediction capabilities require user accounts.

### **Authentication Features**

**When Not Logged In:**
- **Public Access**: All dashboard pages, analytics, flight search, and live flights
- **Prediction Guard**: Flight delay predictions require sign-in
- **Auth Access Points**:
  - "Sign in" link in the top-right header
  - Auth prompt on the prediction form
  - Mobile menu auth section

**When Logged In:**
- **Full Prediction Access**: Submit unlimited flight delay predictions
- **Account Management**: Update profile, manage account settings
- **Enhanced Features**: Personalized experience with user-specific features

### **User Account Management**

**Creating an Account:**
1. Click "Sign in" in the header
2. Switch to "Create account" mode
3. Enter email, password, and optional name
4. Account created instantly with JWT token storage

**Managing Your Account:**
- **Profile Updates**: Change name and email
- **Account Settings**: Access via header dropdown → "Account Settings"
- **Security**: Passwords handled securely (future backend implementation)
- **Account Deletion**: Full CRUD support with confirmation safeguards

**Signing Out:**
- Header dropdown → "Log out"
- Confirmation modal shows user info
- Requires explicit confirmation
- Token cleared from localStorage

### **Prediction Workflow**

**For New Users:**
1. Navigate to Overview page
2. Fill out prediction form (airline, airports, time, date)
3. Click "Get delay prediction"
4. See auth prompt with sign-in/create account options
5. Complete authentication
6. Prediction submitted automatically after login

**For Returning Users:**
1. Sign in via header (token persists between sessions)
2. Fill prediction form
3. Submit directly without interruption
4. View prediction results with confidence scores

### **Security & Privacy**

- **JWT Tokens**: Secure bearer token authentication
- **Local Storage**: Tokens persisted for session continuity
- **Validation**: Automatic token validation on app load
- **Partial Data**: Only essential user data stored client-side
- **Confirmation Dialogs**: Critical actions require explicit confirmation

## Frontend Pages

- **Overview**: summary metrics, route performance, congestion, and prediction.
- **Flight Search**: historical flights from the Workbench database.
- **Live Flights**: manually refreshed Aviationstack scheduled flights.
- **Analytics**: monthly, hourly, and delay-cause analysis from the database.

## Main API Routes

### Core Application Routes
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

### Authentication Routes (Frontend Ready - Backend Implementation Required)
```text
POST /auth/login           # User login with email/password
POST /auth/signup          # Create new user account
GET  /auth/me              # Get current user profile (requires auth)
PUT  /auth/profile         # Update user profile (requires auth)
DELETE /auth/account       # Delete user account (requires auth)
```

**Note**: Authentication routes are proxied through Vite during development and ready for backend implementation.

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
src/client/services/api.ts  Frontend API client (includes auth API)
src/client/context/AuthContext.tsx  Authentication state management
src/client/components/AuthModal.tsx         Login/signup modal
src/client/components/AccountSettingsModal.tsx  User account management
src/types.ts                TypeScript interfaces (includes auth types)
vite.config.ts              Development proxy and build settings (includes auth proxy)
Dockerfile                  FastAPI production container
data/                       Database documentation
```
