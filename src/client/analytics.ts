import type { MonthlyTrendRow } from '../types';

/**
 * Sum of total flights across all monthly rows.
 * Returns 0 for an empty array.
 */
export function totalFlights(rows: MonthlyTrendRow[]): number {
  return rows.reduce((sum, row) => sum + row.total_flights, 0);
}

/**
 * Number of months covered, i.e., the row count.
 * Returns 0 for an empty array.
 */
export function monthsCovered(rows: MonthlyTrendRow[]): number {
  return rows.length;
}

/**
 * Flight‑weighted overall delay rate.
 *
 * This is not a simple mean of `delay_rate` values — each row’s `delay_rate`
 * is already a rate for that month, but we weight it by `total_flights`.
 *
 * Returns 0 for an empty array or when total flights is zero.
 */
export function weightedDelayRate(rows: MonthlyTrendRow[]): number {
  const total = totalFlights(rows);
  if (total === 0) return 0;

  const weightedSum = rows.reduce(
    (sum, row) => sum + row.total_flights * row.delay_rate,
    0
  );
  return weightedSum / total;
}