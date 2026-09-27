// Streaming CSV loader for FlyWise flight data (Task 4).
// Usage:
//   tsx src/etl/load-flights.ts --discover
//   tsx src/etl/load-flights.ts --airports JFK,LAX,ATL,ORD --months 1-3
//   tsx src/etl/load-flights.ts --limit 10000
//
// Streams the source CSV line by line (never loads it whole - the file is
// ~900MB) and upserts into dim_airline / dim_airport / fact_flight. The same
// flags that produce a subset today (--airports, --months, --limit) also
// support the full load later: omitting all three loads everything.
import 'dotenv/config';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PoolConnection } from 'mysql2/promise';
import { getPool } from '../config/database.js';
import { parseCsvLine, parseFlightRow, EXPECTED_HEADER, type ParsedFlightRow } from './csv-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV_PATH = path.join(__dirname, '..', '..', 'flight_project_cleaned.csv');
const BATCH_SIZE = 500;

interface CliOptions {
  discover: boolean;
  airports: Set<string> | null;
  months: Set<number> | null;
  limit: number | null;
  csvPath: string;
}

function parseMonthsArg(raw: string): Set<number> {
  const months = new Set<number>();
  for (const part of raw.split(',')) {
    const rangeMatch = part.trim().match(/^(\d{1,2})-(\d{1,2})$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let m = start; m <= end; m++) months.add(m);
    } else {
      const single = Number(part.trim());
      if (Number.isFinite(single)) months.add(single);
    }
  }
  return months;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    discover: false,
    airports: null,
    months: null,
    limit: null,
    csvPath: DEFAULT_CSV_PATH,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--discover':
        options.discover = true;
        break;
      case '--airports':
        options.airports = new Set(argv[++i].split(',').map(a => a.trim().toUpperCase()).filter(Boolean));
        break;
      case '--months':
        options.months = parseMonthsArg(argv[++i]);
        break;
      case '--limit':
        options.limit = Number(argv[++i]);
        break;
      case '--csv':
        options.csvPath = argv[++i];
        break;
    }
  }

  return options;
}

function rowMonth(flightDate: string): number {
  return Number(flightDate.slice(5, 7));
}

function rowMatchesFilters(row: ParsedFlightRow, options: CliOptions): boolean {
  if (options.airports && !(options.airports.has(row.origin) || options.airports.has(row.dest))) {
    return false;
  }
  if (options.months && !options.months.has(rowMonth(row.flightDate))) {
    return false;
  }
  return true;
}

/**
 * Discovery mode: streams the file once to report the real row count and date
 * range, without touching the database.
 *
 * This exists because the train/test boundary has to be derived from the data's
 * actual bounds rather than assumed. Run this before setting the dates in
 * src/etl/training-window.ts.
 */
async function discover(csvPath: string): Promise<void> {
  const stream = createReadStream(csvPath, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let lineNumber = 0;
  let rowCount = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;
  const airlines = new Set<string>();
  const airports = new Set<string>();

  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1) continue; // header
    if (line.trim() === '') continue;

    const fields = parseCsvLine(line);
    const result = parseFlightRow(fields);
    if (!result.ok) continue;

    rowCount++;
    const { flightDate, reportingAirline, origin, dest } = result.row;
    if (minDate === null || flightDate < minDate) minDate = flightDate;
    if (maxDate === null || flightDate > maxDate) maxDate = flightDate;
    airlines.add(reportingAirline);
    airports.add(origin);
    airports.add(dest);
  }

  console.log('\nDiscovery report:');
  console.log('=================');
  console.log(`Total data rows: ${rowCount}`);
  console.log(`Date range: ${minDate} to ${maxDate}`);
  console.log(`Distinct airlines: ${airlines.size}`);
  console.log(`Distinct airports: ${airports.size}`);
}

/** In-memory caches so repeated codes within a run don't re-query the DB. */
class DimensionCache {
  private airlineIds = new Map<string, number>();
  private airportIds = new Map<string, number>();

  constructor(private connection: PoolConnection) {}

  async getAirlineId(code: string): Promise<number> {
    const cached = this.airlineIds.get(code);
    if (cached !== undefined) return cached;

    await this.connection.execute(
      'INSERT INTO dim_airline (code) VALUES (?) ON DUPLICATE KEY UPDATE code = code',
      [code]
    );
    const [rows] = await this.connection.execute(
      'SELECT id FROM dim_airline WHERE code = ?',
      [code]
    );
    const id = (rows as Array<{ id: number }>)[0].id;
    this.airlineIds.set(code, id);
    return id;
  }

  async getAirportId(code: string, cityName: string | null): Promise<number> {
    const cached = this.airportIds.get(code);
    if (cached !== undefined) return cached;

    await this.connection.execute(
      `INSERT INTO dim_airport (code, city_name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE city_name = COALESCE(dim_airport.city_name, VALUES(city_name))`,
      [code, cityName]
    );
    const [rows] = await this.connection.execute(
      'SELECT id FROM dim_airport WHERE code = ?',
      [code]
    );
    const id = (rows as Array<{ id: number }>)[0].id;
    this.airportIds.set(code, id);
    return id;
  }
}

async function insertBatch(
  connection: PoolConnection,
  cache: DimensionCache,
  batch: ParsedFlightRow[]
): Promise<void> {
  if (batch.length === 0) return;

  const values: unknown[][] = [];
  for (const row of batch) {
    const airlineId = await cache.getAirlineId(row.reportingAirline);
    const originId = await cache.getAirportId(row.origin, row.originCityName);
    const destId = await cache.getAirportId(row.dest, row.destCityName);

    values.push([
      row.flightDate, airlineId, row.flightNumber, originId, destId,
      row.crsDepTime, row.crsArrTime, row.crsElapsedTime, row.distance,
      row.depTime, row.depDelay, row.depDel15, row.arrTime, row.arrDelay,
      row.arrDel15, row.actualElapsedTime, row.airTime, row.cancelled,
      row.diverted, row.cancellationCode, row.carrierDelay, row.weatherDelay, row.nasDelay,
      row.securityDelay, row.lateAircraftDelay,
    ]);
  }

  const placeholders = values.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
  const flat = values.flat();

  await connection.query(
    `INSERT INTO fact_flight (
      flight_date, airline_id, flight_number, origin_airport_id, dest_airport_id,
      crs_dep_time, crs_arr_time, crs_elapsed_time, distance,
      dep_time, dep_delay, dep_del15, arr_time, arr_delay,
      arr_del15, actual_elapsed_time, air_time, cancelled,
      diverted, cancellation_code, carrier_delay, weather_delay, nas_delay,
      security_delay, late_aircraft_delay
    ) VALUES ${placeholders}`,
    flat
  );
}

async function load(options: CliOptions): Promise<void> {
  const stream = createReadStream(options.csvPath, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  const connection = await getPool().getConnection();
  const cache = new DimensionCache(connection);

  let lineNumber = 0;
  let loadedCount = 0;
  let rejectedCount = 0;
  let matchedCount = 0;
  const rejects: Array<{ line: number; reason: string }> = [];
  let batch: ParsedFlightRow[] = [];

  try {
    for await (const line of rl) {
      lineNumber++;

      if (lineNumber === 1) {
        const header = parseCsvLine(line).map(h => h.trim());
        const headerMatches = EXPECTED_HEADER.every((col, i) => header[i] === col);
        if (!headerMatches) {
          throw new Error(
            `CSV header does not match expected schema.\nExpected: ${EXPECTED_HEADER.join(',')}\nGot: ${header.join(',')}`
          );
        }
        continue;
      }

      if (line.trim() === '') continue;
      if (options.limit !== null && matchedCount >= options.limit) break;

      const fields = parseCsvLine(line);
      const result = parseFlightRow(fields);

      if (!result.ok) {
        rejectedCount++;
        if (rejects.length < 100) rejects.push({ line: lineNumber, reason: result.reason });
        continue;
      }

      if (!rowMatchesFilters(result.row, options)) continue;

      matchedCount++;
      batch.push(result.row);

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(connection, cache, batch);
        loadedCount += batch.length;
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(connection, cache, batch);
      loadedCount += batch.length;
    }
  } finally {
    connection.release();
  }

  console.log('\nLoad report:');
  console.log('============');
  console.log(`Lines read: ${lineNumber}`);
  console.log(`Loaded: ${loadedCount}`);
  console.log(`Rejected: ${rejectedCount}`);
  if (rejects.length > 0) {
    console.log(`\nFirst ${rejects.length} rejects:`);
    for (const r of rejects) {
      console.log(`  line ${r.line}: ${r.reason}`);
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.discover) {
    await discover(options.csvPath);
  } else {
    await load(options);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('ETL failed:', error);
  process.exit(1);
});
