-- Migration: 002_app_schema
-- Author: Group 12
-- Purpose: Application tables for auth (Task 6) and prediction logging (Task 8).
-- Rollback: DROP TABLE prediction_log, users;
--
-- NOTE ON ATOMICITY: see 001_core_schema.sql - MySQL DDL auto-commits, so
-- this file is a sequence of independently idempotent statements, not a
-- single transaction.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcryptjs hash, never plaintext',
  role ENUM('analyst', 'ops_manager') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prediction_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  -- Request inputs
  origin_code VARCHAR(8) NOT NULL,
  dest_code VARCHAR(8) NOT NULL,
  airline_code VARCHAR(8) NOT NULL,
  flight_date DATE NOT NULL,
  dep_hour_window VARCHAR(16) NOT NULL COMMENT 'All Day / Morning / Afternoon / Evening',

  -- Prediction outputs
  risk_probability DECIMAL(6,5) NOT NULL COMMENT 'Sigmoid output, 0-1',
  risk_band VARCHAR(16) NOT NULL COMMENT 'low / medium / high',
  model_version VARCHAR(64) NOT NULL COMMENT 'Matches version field in analytics/model.json',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_prediction_log_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_prediction_log_user (user_id),
  INDEX idx_prediction_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
