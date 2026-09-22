-- Migration: 004_add_diverted_column
-- Author: Group 12
-- Purpose: Add diverted column to fact_flight table to support new CSV format
-- Rollback: ALTER TABLE fact_flight DROP COLUMN diverted;
--
-- The new flight_data_final.csv includes a diverted column that wasn't present
-- in the original flight_project_cleaned.csv. This column contains 0.0/1.0 values
-- indicating whether a flight was diverted.

ALTER TABLE fact_flight
ADD COLUMN diverted TINYINT NULL
COMMENT 'Boolean flag: 1 if flight was diverted (0.0/1.0 in source)'
AFTER cancelled;