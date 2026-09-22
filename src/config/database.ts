// Database connection pool for FlyWise
// Task 2: proper pool with TLS support, retry logic, and connection validation
import mysql from 'mysql2/promise';
import { getEnv, type Env } from './env.js';

let pool: mysql.Pool | null = null;

/** Builds deterministic mysql2 options from already-validated environment data. */
export function buildPoolOptions(env: Env): mysql.PoolOptions {
  const config: mysql.PoolOptions = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  if (env.DB_SSL) {
    config.ssl = { rejectUnauthorized: true };
  }

  return config;
}

/** Returns safe connection metadata; credentials are intentionally omitted. */
export function redactConnectionInfo(env: Env) {
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    ssl: env.DB_SSL,
  };
}

/**
 * Creates and returns a connection pool with retry logic.
 * TLS is enabled only when DB_SSL=true (required for RDS, not needed locally).
 * Certificate validation is enabled for TLS connections.
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(buildPoolOptions(getEnv()));
  }

  return pool;
}

/**
 * Tests database connectivity with exponential backoff retry.
 * Used by /api/health/db and startup validation.
 */
export async function testConnection(maxRetries = 3, initialDelay = 1000): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await getPool().getConnection();
      await connection.ping();
      connection.release();
      return; // Success
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Database connection failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Returns redacted connection info for health checks.
 * Password is never included in output.
 */
export function getConnectionInfo() {
  return redactConnectionInfo(getEnv());
}

/**
 * Gracefully closes the connection pool.
 * Called on server shutdown.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
