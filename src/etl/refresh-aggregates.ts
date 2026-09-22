// Refreshes the Task 5 feature aggregate tables from fact_flight, strictly
// within the training window defined in training-window.ts.
//
// Usage: tsx src/etl/refresh-aggregates.ts
import 'dotenv/config';
import { getPool } from '../config/database.js';
import { TRAINING_WINDOW_START, TRAINING_WINDOW_END } from './training-window.js';

/**
 * Recomputes agg_route_airline_delay from scratch. TRUNCATE + INSERT rather
 * than incremental update: aggregate tables are derived data, and a full
 * recompute is simple to reason about and cheap at this data volume.
 *
 * The WHERE clause is the leakage guard: dep_del15 is an outcome column and
 * is read here ONLY to compute a historical rate over the training window,
 * never exposed as a per-flight feature (see DATA_DICTIONARY.md).
 */
async function refreshRouteAirlineDelay(): Promise<number> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.query('TRUNCATE TABLE agg_route_airline_delay');

    const [result] = await connection.query(
      `INSERT INTO agg_route_airline_delay
         (origin_airport_id, dest_airport_id, airline_id, flight_count, delayed_count, delay_rate)
       SELECT
         origin_airport_id,
         dest_airport_id,
         airline_id,
         COUNT(*) AS flight_count,
         SUM(CASE WHEN dep_del15 = 1 THEN 1 ELSE 0 END) AS delayed_count,
         SUM(CASE WHEN dep_del15 = 1 THEN 1 ELSE 0 END) / COUNT(*) AS delay_rate
       FROM fact_flight
       WHERE flight_date >= ? AND flight_date < ? AND dep_del15 IS NOT NULL
       GROUP BY origin_airport_id, dest_airport_id, airline_id`,
      [TRAINING_WINDOW_START, TRAINING_WINDOW_END]
    );

    return (result as { affectedRows: number }).affectedRows;
  } finally {
    connection.release();
  }
}

/**
 * Recomputes agg_origin_hourly_congestion from scratch, same leakage guard
 * as above. dep_hour is derived from crs_dep_time (a pre-pushback field),
 * bucketed to the hour.
 */
async function refreshOriginHourlyCongestion(): Promise<number> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.query('TRUNCATE TABLE agg_origin_hourly_congestion');

    const [result] = await connection.query(
      `INSERT INTO agg_origin_hourly_congestion
         (origin_airport_id, dep_hour, flight_count, delayed_count, delay_rate)
       SELECT
         origin_airport_id,
         FLOOR(crs_dep_time / 60) AS dep_hour,
         COUNT(*) AS flight_count,
         SUM(CASE WHEN dep_del15 = 1 THEN 1 ELSE 0 END) AS delayed_count,
         SUM(CASE WHEN dep_del15 = 1 THEN 1 ELSE 0 END) / COUNT(*) AS delay_rate
       FROM fact_flight
       WHERE flight_date >= ? AND flight_date < ? AND dep_del15 IS NOT NULL
       GROUP BY origin_airport_id, FLOOR(crs_dep_time / 60)`,
      [TRAINING_WINDOW_START, TRAINING_WINDOW_END]
    );

    return (result as { affectedRows: number }).affectedRows;
  } finally {
    connection.release();
  }
}

/**
 * Guard query: proves no aggregate row could have drawn on a post-window
 * flight, by re-deriving the max flight_date actually used and asserting it
 * is before TRAINING_WINDOW_END. Run as part of the refresh so a future
 * change to the WHERE clause above fails loudly, not silently.
 */
async function assertNoLeakage(): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT MAX(flight_date) AS max_date FROM fact_flight WHERE flight_date >= ? AND flight_date < ?',
      [TRAINING_WINDOW_START, TRAINING_WINDOW_END]
    );
    const maxDate = (rows as Array<{ max_date: string | null }>)[0].max_date;

    if (maxDate !== null && maxDate >= TRAINING_WINDOW_END) {
      throw new Error(
        `Leakage guard failed: max flight_date used (${maxDate}) is not before ` +
        `TRAINING_WINDOW_END (${TRAINING_WINDOW_END}).`
      );
    }
  } finally {
    connection.release();
  }
}

async function main(): Promise<void> {
  console.log(`Refreshing feature aggregates for training window ${TRAINING_WINDOW_START} to ${TRAINING_WINDOW_END} (exclusive)...`);

  await assertNoLeakage();

  const routeRows = await refreshRouteAirlineDelay();
  console.log(`agg_route_airline_delay: ${routeRows} rows`);

  const hourlyRows = await refreshOriginHourlyCongestion();
  console.log(`agg_origin_hourly_congestion: ${hourlyRows} rows`);

  console.log('Done.');
  process.exit(0);
}

main().catch(error => {
  console.error('Aggregate refresh failed:', error);
  process.exit(1);
});
