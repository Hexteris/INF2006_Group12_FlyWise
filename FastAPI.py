from fastapi import FastAPI, HTTPException
from pathlib import Path
from datetime import timedelta
import mariadb
import re


# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="Flight Analytics API",
    description="FastAPI backend for the flight analytics database",
    version="1.0.0"
)


# =========================================================
# File Paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
SQL_DIR = BASE_DIR / "SQL Queries"


# =========================================================
# Database Connection
# =========================================================

def get_connection():
    return mariadb.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="GiantTCRPro1",
        database="group_project"
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
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(query, params or ())
        
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        return [
            dict(zip(columns, row))
            for row in rows
        ]

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