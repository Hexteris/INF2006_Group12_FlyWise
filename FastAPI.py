from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from pathlib import Path
from datetime import timedelta
from copy import deepcopy
import mariadb
import httpx
import os
import re
import time

load_dotenv() #Read environment variables from .env file

# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="Flight Analytics API",
    description="FastAPI backend for the flight analytics database",
    version="1.0.0"
)

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
# File Paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
SQL_DIR = BASE_DIR / "SQL Queries"
QUERY_CACHE_TTL_SECONDS = 60
query_cache = {}


# =========================================================
# Database Connection
# =========================================================

def get_connection():
    return mariadb.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "GiantTCRPro1"),
        database=os.getenv("DB_NAME", "group_project")
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
# Database Query Helper
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
# Basic Endpoint
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Flight Analytics API is running"
    }

# =========================================================
# Dropdown Endpoints
# =========================================================

@app.get("/legacy/airlines")
def get_airlines():

    query = get_query(
        "Dropdown.sql",
        "Airlines"
    )

    return execute_query(query)


@app.get("/legacy/airports")
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

    print("Airport Analytics placeholders:", query.count("?"))

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
# Prediction Data
# =========================================================

@app.get("/prediction-data")
def prediction_data(
    airline: str,
    origin: str,
    destination: str
):

    query = get_query(
        "Prediction Data.sql",
        "Prediction Data"
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
# React frontend API contract
# =========================================================

def api_success(data):
    return {"success": True, "data": data}


def normalize_live_flight(flight, direction):
    movement = flight.get("departure") if direction == "Departure" else flight.get("arrival")
    movement = movement or {}
    airline = flight.get("airline") or {}
    flight_number = flight.get("flight") or {}
    aircraft = flight.get("aircraft") or {}
    live = flight.get("live") or {}

    return {
        "number": flight_number.get("iata") or flight_number.get("icao"),
        "airline": airline.get("name"),
        "airlineCode": airline.get("iata") or airline.get("icao"),
        "status": flight.get("flight_status"),
        "airport": movement.get("iata") or movement.get("icao") or movement.get("airport"),
        "scheduledTime": movement.get("scheduled"),
        "revisedTime": movement.get("estimated") or movement.get("actual"),
        "terminal": movement.get("terminal"),
        "gate": movement.get("gate"),
        "aircraft": aircraft.get("registration") or aircraft.get("iata"),
        "latitude": live.get("latitude"),
        "longitude": live.get("longitude"),
        "lastUpdatedUtc": live.get("updated")
    }


class PredictionRequest(BaseModel):
    originAirportId: int
    destAirportId: int
    airlineId: int
    scheduledDepartureTime: str
    flightDate: str


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
        "flight_status": "scheduled",
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


@app.get("/summary")
def api_summary():
    query = """
        SELECT COUNT(*) AS totalFlights,
               COALESCE(SUM(departure_del15), 0) AS totalDelayed,
               COALESCE(AVG(departure_del15), 0) AS avgDelayRate,
               COUNT(DISTINCT f.route_id) AS routeCount,
               COUNT(DISTINCT r.origin_airport_id) AS airportCount,
               COUNT(DISTINCT airline_id) AS airlineCount
        FROM flights f
        JOIN routes r ON r.route_id = f.route_id
    """
    row = execute_query(query)[0]
    row["avgDelayRate"] = float(row["avgDelayRate"] or 0)
    return api_success(row)


@app.get("/airports")
def api_airports():
    query = """
        SELECT airport_id AS id, airport_code AS code, city_name AS cityName
        FROM airports ORDER BY airport_code
    """
    return api_success(execute_query(query))


@app.get("/airlines/list")
def api_airlines_list():
    query = """
        SELECT airline_id AS id, airline_code AS code
        FROM airlines ORDER BY airline_code
    """
    return api_success(execute_query(query))


@app.get("/airlines")
def api_route_performance(
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

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    query = f"""
        SELECT a.airline_code AS airlineCode,
               ao.airport_code AS originCode,
               ao.city_name AS originCity,
               ad.airport_code AS destCode,
               COUNT(*) AS flightCount,
               COALESCE(SUM(f.departure_del15), 0) AS delayedCount,
               COALESCE(AVG(f.departure_del15), 0) AS delayRate
        FROM flights f
        JOIN airlines a ON a.airline_id = f.airline_id
        JOIN routes r ON r.route_id = f.route_id
        JOIN airports ao ON ao.airport_id = r.origin_airport_id
        JOIN airports ad ON ad.airport_id = r.destination_airport_id
        {where}
        GROUP BY a.airline_code, ao.airport_code, ao.city_name, ad.airport_code
        ORDER BY flightCount DESC
        LIMIT {max(1, min(limit, 100))}
    """
    rows = execute_query(query, params)
    for row in rows:
        row["delayRate"] = float(row["delayRate"] or 0)
    return api_success(rows)


@app.get("/airports/congestion")
def api_congestion(airportId: int | None = None, limit: int = 24):
    where = "WHERE r.origin_airport_id = ?" if airportId is not None else ""
    params = (airportId,) if airportId is not None else ()
    query = f"""
        SELECT ao.airport_code AS airportCode,
               ao.city_name AS airportCity,
               HOUR(f.scheduled_departure) AS depHour,
               COUNT(*) AS flightCount,
               COALESCE(SUM(f.departure_del15), 0) AS delayedCount,
               COALESCE(AVG(f.departure_del15), 0) AS delayRate
        FROM flights f
        JOIN routes r ON r.route_id = f.route_id
        JOIN airports ao ON ao.airport_id = r.origin_airport_id
        {where}
        GROUP BY ao.airport_code, ao.city_name, HOUR(f.scheduled_departure)
        ORDER BY flightCount DESC
        LIMIT {max(1, min(limit, 100))}
    """
    rows = execute_query(query, params)
    for row in rows:
        row["delayRate"] = float(row["delayRate"] or 0)
    return api_success(rows)


@app.post("/predict")
def api_predict(request: PredictionRequest):
    try:
        hour = int(request.scheduledDepartureTime[:2])
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="scheduledDepartureTime must be HHMM")

    route_query = """
        SELECT AVG(f.departure_del15) AS delayRate
        FROM flights f JOIN routes r ON r.route_id = f.route_id
        WHERE r.origin_airport_id = ?
          AND r.destination_airport_id = ?
          AND f.airline_id = ?
    """
    hourly_query = """
        SELECT AVG(f.departure_del15) AS delayRate
        FROM flights f JOIN routes r ON r.route_id = f.route_id
        WHERE r.origin_airport_id = ?
          AND HOUR(f.scheduled_departure) = ?
    """
    route_rate = execute_query(route_query, (
        request.originAirportId,
        request.destAirportId,
        request.airlineId
    ))[0]["delayRate"]
    hourly_rate = execute_query(hourly_query, (
        request.originAirportId,
        hour
    ))[0]["delayRate"]
    historical = {
        "routeDelayRate": float(route_rate) if route_rate is not None else None,
        "hourlyDelayRate": float(hourly_rate) if hourly_rate is not None else None
    }
    rates = [rate for rate in (route_rate, hourly_rate) if rate is not None]
    score = float(sum(rates) / len(rates)) if rates else 0.0
    return api_success({
        "score": score,
        "label": "DELAYED" if score >= 0.5 else "ON_TIME",
        "modelVersion": "historical-rate-v1",
        "historical": historical
    })