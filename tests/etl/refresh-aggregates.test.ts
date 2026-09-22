// Integration test for Task 5 feature aggregates. Requires a live MySQL
// connection (the Docker Compose stack) since aggregates are computed with
// SQL GROUP BY, not in application code. Seeds a small, hand-computable
// fixture directly into fact_flight, runs the real refresh script, and
// checks the aggregate values against fixtures worked out by hand -
// plus a guard asserting no aggregate row could have drawn on a
// post-window flight.
// Loads .env, which vitest does not do on its own. Without this the suite could
// never connect and so skipped itself even when the compose stack was running.
import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env.js';
import { getPool, closePool } from '../../src/config/database.js';
import { TRAINING_WINDOW_START, TRAINING_WINDOW_END } from '../../src/etl/training-window.js';

// refresh-aggregates.ts is a CLI script (calls process.exit); import only
// the logic we need by re-declaring the same queries here would duplicate
// the leakage-relevant SQL, which is exactly what we don't want to trust
// twice. Instead we invoke the compiled behavior indirectly via a thin
// re-export - see note below.
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Runs the real refresh script in a child process, so the test exercises the
 * shipped SQL rather than a copy of it.
 *
 * Invoked as `node --import tsx <script>` rather than `npx tsx <script>`. On
 * Windows `npx` is a .cmd shim: execFile cannot spawn it without a shell, and
 * since the CVE-2024-27980 fix Node refuses to spawn .cmd files directly at all.
 * Going through process.execPath with tsx's loader avoids both the shim and the
 * shell, and behaves identically on every platform.
 */
async function runRefreshAggregates(): Promise<void> {
  const scriptPath = path.join(process.cwd(), 'src', 'etl', 'refresh-aggregates.ts');
  await execFileAsync(process.execPath, ['--import', 'tsx', scriptPath], {
    cwd: process.cwd(),
  });
}

const AIRLINE_CODE = 'T5';
const ORIGIN_CODE = 'T5A';
const DEST_CODE = 'T5B';

async function dbReachable(): Promise<boolean> {
  // Check the environment before touching getPool(): getPool calls getEnv, which
  // deliberately exits the process on invalid config. That is correct for the
  // server but would kill the test worker instead of skipping this suite.
  try {
    parseEnv(process.env);
  } catch {
    return false;
  }

  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch {
    return false;
  }
}

describe.runIf(await dbReachable())('refresh-aggregates (integration)', () => {
  let airlineId: number;
  let originId: number;
  let destId: number;

  beforeAll(async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.query('INSERT INTO dim_airline (code) VALUES (?) ON DUPLICATE KEY UPDATE code = code', [AIRLINE_CODE]);
      await connection.query('INSERT INTO dim_airport (code) VALUES (?) ON DUPLICATE KEY UPDATE code = code', [ORIGIN_CODE]);
      await connection.query('INSERT INTO dim_airport (code) VALUES (?) ON DUPLICATE KEY UPDATE code = code', [DEST_CODE]);

      const [[airlineRow]] = await connection.query('SELECT id FROM dim_airline WHERE code = ?', [AIRLINE_CODE]) as [Array<{ id: number }>, unknown];
      const [[originRow]] = await connection.query('SELECT id FROM dim_airport WHERE code = ?', [ORIGIN_CODE]) as [Array<{ id: number }>, unknown];
      const [[destRow]] = await connection.query('SELECT id FROM dim_airport WHERE code = ?', [DEST_CODE]) as [Array<{ id: number }>, unknown];
      airlineId = airlineRow.id;
      originId = originRow.id;
      destId = destRow.id;

      // Clean fixture rows from any previous run.
      await connection.query('DELETE FROM fact_flight WHERE airline_id = ? AND origin_airport_id = ?', [airlineId, originId]);

      // 3 flights inside the training window: 2 on-time, 1 delayed -> 1/3 delay rate.
      // All scheduled at crs_dep_time 480-539 (08:00-08:59) -> dep_hour bucket 8.
      const insideWindow = [
        { date: TRAINING_WINDOW_START, dep_del15: 0 },
        { date: TRAINING_WINDOW_START, dep_del15: 0 },
        { date: TRAINING_WINDOW_START, dep_del15: 1 },
      ];
      for (const row of insideWindow) {
        await connection.query(
          `INSERT INTO fact_flight
             (flight_date, airline_id, flight_number, origin_airport_id, dest_airport_id,
              crs_dep_time, crs_arr_time, dep_del15, cancellation_code)
           VALUES (?, ?, 'T5', ?, ?, 500, 600, ?, 'Not Cancelled')`,
          [row.date, airlineId, originId, destId, row.dep_del15]
        );
      }

      // 1 flight ON OR AFTER the window boundary, always delayed. If this
      // leaked into the aggregate, the delay rate would shift from 1/3 to 2/4.
      await connection.query(
        `INSERT INTO fact_flight
           (flight_date, airline_id, flight_number, origin_airport_id, dest_airport_id,
            crs_dep_time, crs_arr_time, dep_del15, cancellation_code)
         VALUES (?, ?, 'T5', ?, ?, 500, 600, 1, 'Not Cancelled')`,
        [TRAINING_WINDOW_END, airlineId, originId, destId]
      );
    } finally {
      connection.release();
    }
  });

  afterAll(async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      // Order matters: facts and aggregates reference the dimensions by foreign
      // key, so they have to go first.
      await connection.query('DELETE FROM fact_flight WHERE airline_id = ?', [airlineId]);
      await connection.query('DELETE FROM agg_route_airline_delay WHERE airline_id = ?', [airlineId]);
      await connection.query('DELETE FROM agg_origin_hourly_congestion WHERE origin_airport_id = ?', [originId]);

      // The dimension rows must be removed too. Leaving them behind leaked a
      // fake airline and two fake airports into the database on every run, which
      // inflated the airport and airline counts on the dashboard.
      await connection.query('DELETE FROM dim_airport WHERE id IN (?, ?)', [originId, destId]);
      await connection.query('DELETE FROM dim_airline WHERE id = ?', [airlineId]);
    } finally {
      connection.release();
      await closePool();
    }
  });

  it('computes the route-airline delay rate using only in-window flights', async () => {
    await runRefreshAggregates();

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT flight_count, delayed_count, delay_rate FROM agg_route_airline_delay WHERE airline_id = ? AND origin_airport_id = ? AND dest_airport_id = ?',
        [airlineId, originId, destId]
      );
      const record = (rows as Array<{ flight_count: number; delayed_count: number; delay_rate: string }>)[0];

      expect(record).toBeDefined();
      // Hand-computed: 3 flights inside the window, 1 delayed. The 4th
      // flight (on the boundary date) must NOT be counted.
      expect(record.flight_count).toBe(3);
      expect(record.delayed_count).toBe(1);
      expect(Number(record.delay_rate)).toBeCloseTo(1 / 3, 5);
    } finally {
      connection.release();
    }
  }, 30000);

  it('leakage guard: no aggregate draws on a flight dated on or after the window end', async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      // Re-derive independently: sum flight_count across all rows for this
      // fixture's airline/origin should equal exactly the in-window count (3),
      // never the full fixture count (4).
      const [rows] = await connection.query(
        'SELECT SUM(flight_count) AS total FROM agg_route_airline_delay WHERE airline_id = ?',
        [airlineId]
      );
      // SUM() comes back from mysql2 as a STRING even over an INT column, the
      // same coercion trap src/db/queries.ts handles at its boundary. Typed as
      // string and converted here, rather than asserting against '3'.
      const total = (rows as Array<{ total: string | null }>)[0].total;
      expect(Number(total)).toBe(3);
    } finally {
      connection.release();
    }
  });
});
