# FlyWise Data Dictionary

Tracks every table, its origin migration, and column meaning. Updated in the
same commit as any migration that changes the schema.

## Source data

`flight_project_cleaned.csv` — BTS 2025 on-time performance, one row per
flight. Loaded by the Task 4 streaming ETL.

Quirks the loader must handle:
- City names are quoted and contain commas: `"New York, NY"`
- `CRSDepTime` / `CRSArrTime` are HHMM integers: `659` means 06:59
- Times and delays are float-formatted: `656.0`, `-3.0`
- `CancellationCode` holds free text (`Not Cancelled`), not a single code letter

## Leakage rule

Target: `DepDel15`. The following source columns are **outcomes** and must
never be used as model features (Task 7): `DepTime`, `DepDelay`, `ArrTime`,
`ArrDelay`, `ArrDel15`, `ActualElapsedTime`, `AirTime`, `CarrierDelay`,
`WeatherDelay`, `NASDelay`, `SecurityDelay`, `LateAircraftDelay`, `Cancelled`,
`CancellationCode`. They are stored in `fact_flight` (for labels and
historical-rate aggregates) but excluded from the feature vector.

## Migration 001 — `001_core_schema.sql`

### `dim_airline`

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| code | VARCHAR(8) UNIQUE | `Reporting_Airline`, e.g. `AA` |
| created_at | TIMESTAMP | |

### `dim_airport`

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| code | VARCHAR(8) UNIQUE | IATA code, e.g. `JFK` |
| city_name | VARCHAR(128) NULL | e.g. `New York, NY` (comma preserved, quoting stripped by loader) |
| created_at | TIMESTAMP | |

### `fact_flight`

One row per flight. Split into pre-pushback fields (safe as model features)
and post-flight outcome fields (label + historical aggregates only, never
features — see leakage rule above).

| Column | Type | Category | Notes |
|---|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | | |
| flight_date | DATE | pre-pushback | |
| airline_id | INT FK → dim_airline | pre-pushback | |
| flight_number | VARCHAR(16) | pre-pushback | |
| origin_airport_id | INT FK → dim_airport | pre-pushback | |
| dest_airport_id | INT FK → dim_airport | pre-pushback | |
| crs_dep_time | SMALLINT | pre-pushback | scheduled dep, minutes since midnight (0-1439), parsed from HHMM |
| crs_arr_time | SMALLINT | pre-pushback | scheduled arr, minutes since midnight |
| crs_elapsed_time | SMALLINT NULL | pre-pushback | scheduled elapsed minutes |
| distance | SMALLINT NULL | pre-pushback | miles |
| dep_time | SMALLINT NULL | outcome | actual dep, minutes since midnight |
| dep_delay | SMALLINT NULL | outcome | minutes |
| dep_del15 | TINYINT NULL | **target label** | 1 if departure delayed 15+ min |
| arr_time | SMALLINT NULL | outcome | |
| arr_delay | SMALLINT NULL | outcome | |
| arr_del15 | TINYINT NULL | outcome | |
| actual_elapsed_time | SMALLINT NULL | outcome | |
| air_time | SMALLINT NULL | outcome | |
| cancelled | TINYINT NOT NULL DEFAULT 0 | outcome | |
| cancellation_code | VARCHAR(32) NULL | outcome | free text, e.g. `Not Cancelled` |
| carrier_delay | SMALLINT NULL | outcome | |
| weather_delay | SMALLINT NULL | outcome | |
| nas_delay | SMALLINT NULL | outcome | |
| security_delay | SMALLINT NULL | outcome | |
| late_aircraft_delay | SMALLINT NULL | outcome | |
| created_at | TIMESTAMP | | |

Indexes: `idx_flight_date`, `idx_route_airline (origin, dest, airline)`,
`idx_origin_hour (origin, crs_dep_time)` for Task 5's congestion aggregate,
`idx_airline_date (airline, flight_date)` for the temporal split in Task 7.

## Migration 002 — `002_app_schema.sql`

### `users`

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcryptjs hash, never plaintext |
| role | ENUM('analyst', 'ops_manager') | |
| created_at | TIMESTAMP | |

### `prediction_log`

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| user_id | INT FK → users | |
| origin_code | VARCHAR(8) | request input |
| dest_code | VARCHAR(8) | request input |
| airline_code | VARCHAR(8) | request input |
| flight_date | DATE | request input |
| dep_hour_window | VARCHAR(16) | All Day / Morning / Afternoon / Evening |
| risk_probability | DECIMAL(6,5) | sigmoid output, 0-1 |
| risk_band | VARCHAR(16) | low / medium / high |
| model_version | VARCHAR(64) | matches `version` in `analytics/model.json` |
| created_at | TIMESTAMP | |

## Migration runner notes

- Checksums are SHA-256 over the raw file content, recorded in
  `schema_migrations` at apply time.
- **Atomicity limitation**: MySQL 8 auto-commits before every DDL statement
  (`CREATE TABLE`, `CREATE INDEX`, etc). A migration file containing DDL is
  therefore not rollback-able as a unit — if statement 3 of 5 fails,
  statements 1-2 are already committed. The runner reports the exact
  statement index on failure so this is visible, not silent. Pure-DML
  migrations (future seed/data files) run inside a real transaction and do
  roll back on failure.
- Applied migrations are immutable. `migrate` compares on-disk checksums
  against recorded ones for every already-applied file before applying
  anything new, and aborts if any differ. Corrections go in a new numbered
  file, never an edit to an applied one.

## Discovery results (Task 4, run against the full file)

| Metric | Value |
|---|---|
| Total data rows | 5,557,470 |
| Date range | 2025-01-01 to 2025-10-31 |
| Distinct airlines | 14 |
| Distinct airports | 349 |

## Migration 003 — `003_feature_aggregates.sql`

Historical-rate features computed **strictly over the training window**
(see boundary below), never the full dataset. Refreshable/truncatable derived
data, not source-of-truth records — recomputed in full by
`npm run etl:aggregates` (`src/etl/refresh-aggregates.ts`).

### `agg_route_airline_delay`

Delay rate for a given origin→dest→airline combination.

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| origin_airport_id | INT FK → dim_airport | |
| dest_airport_id | INT FK → dim_airport | |
| airline_id | INT FK → dim_airline | |
| flight_count | INT | rows in the training window this rate was computed from |
| delayed_count | INT | of flight_count, how many had `dep_del15 = 1` |
| delay_rate | DECIMAL(6,5) | `delayed_count / flight_count` |
| computed_at | TIMESTAMP | |

Unique on `(origin_airport_id, dest_airport_id, airline_id)`.

### `agg_origin_hourly_congestion`

Delay rate for a given origin airport and scheduled departure hour.

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| origin_airport_id | INT FK → dim_airport | |
| dep_hour | TINYINT | scheduled departure hour, 0-23, `FLOOR(crs_dep_time / 60)` |
| flight_count | INT | |
| delayed_count | INT | |
| delay_rate | DECIMAL(6,5) | |
| computed_at | TIMESTAMP | |

Unique on `(origin_airport_id, dep_hour)`.

## Training window boundary (fixed, shared by Task 5 and Task 7)

Defined once in `src/etl/training-window.ts`, imported by both the aggregate
refresh script and (in Task 7) the Python training script's SQL export, so
the two can never disagree on where the window ends.

| | |
|---|---|
| Full dataset range (Task 4 discovery) | 2025-01-01 to 2025-10-31 |
| Training window | 2025-01-01 to 2025-08-31 (8 months) |
| Held-out test period | 2025-09-01 to 2025-10-31 (2 months) |

The split is **temporal, not random** — a random shuffle would let aggregate
features and the model see the future. `refresh-aggregates.ts` runs an
explicit leakage guard query after every refresh that re-derives the maximum
`flight_date` actually used and throws if it is not before the window end,
so a future accidental change to the query's WHERE clause fails loudly.
