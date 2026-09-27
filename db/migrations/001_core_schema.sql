-- Migration: 001_core_schema
-- Author: Group 12
-- Purpose: Core flight data warehouse tables (dimensions + fact) for the
--          BTS on-time performance CSV. Populated by the Task 4 ETL loader.
-- Rollback: DROP TABLE fact_flight, dim_airport, dim_airline;
--
-- NOTE ON ATOMICITY: MySQL 8 issues an implicit COMMIT before every DDL
-- statement (CREATE TABLE, CREATE INDEX, etc). This migration is therefore
-- NOT atomic as a whole - if it fails partway through, already-created
-- tables in this file remain. It is written so each CREATE TABLE is
-- independently idempotent (IF NOT EXISTS) and ordered so later statements
-- depend only on earlier ones in the same file, making a partial re-run safe.

CREATE TABLE IF NOT EXISTS dim_airline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(8) NOT NULL COMMENT 'Reporting_Airline, e.g. AA, DL, UA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_airline_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dim_airport (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(8) NOT NULL COMMENT 'IATA code, e.g. JFK, LAX',
  city_name VARCHAR(128) NULL COMMENT 'e.g. "New York, NY" - quoted in source CSV',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_airport_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fact_flight (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  flight_date DATE NOT NULL,
  airline_id INT NOT NULL,
  flight_number VARCHAR(16) NOT NULL,
  origin_airport_id INT NOT NULL,
  dest_airport_id INT NOT NULL,

  -- Pre-pushback / scheduled fields - safe as model features (no leakage)
  crs_dep_time SMALLINT NOT NULL COMMENT 'Scheduled dep, HHMM parsed to minutes-since-midnight (0-1439)',
  crs_arr_time SMALLINT NOT NULL COMMENT 'Scheduled arr, HHMM parsed to minutes-since-midnight (0-1439)',
  crs_elapsed_time SMALLINT NULL COMMENT 'Scheduled elapsed time in minutes',
  distance SMALLINT NULL COMMENT 'Route distance in miles',

  -- Target and post-flight outcome fields - NEVER used as model features.
  -- Retained here for training-label purposes and historical aggregates only.
  dep_time SMALLINT NULL,
  dep_delay SMALLINT NULL,
  dep_del15 TINYINT NULL COMMENT 'Target variable: 1 if departure delayed 15+ minutes',
  arr_time SMALLINT NULL,
  arr_delay SMALLINT NULL,
  arr_del15 TINYINT NULL,
  actual_elapsed_time SMALLINT NULL,
  air_time SMALLINT NULL,
  cancelled TINYINT NOT NULL DEFAULT 0,
  cancellation_code VARCHAR(32) NULL COMMENT 'Free text in source, e.g. "Not Cancelled"',
  carrier_delay SMALLINT NULL,
  weather_delay SMALLINT NULL,
  nas_delay SMALLINT NULL,
  security_delay SMALLINT NULL,
  late_aircraft_delay SMALLINT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_fact_flight_airline FOREIGN KEY (airline_id) REFERENCES dim_airline(id),
  CONSTRAINT fk_fact_flight_origin FOREIGN KEY (origin_airport_id) REFERENCES dim_airport(id),
  CONSTRAINT fk_fact_flight_dest FOREIGN KEY (dest_airport_id) REFERENCES dim_airport(id),

  INDEX idx_flight_date (flight_date),
  INDEX idx_route_airline (origin_airport_id, dest_airport_id, airline_id),
  INDEX idx_origin_hour (origin_airport_id, crs_dep_time),
  INDEX idx_airline_date (airline_id, flight_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
