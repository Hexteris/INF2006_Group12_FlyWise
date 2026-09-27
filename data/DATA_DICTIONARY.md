# FlyWise Data Dictionary

This document describes the real MySQL/MariaDB schema used by `FastAPI.py`.
The database is maintained in MySQL Workbench and is not created by the React
frontend or by the application container.

## Database

```text
Database: group_project
Source: US flight-delay data loaded into MySQL/MariaDB Workbench
Backend connection: FastAPI.py -> MariaDB Connector/Python
```

The application currently reports 14 airlines, 352 airports, 6,938 routes, and
7,001,619 flights for the connected dataset. Counts depend on the data loaded in
the Workbench database.

## Tables

### `airlines`

One row per reporting airline.

| Column | Type | Description |
|---|---|---|
| `airline_id` | `INT`, auto-increment, primary key | Internal airline identifier |
| `airline_code` | `VARCHAR(5)`, unique, not null | Airline code, for example `AA` |

### `airports`

One row per airport appearing as an origin or destination.

| Column | Type | Description |
|---|---|---|
| `airport_id` | `INT`, auto-increment, primary key | Internal airport identifier |
| `airport_code` | `VARCHAR(5)`, unique, not null | IATA airport code, for example `JFK` |
| `city_name` | `VARCHAR(100)` | City name |
| `state` | `VARCHAR(50)` | State or region |

### `routes`

One row per unique origin-destination pair.

| Column | Type | Description |
|---|---|---|
| `route_id` | `INT`, auto-increment, primary key | Route identifier |
| `origin_airport_id` | `INT`, foreign key | References `airports.airport_id` |
| `destination_airport_id` | `INT`, foreign key | References `airports.airport_id` |

There is a unique constraint on `(origin_airport_id, destination_airport_id)`.

### `flights`

One row per historical flight.

| Column | Type | Description |
|---|---|---|
| `flight_id` | `BIGINT`, auto-increment, primary key | Flight identifier |
| `flight_date` | `DATE`, not null | Local operating date |
| `airline_id` | `INT`, foreign key | References `airlines.airline_id` |
| `flight_number` | `INT` | Flight number |
| `route_id` | `INT`, foreign key | References `routes.route_id` |
| `scheduled_departure` | `TIME` | Scheduled departure time |
| `actual_departure` | `TIME` | Actual departure time |
| `departure_delay` | `INT` | Departure delay in minutes |
| `departure_del15` | `BOOLEAN` | 1 when departure delay is at least 15 minutes |
| `scheduled_arrival` | `TIME` | Scheduled arrival time |
| `actual_arrival` | `TIME` | Actual arrival time |
| `arrival_delay` | `INT` | Arrival delay in minutes |
| `arrival_del15` | `BOOLEAN` | 1 when arrival delay is at least 15 minutes |
| `cancelled` | `BOOLEAN` | Whether the flight was cancelled |
| `diverted` | `BOOLEAN` | Whether the flight was diverted |
| `cancellation_code` | `VARCHAR(3)` | Cancellation code |
| `scheduled_elapsed_time` | `INT` | Scheduled duration in minutes |
| `actual_elapsed_time` | `INT` | Actual duration in minutes |
| `air_time` | `INT` | Air time in minutes |
| `distance` | `INT` | Distance in miles |
| `carrier_delay` | `INT` | Carrier-caused delay in minutes |
| `weather_delay` | `INT` | Weather-caused delay in minutes |
| `nas_delay` | `INT` | National Airspace System delay in minutes |
| `security_delay` | `INT` | Security delay in minutes |
| `late_aircraft_delay` | `INT` | Late-aircraft delay in minutes |

## Derived table

### `route_statistics`

Precomputed route-level statistics populated by the Workbench data-population
script. It is useful for faster route reporting, although some current FastAPI
endpoints still calculate results directly from `flights`.

| Column | Description |
|---|---|
| `route_id` | Route identifier and primary key |
| `total_flights` | All flights on the route |
| `operated_flights` | Non-cancelled, non-diverted flights |
| `cancelled_flights` | Cancelled flights |
| `diverted_flights` | Diverted flights |
| `delayed_flights` | Operated flights with arrival delay over 15 minutes |
| `severe_delay_flights` | Operated flights with arrival delay over 60 minutes |
| `delay_rate` | Route delay percentage |
| `severe_delay_rate` | Severe-delay percentage |
| `average_departure_delay` | Average departure delay in minutes |
| `average_arrival_delay` | Average arrival delay in minutes |
| `max_arrival_delay` | Maximum arrival delay in minutes |

## Data rules

- Historical pages and prediction evidence use the Workbench database.
- Live and upcoming airport movements come from Aviationstack through FastAPI;
  they are not stored in the historical tables.
- `departure_del15` is the main departure-delay target used by the dashboard.
- `departure_delay`, `arrival_delay`, cancellation, diversion, and cause-delay
  fields describe outcomes and must not be treated as pre-departure prediction
  inputs.
- `route_id` appears in both `flights` and `routes`; SQL must qualify it as
  `f.route_id` or `r.route_id` when both tables are joined.

## Related files

- `Raw SQL & Cleaning/Data Population.sql` - schema and population SQL
- `SQL Queries/` - queries loaded by FastAPI
- `FastAPI.py` - database connection and API endpoints
