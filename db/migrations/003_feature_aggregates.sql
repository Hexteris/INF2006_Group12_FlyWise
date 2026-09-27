-- Migration: 003_feature_aggregates
-- Author: Group 12
-- Purpose: Historical-rate feature tables for Task 7 model training and
--          Task 8 inference. Populated by src/etl/refresh-aggregates.ts,
--          which computes these STRICTLY over rows with flight_date <
--          TRAINING_WINDOW_END (see data/DATA_DICTIONARY.md for the boundary).
--          These tables are refreshable/truncatable - they hold derived
--          data, not source-of-truth records.
-- Rollback: DROP TABLE agg_origin_hourly_congestion, agg_route_airline_delay;
--
-- NOTE ON ATOMICITY: see 001_core_schema.sql - MySQL DDL auto-commits.

CREATE TABLE IF NOT EXISTS agg_route_airline_delay (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_airport_id INT NOT NULL,
  dest_airport_id INT NOT NULL,
  airline_id INT NOT NULL,
  flight_count INT NOT NULL COMMENT 'Rows in the training window this rate was computed from',
  delayed_count INT NOT NULL COMMENT 'Of flight_count, how many had dep_del15 = 1',
  delay_rate DECIMAL(6,5) NOT NULL COMMENT 'delayed_count / flight_count, 0-1',
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_agg_route_airline_origin FOREIGN KEY (origin_airport_id) REFERENCES dim_airport(id),
  CONSTRAINT fk_agg_route_airline_dest FOREIGN KEY (dest_airport_id) REFERENCES dim_airport(id),
  CONSTRAINT fk_agg_route_airline_airline FOREIGN KEY (airline_id) REFERENCES dim_airline(id),
  UNIQUE KEY uq_route_airline (origin_airport_id, dest_airport_id, airline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agg_origin_hourly_congestion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_airport_id INT NOT NULL,
  dep_hour TINYINT NOT NULL COMMENT 'Scheduled departure hour, 0-23, derived from crs_dep_time',
  flight_count INT NOT NULL COMMENT 'Rows in the training window this rate was computed from',
  delayed_count INT NOT NULL,
  delay_rate DECIMAL(6,5) NOT NULL,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_agg_origin_hourly_airport FOREIGN KEY (origin_airport_id) REFERENCES dim_airport(id),
  UNIQUE KEY uq_origin_hour (origin_airport_id, dep_hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
