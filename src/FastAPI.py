from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta, datetime, timezone
from xgboost import XGBClassifier
from dotenv import load_dotenv
from pydantic import BaseModel
from pathlib import Path
from jose import JWTError, jwt
from copy import deepcopy
import mariadb
import bcrypt
import httpx
import os
import re
import time
import pandas as pd
import joblib
import json
import math


#Read environment variables from .env file
load_dotenv(".env") 

# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="Flight Analytics API",
    description="FastAPI backend for the flight analytics database",
    version="1.0.0"
)

app.mount("/assets", StaticFiles(directory="dist/client/assets"), name="assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        *([os.environ["FRONTEND_ORIGIN"]] if "FRONTEND_ORIGIN" in os.environ else [])
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# Pydantic models
# =========================================================

class PredictionRequest(BaseModel):
    airlineCode: str
    origin: str
    destination: str
    scheduledDeparture: str
    scheduledArrival: str
    flightDate: str

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class SavedFlightRequest(BaseModel):
    flight_id: int

class UpdateEmailRequest(BaseModel):
    email: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpcomingSavedFlightRequest(BaseModel):
    flight_number: int
    airline_code: str
    origin: str
    destination: str
    flight_date: str
    scheduled_departure: str | None = None
    scheduled_arrival: str | None = None
    flight_status: str | None = None


# =========================================================
# File Paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
SQL_DIR = BASE_DIR / "SQL Queries"
QUERY_CACHE_TTL_SECONDS = 60
query_cache = {}


# =========================================================
# Airport Coordinates
# =========================================================

AIRPORTS_FILE = BASE_DIR / "data" / "airports.json"

with open(AIRPORTS_FILE, "r", encoding="utf-8") as file:
    AIRPORTS = json.load(file)

print(f"Loaded {len(AIRPORTS)} airport coordinates.")


# =========================================================
# Machine Learning Model
# =========================================================

MODEL_DIR = BASE_DIR / "ML Model"

try:
    print("Loading feature_columns.json...")
    with open(MODEL_DIR / "feature_columns.json", "r") as f:
        feature_columns = json.load(f)
    print("feature_columns.json loaded successfully.")

    print("Loading preprocessor.pkl...")
    preprocessor = joblib.load(
        MODEL_DIR / "preprocessor.pkl"
    )
    print("preprocessor.pkl loaded successfully.")

    print("Loading xgb_best_params.json...")
    with open(MODEL_DIR / "xgb_best_params.json", "r") as f:
        xgb_best_params = json.load(f)
    print("xgb_best_params.json loaded successfully.")

    print("Loading xgb_metrics.json...")
    with open(MODEL_DIR / "xgb_metrics.json", "r") as f:
        xgb_metrics = json.load(f)
    print("xgb_metrics.json loaded successfully.")

    print("Loading xgb_model.json...")
    xgb_model = XGBClassifier()
    xgb_model.load_model(
        MODEL_DIR / "xgb_model.json"
    )
    print("xgb_model.json loaded successfully.")

    print("FlyWise ML model loaded successfully.")
    print("Required features:", feature_columns)

except Exception as error:
    print("Failed to load FlyWise ML model:")
    print(type(error).__name__)
    print(error)

    xgb_model = None
    preprocessor = None
    feature_columns = None


# =========================================================
# Database Connection
# =========================================================

def get_connection():
    return mariadb.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl=True
    )


# =========================================================
# SQL Loader
# =========================================================

def load_sql_file(filename):
    file_path = SQL_DIR / filename

    if not file_path.exists():
        raise FileNotFoundError(
            f"SQL file not found: {file_path}"
        )

    return file_path.read_text(
        encoding="utf-8"
    )


def get_query(filename, query_name):
    sql = load_sql_file(filename)

    pattern = (
        rf"(?ms)^\s*--\s*{re.escape(query_name)}\s*--\s*\n"
        rf"(.*?)(?=^\s*--\s*.+?\s*--\s*$|\Z)"
    )

    match = re.search(
        pattern,
        sql,
        re.IGNORECASE
    )

    if not match:
        raise ValueError(
            f"Query '{query_name}' not found in {filename}"
        )

    return match.group(1).strip()


# =========================================================
# Database Query Helper - SELECT Queries
# =========================================================

def execute_query(query, params=None):
    cache_key = (query, tuple(params or ()))
    now = time.monotonic()
    cached = query_cache.get(cache_key)
    if cached and now - cached["created"] < QUERY_CACHE_TTL_SECONDS:
        return deepcopy(cached["rows"])

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(query, params or ())
        
        columns = [desc[0] for desc in cursor.description]
        rows = [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]
        query_cache[cache_key] = {"created": now, "rows": rows}
        return deepcopy(rows)

    finally:
        cursor.close()
        conn.close()


# =========================================================
# Database Query Helper - INSERT / UPDATE / DELETE (CRUD)
# =========================================================

def execute_write(query, params=None):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(query, params or ())
        conn.commit()
        query_cache.clear()
        return cursor.rowcount

    finally:
        cursor.close()
        conn.close()


# =========================================================
# API Response Helper
# =========================================================

def api_success(data):
    return {"success": True, "data": data}


# =========================================================
# Time Formatting
# =========================================================

def format_time(value):
    if isinstance(value, timedelta):

        total_seconds = int(
            value.total_seconds()
        )

        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    return value


def format_time_columns(result):
    for row in result:
        for key, value in row.items():

            if isinstance(value, timedelta):
                row[key] = format_time(value)

    return result


# =========================================================
# Password Hashing
# =========================================================

def hash_password(password):
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(password, password_hash):
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8")
    )


# =========================================================
# JWT Authentication
# =========================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60

security = HTTPBearer()


def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRE_MINUTES
    )

    payload = {
        "user_id": user_id,
        "exp": expire
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

        return user_id

    except JWTError:
        raise credentials_exception

# =========================================================
# Account signup
# =========================================================

@app.post("/signup")
def signup(request: SignupRequest):
    password_hash = hash_password(request.password)

    query = get_query("Users.sql", "Signup")

    execute_write(
        query,
        (request.username, request.email, password_hash)
    )

    return {"message": "User created successfully"}


# =========================================================
# Account login
# =========================================================

@app.post("/login")
def login(request: LoginRequest):
    query = get_query("Users.sql", "Login")

    rows = execute_query(
        query,
        (request.username,)
    )

    if not rows:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    user = rows[0]

    if not verify_password(
        request.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(user["user_id"])

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"]
    }


# =========================================================
# Account CRUD
# =========================================================

@app.get("/me")
def get_current_account(
    current_user: int = Depends(get_current_user)
):
    query = get_query("Users.sql", "Get current user")
    
    rows = execute_query(
        query,
        (current_user,)
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return rows[0]


@app.put("/account/email")
def update_email(
    request: UpdateEmailRequest,
    current_user: int = Depends(get_current_user)
):
    check_query = get_query("Users.sql", "Check email")

    existing_email = execute_query(
        check_query,
        (
            request.email,
            current_user
        )
    )

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email is already in use"
        )

    update_query = get_query("Users.sql", "Update email")

    execute_write(
        update_query,
        (
            request.email,
            current_user
        )
    )

    return {
        "message": "Email updated successfully",
        "email": request.email
    }


@app.put("/account/password")
def change_password(
    request: ChangePasswordRequest,
    current_user: int = Depends(get_current_user)
):
    get_hash_query = get_query(
        "Users.sql",
        "Get password hash"
    )

    rows = execute_query(
        get_hash_query,
        (current_user,)
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user = rows[0]

    if not verify_password(
        request.current_password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect"
        )

    new_password_hash = hash_password(
        request.new_password
    )

    update_query = get_query(
        "Users.sql",
        "Update password"
    )

    execute_write(
        update_query,
        (
            new_password_hash,
            current_user
        )
    )

    return {
        "message": "Password changed successfully"
    }


@app.delete("/account")
def delete_account(
    current_user: int = Depends(get_current_user)
):
    check_user_query = get_query(
        "Users.sql",
        "Check user"
    )

    rows = execute_query(
        check_user_query,
        (current_user,)
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    delete_historical_query = get_query(
        "Users.sql",
        "Delete historical saved flights when account is deleted"
    )

    execute_write(
        delete_historical_query,
        (current_user,)
    )

    delete_upcoming_query = get_query(
        "Users.sql",
        "Delete upcoming saved flights when account is deleted"
    )

    execute_write(
        delete_upcoming_query,
        (current_user,)
    )

    delete_user_query = get_query(
        "Users.sql",
        "Delete user"
    )

    execute_write(
        delete_user_query,
        (current_user,)
    )

    return {
        "message": "Account deleted successfully"
    }


# =========================================================
# Basic Endpoint
# =========================================================

@app.get("/")
def root():
    return FileResponse("dist/client/index.html")

# =========================================================
# Dropdown Endpoints
# =========================================================

@app.get("/airlines")
def get_airlines():

    query = get_query(
        "Dropdown.sql",
        "Airlines"
    )

    return execute_query(query)


@app.get("/airports")
def get_airports():

    query = get_query(
        "Dropdown.sql",
        "Airports"
    )

    return execute_query(query)


@app.get("/routes")
def get_routes(origin: str):

    query = get_query(
        "Dropdown.sql",
        "Routes"
    )

    return execute_query(
        query,
        (origin,)
    )


# =========================================================
# Flight Search
# =========================================================

@app.get("/flights")
def get_flights(
    flight_date: str,
    origin: str,
    destination: str
):

    query = get_query(
        "Flights.sql",
        "Flight Search"
    )

    result = execute_query(
        query,
        (
            flight_date,
            origin,
            destination
        )
    )

    return format_time_columns(result)


# =========================================================
# Historical Flight Details
# =========================================================

@app.get("/flights/{flight_id}")
def get_flight_details(
    flight_id: int
):

    query = get_query(
        "Flights.sql",
        "Historical flight details"
    )

    result = execute_query(
        query,
        (flight_id,)
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Flight not found"
        )

    return format_time_columns(result)


@app.get("/history")
def get_flight_history(
    airline: str | None = None,
    origin: str | None = None,
    destination: str | None = None,
    limit: int = 200
):
    if not (airline or origin or destination):
        raise HTTPException(
            status_code=422,
            detail="Provide airline, origin or destination"
        )

    filters = []
    params = []

    if airline:
        filters.append("a.airline_code = ?")
        params.append(airline)

    if origin:
        filters.append("ao.airport_code = ?")
        params.append(origin)

    if destination:
        filters.append("ad.airport_code = ?")
        params.append(destination)

    query = get_query(
        "Flights.sql",
        "Flight history"
    )

    query = query.replace(
        "{filters}",
        " AND ".join(filters)
    )

    query = query.replace(
        "{limit}",
        str(max(1, min(limit, 500)))
    )

    return format_time_columns(
        execute_query(query, params)
    )


# =========================================================
# Historical Saved Flights
# =========================================================

@app.post("/saved-flights")
def save_flight(
    request: SavedFlightRequest,
    current_user: int = Depends(get_current_user)
):
    query = get_query(
        "Historical Saved Flights.sql",
        "Save Historical Flight"
    )

    execute_write(
        query,
        (
            current_user,
            request.flight_id
        )
    )

    return {
        "message": "Flight saved successfully"
    }


@app.get("/saved-flights")
def get_saved_flights(
    current_user: int = Depends(get_current_user)
):
    query = get_query(
        "Historical Saved Flights.sql",
        "Get Historical Saved Flights"
    )

    return format_time_columns(
        execute_query(
            query,
            (current_user,)
        )
    )


@app.delete("/saved-flights/{saved_flight_id}")
def delete_saved_flight(
    saved_flight_id: int,
    current_user: int = Depends(get_current_user)
):
    check_query = get_query(
        "Historical Saved Flights.sql",
        "Check Historical Saved Flight"
    )

    rows = execute_query(
        check_query,
        (
            saved_flight_id,
            current_user
        )
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Saved flight not found"
        )

    delete_query = get_query(
        "Historical Saved Flights.sql",
        "Delete Historical Saved Flight"
    )

    execute_write(
        delete_query,
        (
            saved_flight_id,
            current_user
        )
    )

    return {
        "message": "Saved flight deleted successfully"
    }


# =========================================================
# Upcoming Saved Flights
# =========================================================

@app.post("/upcoming-saved-flights")
def save_upcoming_flight(
    request: UpcomingSavedFlightRequest,
    current_user: int = Depends(get_current_user)
):
    query = get_query(
        "Upcoming Saved Flights.sql",
        "Save Upcoming Flight"
    )

    execute_write(
        query,
        (
            current_user,
            request.flight_number,
            request.airline_code,
            request.origin,
            request.destination,
            request.flight_date,
            request.scheduled_departure,
            request.scheduled_arrival,
            request.flight_status
        )
    )

    return {
        "message": "Upcoming flight saved successfully"
    }


@app.get("/upcoming-saved-flights")
def get_upcoming_saved_flights(
    current_user: int = Depends(get_current_user)
):
    query = get_query(
        "Upcoming Saved Flights.sql",
        "Get Upcoming Saved Flights"
    )

    return format_time_columns(
        execute_query(
            query,
            (current_user,)
        )
    )


@app.delete("/upcoming-saved-flights/{upcoming_saved_flight_id}")
def delete_upcoming_saved_flight(
    upcoming_saved_flight_id: int,
    current_user: int = Depends(get_current_user)
):
    check_query = get_query(
        "Upcoming Saved Flights.sql",
        "Check Upcoming Saved Flight"
    )

    rows = execute_query(
        check_query,
        (
            upcoming_saved_flight_id,
            current_user
        )
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Upcoming saved flight not found"
        )

    delete_query = get_query(
        "Upcoming Saved Flights.sql",
        "Delete Upcoming Saved Flight"
    )

    execute_write(
        delete_query,
        (
            upcoming_saved_flight_id,
            current_user
        )
    )

    return {
        "message": "Upcoming flight deleted successfully"
    }


# =========================================================
# Airline Dashboard
# =========================================================

@app.get("/analytics/airline")
def airline_analytics(
    airline: str
):

    query = get_query(
        "Data Analytics.sql",
        "Airline Dashboard"
    )

    return execute_query(
        query,
        (airline,)
    )


# =========================================================
# Flight Route Reliability
# =========================================================

@app.get("/analytics/route")
def route_analytics(
    origin: str,
    destination: str
):

    query = get_query(
        "Data Analytics.sql",
        "Flight route reliability"
    )

    return execute_query(
        query,
        (
            origin,
            destination
        )
    )


# =========================================================
# Airport Analytics
# =========================================================

@app.get("/analytics/airport")
def airport_analytics(
    airport: str
):

    query = get_query(
        "Data Analytics.sql",
        "Airport Analytics"
    )

    return execute_query(
        query,
        (
            airport,
            airport,
            airport,
            airport,
            airport
        )
    )


# =========================================================
# Monthly Delay Trends
# =========================================================

@app.get("/analytics/delay-trends/monthly")
def monthly_delay_trends():

    query = get_query(
        "Data Analytics.sql",
        "Delay trend by month"
    )

    return execute_query(query)


# =========================================================
# Hourly Delay Trends
# =========================================================

@app.get("/analytics/delay-trends/hourly")
def hourly_delay_trends():

    query = get_query(
        "Data Analytics.sql",
        "Delay trend by hour"
    )

    return execute_query(query)


# =========================================================
# Delay Causes
# =========================================================

@app.get("/analytics/delay-causes")
def delay_causes():

    query = get_query(
        "Data Analytics.sql",
        "Delay cause analytics"
    )

    result = execute_query(query)

    for rank, row in enumerate(
        result,
        start=1
    ):
        row["rank"] = rank

    return result


# =========================================================
# Airline + Route Analytics
# =========================================================

@app.get("/analytics/airline-route")
def airline_route_analytics(
    airline: str,
    origin: str,
    destination: str
):

    query = get_query(
        "Data Analytics.sql",
        "Airline + Route analytics"
    )

    return execute_query(
        query,
        (
            airline,
            origin,
            destination
        )
    )


# =========================================================
# Aviationstack API Helpers
# =========================================================

def normalize_live_flight(flight, direction):
    departure = flight.get("departure") or {}
    arrival = flight.get("arrival") or {}

    movement = departure if direction == "Departure" else arrival

    airline = flight.get("airline") or {}
    flight_number = flight.get("flight") or {}
    aircraft = flight.get("aircraft") or {}
    live = flight.get("live") or {}

    return {
        "number": flight_number.get("iata") or flight_number.get("icao"),
        "airline": airline.get("name"),
        "airlineCode": airline.get("iata") or airline.get("icao"),
        "status": flight.get("flight_status"),

        # Full route
        "origin": departure.get("iata") or departure.get("icao"),
        "destination": arrival.get("iata") or arrival.get("icao"),

        # Airport being searched
        "airport": (
            movement.get("iata")
            or movement.get("icao")
            or movement.get("airport")
        ),

        # Departure information
        "scheduledDeparture": departure.get("scheduled"),
        "revisedDeparture": (
            departure.get("estimated")
            or departure.get("actual")
        ),

        # Arrival information
        "scheduledArrival": arrival.get("scheduled"),
        "revisedArrival": (
            arrival.get("estimated")
            or arrival.get("actual")
        ),

        # Keep these for compatibility with existing frontend code
        "scheduledTime": movement.get("scheduled"),
        "revisedTime": (
            movement.get("estimated")
            or movement.get("actual")
        ),

        "terminal": movement.get("terminal"),
        "gate": movement.get("gate"),

        "aircraft": (
            aircraft.get("registration")
            or aircraft.get("iata")
        ),

        "latitude": live.get("latitude"),
        "longitude": live.get("longitude"),
        "lastUpdatedUtc": live.get("updated"),

        # Delay
        "delay": (
            departure.get("delay")
            if direction == "Departure"
            else arrival.get("delay")
        ),
    }


@app.get("/live-flights")
async def live_flights(
    airport: str = Query(min_length=3, max_length=4),
    direction: str = Query(default="Departure", pattern="^(Departure|Arrival)$")
):
    api_key = os.getenv("AVIATIONSTACK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AVIATIONSTACK_API_KEY is not configured")

    base_url = os.getenv("AVIATIONSTACK_BASE_URL", "http://api.aviationstack.com/v1").rstrip("/")
    params = {
        "access_key": api_key,
        "limit": 100,
        "offset": 0,
        ("dep_iata" if direction == "Departure" else "arr_iata"): airport.upper()
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{base_url}/flights",
                params=params,
                headers={"Accept": "application/json"}
            )
    except httpx.RequestError as error:
        raise HTTPException(status_code=502, detail=f"Aviationstack request failed: {error}")

    if response.status_code == 204:
        return api_success([])
    if not response.is_success:
        raise HTTPException(status_code=502, detail=f"Aviationstack returned HTTP {response.status_code}")

    payload = response.json()
    if payload.get("error"):
        message = payload["error"].get("message", "Aviationstack request failed")
        raise HTTPException(status_code=502, detail=message)
    return api_success([normalize_live_flight(flight, direction) for flight in payload.get("data", [])])


@app.get("/health")
def api_health():
    return api_success({"status": "ok"})


# =========================================================
# Dashboard Statistics
# =========================================================

@app.get("/summary")
def api_summary():
    query = get_query(
        "Dashboard.sql",
        "Summary"
    )

    row = execute_query(query)[0]

    row["avgDelayRate"] = float(
        row["avgDelayRate"] or 0
    )

    return api_success(row)


@app.get("/airlines/performance")
def api_airline_performance(
    airlineId: int | None = None,
    originId: int | None = None,
    limit: int = 10
):
    filters = []
    params = []

    if airlineId is not None:
        filters.append("f.airline_id = ?")
        params.append(airlineId)

    if originId is not None:
        filters.append("r.origin_airport_id = ?")
        params.append(originId)

    where = (
        f"WHERE {' AND '.join(filters)}"
        if filters
        else ""
    )

    query = get_query(
        "Dashboard.sql",
        "Airline Performance"
    )

    query = query.replace(
        "{filters}",
        where
    )

    query = query.replace(
        "{limit}",
        str(max(1, min(limit, 100)))
    )

    rows = execute_query(query, params)

    for row in rows:
        row["delayRate"] = float(
            row["delayRate"] or 0
        )

    return api_success(rows)


@app.get("/airports/congestion")
def api_congestion(
    airportId: int | None = None,
    limit: int = 24
):
    filters = []
    params = []

    if airportId is not None:
        filters.append(
            "r.origin_airport_id = ?"
        )
        params.append(airportId)

    where = (
        f"WHERE {' AND '.join(filters)}"
        if filters
        else ""
    )

    query = get_query(
        "Dashboard.sql",
        "Airport Congestion"
    )

    query = query.replace(
        "{filters}",
        where
    )

    query = query.replace(
        "{limit}",
        str(max(1, min(limit, 100)))
    )

    rows = execute_query(query, params)

    for row in rows:
        row["delayRate"] = float(
            row["delayRate"] or 0
        )

    return api_success(rows)


# =========================================================
# Prediction Data
# =========================================================

def calculate_distance_km(
    origin_code: str,
    destination_code: str
) -> float:

    origin_code = origin_code.upper()
    destination_code = destination_code.upper()

    if origin_code not in AIRPORTS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Airport {origin_code} does not have "
                "coordinates available."
            )
        )

    if destination_code not in AIRPORTS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Airport {destination_code} does not have "
                "coordinates available."
            )
        )

    # airports.json stores [longitude, latitude]
    origin_lon, origin_lat = AIRPORTS[origin_code]
    destination_lon, destination_lat = AIRPORTS[destination_code]

    earth_radius_km = 6371.0

    lat1 = math.radians(origin_lat)
    lat2 = math.radians(destination_lat)

    dlat = math.radians(
        destination_lat - origin_lat
    )

    dlon = math.radians(
        destination_lon - origin_lon
    )

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius_km * c

# =========================================================
# Prediction
# =========================================================

@app.post("/predict")
async def api_predict(request: PredictionRequest):

    # =====================================================
    # 1. Check ML model
    # =====================================================

    if (
        xgb_model is None
        or preprocessor is None
        or feature_columns is None
    ):
        raise HTTPException(
            status_code=503,
            detail="FlyWise ML model is not available"
        )

    # =====================================================
    # 2. Validate request
    # =====================================================

    airline_code = request.airlineCode.strip().upper()
    origin_code = request.origin.strip().upper()
    destination_code = request.destination.strip().upper()

    if not airline_code:
        raise HTTPException(
            status_code=422,
            detail="Airline code is required"
        )

    if not origin_code:
        raise HTTPException(
            status_code=422,
            detail="Origin airport is required"
        )

    if not destination_code:
        raise HTTPException(
            status_code=422,
            detail="Destination airport is required"
        )

    try:

        flight_date = datetime.strptime(
            request.flightDate,
            "%Y-%m-%d"
        )

        scheduled_departure = datetime.fromisoformat(
            request.scheduledDeparture.replace(
                "Z",
                "+00:00"
            )
        )

        scheduled_arrival = datetime.fromisoformat(
            request.scheduledArrival.replace(
                "Z",
                "+00:00"
            )
        )

    except (ValueError, TypeError):

        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid flight date or schedule. "
                "Expected YYYY-MM-DD and ISO datetime values."
            )
        )

    # =====================================================
    # 3. Calculate scheduled flight duration
    # =====================================================

    elapsed_seconds = (
        scheduled_arrival - scheduled_departure
    ).total_seconds()

    crs_elapsed_time = elapsed_seconds / 60

    if crs_elapsed_time <= 0:
        raise HTTPException(
            status_code=422,
            detail=(
                "Scheduled arrival must be after "
                "scheduled departure."
            )
        )
    

    # =====================================================
    # 4. Calculate route distance
    # =====================================================

    distance_km = calculate_distance_km(
        origin_code,
        destination_code
    )

    # BTS distance is in miles.
    # Convert km → miles because the ML model
    # was trained using the BTS distance feature.

    distance = distance_km * 0.621371

    # =====================================================
    # 6. Construct ML features
    # =====================================================

    ml_input = {

        "reporting_airline":
            airline_code,

        "origin":
            origin_code,

        "dest":
            destination_code,

        "crs_elapsed_time":
            float(crs_elapsed_time),

        "distance":
            float(distance),

        "month":
            flight_date.month,

        "day_of_week":
            flight_date.weekday(),

        "dep_hour":
            scheduled_departure.hour,

        "dep_minute":
            scheduled_departure.minute,

        "arr_hour":
            scheduled_arrival.hour,

        "arr_minute":
            scheduled_arrival.minute
    }

    # =====================================================
    # 7. Convert to DataFrame
    # =====================================================

    input_df = pd.DataFrame(
        [ml_input]
    )

    try:

        input_df = input_df[
            feature_columns
        ]

    except KeyError as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "ML feature mismatch: "
                f"{str(error)}"
            )
        )

    # =====================================================
    # 8. Apply training preprocessing
    # =====================================================

    try:

        processed_input = (
            preprocessor.transform(
                input_df
            )
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "ML preprocessing failed: "
                f"{str(error)}"
            )
        )

    # =====================================================
    # 9. XGBoost prediction
    # =====================================================

    try:

        delay_probability = float(
            xgb_model.predict_proba(
                processed_input
            )[0, 1]
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "ML prediction failed: "
                f"{str(error)}"
            )
        )


    # =====================================================
    # 10. Get historical delay rates
    # =====================================================

    # Get airline ID
    airlines_query = get_query(
        "Dropdown.sql",
        "Airlines"
    )

    airlines = execute_query(
        airlines_query
    )

    airline_row = next(
        (
            row for row in airlines
            if row["airline_code"] == airline_code
        ),
        None
    )

    if not airline_row:
        raise HTTPException(
            status_code=404,
            detail=f"Airline {airline_code} not found"
        )

    airline_id = airline_row["airline_id"]


    # Get airport IDs
    airports_query = get_query(
        "Dropdown.sql",
        "Airports"
    )

    airports = execute_query(
        airports_query
    )

    origin_row = next(
        (
            row for row in airports
            if row["airport_code"] == origin_code
        ),
        None
    )

    destination_row = next(
        (
            row for row in airports
            if row["airport_code"] == destination_code
        ),
        None
    )

    if not origin_row:
        raise HTTPException(
            status_code=404,
            detail=f"Airport {origin_code} not found"
        )

    if not destination_row:
        raise HTTPException(
            status_code=404,
            detail=f"Airport {destination_code} not found"
        )

    origin_id = origin_row["airport_id"]
    destination_id = destination_row["airport_id"]


    # Route + airline historical delay rate
    route_query = get_query(
        "Prediction Data.sql",
        "Route delay rate"
    )

    route_result = execute_query(
        route_query,
        (
            origin_id,
            destination_id,
            airline_id
        )
    )

    route_delay_rate = (
        float(route_result[0]["delayRate"])
        if route_result
        and route_result[0]["delayRate"] is not None
        else None
    )


    # Departure-hour historical delay rate
    hourly_query = get_query(
        "Prediction Data.sql",
        "Hourly delay rate"
    )

    hourly_result = execute_query(
        hourly_query,
        (
            origin_id,
            scheduled_departure.hour
        )
    )

    hourly_delay_rate = (
        float(hourly_result[0]["delayRate"])
        if hourly_result
        and hourly_result[0]["delayRate"] is not None
        else None
    )

    # =====================================================
    # 10. Return result
    # =====================================================

    return api_success({

        "score":
            delay_probability,

        "label":
            (
                "DELAYED"
                if delay_probability >= 0.5
                else "ON_TIME"
            ),

        "modelVersion":
            "xgboost-v1",

        # Kept for compatibility with the existing
        # React PredictionResult interface.
        "historical": {
            "routeDelayRate": route_delay_rate,
            "hourlyDelayRate": hourly_delay_rate,
        }
    })

# @app.get("/prediction-data")
# def prediction_data(
#     airline: str,
#     origin: str,
#     destination: str
# ):

#     query = get_query(
#         "Prediction Data.sql",
#         "Prediction Data"
#     )

#     return execute_query(
#         query,
#         (
#             airline,
#             origin,
#             destination
#         )
#     )


# @app.post("/predict")
# def api_predict(request: PredictionRequest):
#     try:
#         hour = int(request.scheduledDepartureTime[:2])
#     except (TypeError, ValueError):
#         raise HTTPException(
#             status_code=422,
#             detail="scheduledDepartureTime must be HHMM"
#         )

#     # Route delay rate
#     route_query = get_query(
#         "Prediction Data.sql",
#         "Route delay rate"
#     )

#     route_result = execute_query(
#         route_query,
#         (
#             request.originAirportId,
#             request.destAirportId,
#             request.airlineId
#         )
#     )

#     route_rate = (
#         route_result[0]["delayRate"]
#         if route_result
#         else None
#     )

#     # Hourly delay rate
#     hourly_query = get_query(
#         "Prediction Data.sql",
#         "Hourly delay rate"
#     )

#     hourly_result = execute_query(
#         hourly_query,
#         (
#             request.originAirportId,
#             hour
#         )
#     )

#     hourly_rate = (
#         hourly_result[0]["delayRate"]
#         if hourly_result
#         else None
#     )

#     # Detailed prediction data
#     prediction_query = get_query(
#         "Prediction Data.sql",
#         "Prediction Data"
#     )

#     prediction_result = execute_query(
#         prediction_query,
#         (
#             request.airlineId,
#             request.originAirportId,
#             request.destAirportId
#         )
#     )

#     detailed_data = (
#         prediction_result[0]
#         if prediction_result
#         else None
#     )

#     # Calculate prediction score
#     rates = [
#         rate for rate in (
#             route_rate,
#             hourly_rate
#         )
#         if rate is not None
#     ]

#     score = (
#         float(sum(rates) / len(rates))
#         if rates
#         else 0.0
#     )

#     historical = {
#         "routeDelayRate": (
#             float(route_rate)
#             if route_rate is not None
#             else None
#         ),
#         "hourlyDelayRate": (
#             float(hourly_rate)
#             if hourly_rate is not None
#             else None
#         ),
#         "predictionData": detailed_data
#     }

#     return api_success({
#         "score": score,
#         "label": (
#             "DELAYED"
#             if score >= 0.5
#             else "ON_TIME"
#         ),
#         "modelVersion": "historical-rate-v1",
#         "historical": historical
#     })