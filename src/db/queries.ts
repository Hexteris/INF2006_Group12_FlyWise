// Every SQL string in the app lives here. A schema change should require
// editing only this file.
//
// Three rules:
//   1. Values reach SQL through ? placeholders, never string interpolation.
//      LIMIT is the one exception and is clamped to a validated integer first,
//      because mysql2 will not reliably bind a placeholder in that position.
//   2. DECIMAL columns (delay_rate) and SUM()/AVG() results come back from
//      mysql2 as STRINGS. They are coerced here, so every value leaving this
//      module is already a real number.
//   3. Rows are mapped to the camelCase contract in src/types.ts. Raw snake_case
//      column names do not escape this file.
import { getPool } from '../config/database.js';
import type {
  Summary,
  RoutePerformanceRow,
  CongestionRow,
  DimRow,
  HistoricalRates,
  RouteQuery,
  CongestionQuery,
} from '../types.js';

/** A result set of untyped rows, as returned by mysql2 before mapping. */
type RawRows = Array<Record<string, unknown>>;

/** Clamps an untrusted limit to a safe integer so it can be inlined in SQL. */
function safeLimit(raw: unknown, fallback = 25, max = 200): number {
  const n = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

/** Parses an optional numeric filter. Returns null when absent or invalid. */
function optionalId(raw: unknown): number | null {
  const n = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Normalises a nullable text column to `string | null`. */
function nullableText(raw: unknown): string | null {
  return raw === null || raw === undefined ? null : String(raw);
}

/**
 * Builds a WHERE clause from optional equality filters. Clause *structure* is
 * conditional; the values themselves are always bound as parameters.
 */
function buildWhere(
  filters: Array<[column: string, value: number | null]>
): { sql: string; params: number[] } {
  const active = filters.filter((f): f is [string, number] => f[1] !== null);
  if (active.length === 0) return { sql: '', params: [] };
  return {
    sql: `WHERE ${active.map(([column]) => `${column} = ?`).join(' AND ')}`,
    params: active.map(([, value]) => value),
  };
}

export async function getSummary(): Promise<Summary> {
  const pool = getPool();

  const [[aggRows], [dimRows]] = await Promise.all([
    pool.query(
      `SELECT SUM(flight_count)  AS total_flights,
              SUM(delayed_count) AS total_delayed,
              COUNT(*)           AS route_count
         FROM agg_route_airline_delay`
    ) as Promise<[RawRows, unknown]>,
    pool.query(
      `SELECT (SELECT COUNT(*) FROM dim_airport) AS airport_count,
              (SELECT COUNT(*) FROM dim_airline) AS airline_count`
    ) as Promise<[RawRows, unknown]>,
  ]);

  const totalFlights = Number(aggRows[0]?.total_flights ?? 0);
  const totalDelayed = Number(aggRows[0]?.total_delayed ?? 0);

  return {
    totalFlights,
    totalDelayed,
    // Flight-weighted, not AVG(delay_rate): a 3-flight route must not carry the
    // same weight as a 3,000-flight route.
    avgDelayRate: totalFlights > 0 ? totalDelayed / totalFlights : 0,
    routeCount: Number(aggRows[0]?.route_count ?? 0),
    airportCount: Number(dimRows[0]?.airport_count ?? 0),
    airlineCount: Number(dimRows[0]?.airline_count ?? 0),
  };
}

export async function getRoutePerformance(
  filters: RouteQuery
): Promise<RoutePerformanceRow[]> {
  const limit = safeLimit(filters.limit);
  const where = buildWhere([
    ['agg.airline_id', optionalId(filters.airlineId)],
    ['agg.origin_airport_id', optionalId(filters.originId)],
  ]);

  const [rows] = (await getPool().query(
    `SELECT al.code      AS airline_code,
            ao.code      AS origin_code,
            ao.city_name AS origin_city,
            ad.code      AS dest_code,
            agg.flight_count,
            agg.delayed_count,
            agg.delay_rate
       FROM agg_route_airline_delay agg
       JOIN dim_airline al ON al.id = agg.airline_id
       JOIN dim_airport ao ON ao.id = agg.origin_airport_id
       JOIN dim_airport ad ON ad.id = agg.dest_airport_id
       ${where.sql}
   ORDER BY agg.flight_count DESC
      LIMIT ${limit}`,
    where.params
  )) as [RawRows, unknown];

  return rows.map(r => ({
    airlineCode: String(r.airline_code),
    originCode: String(r.origin_code),
    originCity: nullableText(r.origin_city),
    destCode: String(r.dest_code),
    flightCount: Number(r.flight_count),
    delayedCount: Number(r.delayed_count),
    delayRate: Number(r.delay_rate), // DECIMAL arrives as a string
  }));
}

export async function getAirportCongestion(
  filters: CongestionQuery
): Promise<CongestionRow[]> {
  // Defaults to 24 rows: one full day of hourly buckets for a single airport.
  const limit = safeLimit(filters.limit, 24);
  const where = buildWhere([
    ['agg.origin_airport_id', optionalId(filters.airportId)],
  ]);

  const [rows] = (await getPool().query(
    `SELECT a.code      AS airport_code,
            a.city_name AS airport_city,
            agg.dep_hour,
            agg.flight_count,
            agg.delayed_count,
            agg.delay_rate
       FROM agg_origin_hourly_congestion agg
       JOIN dim_airport a ON a.id = agg.origin_airport_id
       ${where.sql}
   ORDER BY agg.dep_hour ASC, agg.flight_count DESC
      LIMIT ${limit}`,
    where.params
  )) as [RawRows, unknown];

  return rows.map(r => ({
    airportCode: String(r.airport_code),
    airportCity: nullableText(r.airport_city),
    depHour: Number(r.dep_hour),
    flightCount: Number(r.flight_count),
    delayedCount: Number(r.delayed_count),
    delayRate: Number(r.delay_rate),
  }));
}

export async function listAirports(): Promise<DimRow[]> {
  const [rows] = (await getPool().query(
    'SELECT id, code, city_name FROM dim_airport ORDER BY code'
  )) as [RawRows, unknown];

  return rows.map(r => ({
    id: Number(r.id),
    code: String(r.code),
    cityName: nullableText(r.city_name),
  }));
}

export async function listAirlines(): Promise<DimRow[]> {
  const [rows] = (await getPool().query(
    'SELECT id, code FROM dim_airline ORDER BY code'
  )) as [RawRows, unknown];

  return rows.map(r => ({
    id: Number(r.id),
    code: String(r.code),
  }));
}

/**
 * Historical rates for one route at one departure hour. Feeds the prediction
 * endpoint. Returns nulls when that route or hour has no history, so the caller
 * decides the fallback rather than silently receiving a zero.
 */
export async function getHistoricalRates(params: {
  originAirportId: number;
  destAirportId: number;
  airlineId: number;
  depHour: number;
}): Promise<HistoricalRates> {
  const pool = getPool();

  const [[routeRows], [hourRows]] = await Promise.all([
    pool.query(
      `SELECT delay_rate FROM agg_route_airline_delay
        WHERE origin_airport_id = ? AND dest_airport_id = ? AND airline_id = ?`,
      [params.originAirportId, params.destAirportId, params.airlineId]
    ) as Promise<[RawRows, unknown]>,
    pool.query(
      `SELECT delay_rate FROM agg_origin_hourly_congestion
        WHERE origin_airport_id = ? AND dep_hour = ?`,
      [params.originAirportId, params.depHour]
    ) as Promise<[RawRows, unknown]>,
  ]);

  return {
    routeDelayRate: routeRows[0] ? Number(routeRows[0].delay_rate) : null,
    hourlyDelayRate: hourRows[0] ? Number(hourRows[0].delay_rate) : null,
  };
}
