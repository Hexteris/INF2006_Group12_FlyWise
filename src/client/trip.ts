import type { DimRow, LiveFlightRow, PredictionResult, SavedUpcomingRow, UpcomingSavedBody } from '../types';
import { submitPrediction } from './services/api';

export interface Dims { airports: DimRow[]; airlines: DimRow[] }

export interface TripFlight {
  key: string;                 // "AA1234|2026-09-28"
  number: string;              // "AA1234"
  flightNumber: number | null;
  airline: string | null;
  airlineCode: string;
  origin: string | null;
  destination: string | null;
  scheduledDeparture: string | null;
  scheduledArrival: string | null;
  date: string;                // YYYY-MM-DD
  status: string | null;
  delay: number | null;
  savedId?: number;            // set when it came from /upcoming-saved-flights
}

export interface LiveFilters {
  airport: string;
  direction: 'Departure' | 'Arrival';
  flightNumber: string;
  airline: string;
  date: string;
}

const timeMatch = (s?: string | null) => s?.match(/(\d{2}):(\d{2})/) ?? null;
export const clock = (s?: string | null) => { const m = timeMatch(s); return m ? `${m[1]}:${m[2]}` : '–'; };
export const hhmm = (s?: string | null) => { const m = timeMatch(s); return m ? `${m[1]}${m[2]}` : null; };
export const sqlTime = (s: string | null) => (s ? s.slice(0, 19).replace('T', ' ') : null);
export const pct = (v: number | null | undefined) => (v == null ? '–' : `${Math.round(v * 100)}%`);

/** Thresholds are on historical delay rate (share of flights >15 min late). Tune to your data. */
export function risk(score: number) {
  if (score < 0.2) return { label: 'Low', text: 'text-emerald-600', bar: 'bg-emerald-500' };
  if (score < 0.35) return { label: 'Moderate', text: 'text-amber-600', bar: 'bg-amber-500' };
  return { label: 'High', text: 'text-red-600', bar: 'bg-red-500' };
}

export function fromLive(r: LiveFlightRow): TripFlight {
  const dep = r.scheduledDeparture ?? r.scheduledTime;
  const number = r.number ?? '–';
  const n = r.flightNumber != null ? Number(r.flightNumber) : Number(number.match(/(\d+)$/)?.[1]);
  const date = (dep ?? '').slice(0, 10);
  return {
    key: `${number}|${date}`,
    number,
    flightNumber: Number.isFinite(n) ? n : null,
    airline: r.airline,
    airlineCode: r.airlineCode ?? '',
    origin: r.origin ?? null,
    destination: r.destination ?? null,
    scheduledDeparture: dep ?? null,
    scheduledArrival: r.scheduledArrival ?? null,
    date,
    status: r.status,
    delay: r.delay ?? null,
  };
}

export function fromSaved(s: SavedUpcomingRow): TripFlight {
  const number = `${s.airline_code}${s.flight_number}`;
  const date = String(s.flight_date).slice(0, 10);
  return {
    key: `${number}|${date}`,
    number,
    flightNumber: s.flight_number,
    airline: null,
    airlineCode: s.airline_code,
    origin: s.origin,
    destination: s.destination,
    scheduledDeparture: s.scheduled_departure,
    scheduledArrival: s.scheduled_arrival,
    date,
    status: s.flight_status,
    delay: null,
    savedId: s.upcoming_saved_flight_id,
  };
}

export function toSaveBody(f: TripFlight): UpcomingSavedBody {
  if (!f.origin || !f.destination || f.flightNumber == null)
    throw new Error('This flight is missing route details, so it cannot be saved.');
  return {
    flight_number: f.flightNumber,
    airline_code: f.airlineCode,
    origin: f.origin,
    destination: f.destination,
    flight_date: f.date,
    scheduled_departure: sqlTime(f.scheduledDeparture),
    scheduled_arrival: sqlTime(f.scheduledArrival),
    flight_status: f.status,
  };
}

export function applyFilters(list: TripFlight[], f: LiveFilters): TripFlight[] {
  const num = f.flightNumber.trim().toUpperCase();
  return list.filter(
    (t) =>
      (!num || t.number.toUpperCase().includes(num)) &&
      (!f.airline || t.airlineCode === f.airline) &&
      (!f.date || t.date === f.date)
  );
}

export async function predictFlight(
  f: TripFlight, airports: DimRow[], airlines: DimRow[]
): Promise<PredictionResult> {
  if (!f.origin || !f.destination) throw new Error('Route unknown for this flight');
  const o = airports.find((a) => a.code === f.origin);
  const d = airports.find((a) => a.code === f.destination);
  const al = airlines.find((a) => a.code === f.airlineCode);
  const time = hhmm(f.scheduledDeparture);
  if (!o) throw new Error(`${f.origin} is not in the historical database`);
  if (!d) throw new Error(`${f.destination} is not in the historical database`);
  if (!al) throw new Error(`Airline ${f.airlineCode} is not in the historical database`);
  if (!time) throw new Error('No scheduled departure time');
  return submitPrediction({
    originAirportId: o.id, destAirportId: d.id, airlineId: al.id,
    scheduledDepartureTime: time, flightDate: f.date,
  });
}