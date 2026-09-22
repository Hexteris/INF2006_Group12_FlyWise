// CSV parsing helpers for the FlyWise flight data loader (Task 4).
// Isolated from the streaming/DB logic so quirk handling is unit-testable
// without a database connection.

/**
 * Parses a single CSV line into fields, honoring double-quoted fields that
 * may contain commas (e.g. `"New York, NY"`). Does not handle escaped quotes
 * inside quoted fields (`""`) because the source file does not use them -
 * BTS on-time performance exports quote only for comma-containing city names.
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

/**
 * Parses an HHMM-formatted scheduled time (e.g. `659` = 06:59, `1345` = 13:45)
 * into minutes since midnight. Also handles HH:MM format (e.g. `06:59`, `13:45`).
 * BTS data uses `2400` for midnight-end-of-day; this is normalized to `0` (start of day)
 * rather than an out-of-range 1440, since downstream hour-bucket logic (Task 5, Task 10) expects 0-1439.
 */
export function parseHHMM(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  // Try parsing HH:MM format first
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const hours = Number(colonMatch[1]);
    const minutes = Number(colonMatch[2]);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    
    // Handle 24:00 as midnight
    if (hours === 24 && minutes === 0) return 0;
    
    return hours * 60 + minutes;
  }

  // Try parsing HHMM format (without colon)
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;

  if (value === 2400) return 0;
  if (value < 0 || value > 2359) return null;

  const hours = Math.floor(value / 100);
  const minutes = value % 100;

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Parses a float-formatted numeric field (e.g. `656.0`, `-3.0`) into an
 * integer. Source delays/times are always whole minutes represented with a
 * trailing `.0`; this truncates rather than rounds since no fractional
 * minute has been observed in the data.
 */
export function parseFloatField(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;

  return Math.trunc(value);
}

/**
 * Parses the boolean-as-float fields (`DepDel15`, `ArrDel15`, `Cancelled`)
 * which appear as `0.0` / `1.0` in the source.
 */
export function parseBooleanFlag(raw: string): number | null {
  const value = parseFloatField(raw);
  if (value === null) return null;
  return value === 0 ? 0 : 1;
}

/** Strips surrounding whitespace only; quoting is already removed by parseCsvLine. */
function cleanField(raw: string): string {
  return raw.trim();
}

export interface ParsedFlightRow {
  flightDate: string;
  reportingAirline: string;
  flightNumber: string;
  origin: string;
  originCityName: string | null;
  dest: string;
  destCityName: string | null;
  crsDepTime: number;
  depTime: number | null;
  depDelay: number | null;
  depDel15: number | null;
  crsArrTime: number;
  arrTime: number | null;
  arrDelay: number | null;
  arrDel15: number | null;
  cancelled: number;
  diverted: number | null;
  cancellationCode: string | null;
  crsElapsedTime: number | null;
  actualElapsedTime: number | null;
  airTime: number | null;
  distance: number | null;
  carrierDelay: number | null;
  weatherDelay: number | null;
  nasDelay: number | null;
  securityDelay: number | null;
  lateAircraftDelay: number | null;
}

export const CSV_COLUMN_COUNT = 27;

export const EXPECTED_HEADER = [
  'flight_date', 'reporting_airline', 'flight_number', 'origin', 'origin_city_name',
  'dest', 'dest_city_name', 'crs_dep_time', 'dep_time', 'dep_delay', 'dep_del15',
  'crs_arr_time', 'arr_time', 'arr_delay', 'arr_del15', 'cancelled', 'diverted',
  'cancellation_code', 'crs_elapsed_time', 'actual_elapsed_time', 'air_time',
  'distance', 'carrier_delay', 'weather_delay', 'nas_delay', 'security_delay',
  'late_aircraft_delay',
];

/**
 * Parses one data line into a typed row, or returns a rejection reason
 * instead of throwing. Rows with an unparseable required field (flight date,
 * airline, airports, scheduled times) are rejected; rows with unparseable
 * optional/outcome fields fall back to null rather than rejecting the row,
 * since those fields are never used as model inputs directly.
 */
export function parseFlightRow(
  fields: string[]
): { ok: true; row: ParsedFlightRow } | { ok: false; reason: string } {
  if (fields.length !== CSV_COLUMN_COUNT) {
    return { ok: false, reason: `expected ${CSV_COLUMN_COUNT} columns, got ${fields.length}` };
  }

  const [
    flightDate, reportingAirline, flightNumber, origin, originCityName,
    dest, destCityName, crsDepTimeRaw, depTimeRaw, depDelayRaw, depDel15Raw,
    crsArrTimeRaw, arrTimeRaw, arrDelayRaw, arrDel15Raw, cancelledRaw,
    divertedRaw, cancellationCodeRaw, crsElapsedTimeRaw, actualElapsedTimeRaw, airTimeRaw,
    distanceRaw, carrierDelayRaw, weatherDelayRaw, nasDelayRaw,
    securityDelayRaw, lateAircraftDelayRaw,
  ] = fields;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate.trim())) {
    return { ok: false, reason: `malformed FlightDate: "${flightDate}"` };
  }

  const airlineCode = cleanField(reportingAirline);
  if (!airlineCode) {
    return { ok: false, reason: 'missing Reporting_Airline' };
  }

  const originCode = cleanField(origin);
  const destCode = cleanField(dest);
  if (!originCode || !destCode) {
    return { ok: false, reason: 'missing Origin or Dest' };
  }

  const crsDepTime = parseHHMM(crsDepTimeRaw);
  const crsArrTime = parseHHMM(crsArrTimeRaw);
  if (crsDepTime === null || crsArrTime === null) {
    return { ok: false, reason: `malformed scheduled time: dep="${crsDepTimeRaw}" arr="${crsArrTimeRaw}"` };
  }

  return {
    ok: true,
    row: {
      flightDate: flightDate.trim(),
      reportingAirline: airlineCode,
      flightNumber: cleanField(flightNumber),
      origin: originCode,
      originCityName: cleanField(originCityName) || null,
      dest: destCode,
      destCityName: cleanField(destCityName) || null,
      crsDepTime,
      depTime: parseFloatField(depTimeRaw),
      depDelay: parseFloatField(depDelayRaw),
      depDel15: parseBooleanFlag(depDel15Raw),
      crsArrTime,
      arrTime: parseFloatField(arrTimeRaw),
      arrDelay: parseFloatField(arrDelayRaw),
      arrDel15: parseBooleanFlag(arrDel15Raw),
      cancelled: parseBooleanFlag(cancelledRaw) ?? 0,
      diverted: parseBooleanFlag(divertedRaw),
      cancellationCode: cleanField(cancellationCodeRaw) || null,
      crsElapsedTime: parseFloatField(crsElapsedTimeRaw),
      actualElapsedTime: parseFloatField(actualElapsedTimeRaw),
      airTime: parseFloatField(airTimeRaw),
      distance: parseFloatField(distanceRaw),
      carrierDelay: parseFloatField(carrierDelayRaw),
      weatherDelay: parseFloatField(weatherDelayRaw),
      nasDelay: parseFloatField(nasDelayRaw),
      securityDelay: parseFloatField(securityDelayRaw),
      lateAircraftDelay: parseFloatField(lateAircraftDelayRaw),
    },
  };
}
