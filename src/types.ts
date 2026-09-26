// The FlyWise client API contract: the exact shapes expected from the backend.
//
// Declared once here and imported by the client, so a field can never drift
// between what the backend returns and what the UI renders.
//
// The client expects every endpoint to return an ApiEnvelope<T> wrapper.
// All rates are fractions in the range 0-1, never percentages. Formatting to a
// percentage is a presentation concern and happens only in the client.

/**
 * Uniform response envelope for every backend route. A discriminated union, so
 * checking `success` narrows to exactly one of `data` or `error`.
 */
export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Headline figures for the dashboard cards. */
export interface Summary {
  totalFlights: number;
  totalDelayed: number;
  /** Flight-weighted, not the mean of per-route rates. */
  avgDelayRate: number;
  routeCount: number;
  airportCount: number;
  airlineCount: number;
}

/** One origin-destination-airline combination and its historical delay rate. */
export interface RoutePerformanceRow {
  airlineCode: string;
  originCode: string;
  originCity: string | null;
  destCode: string;
  flightCount: number;
  delayedCount: number;
  delayRate: number;
}

/** One airport at one scheduled departure hour. */
export interface CongestionRow {
  airportCode: string;
  airportCity: string | null;
  /** 0-23, derived from crs_dep_time (minutes since midnight) / 60. */
  depHour: number;
  flightCount: number;
  delayedCount: number;
  delayRate: number;
}

/** A dimension-table entry, used to populate dropdowns. */
export interface DimRow {
  id: number;
  code: string;
  /** Present for airports, absent for airlines. */
  cityName?: string | null;
}

/**
 * Historical rates backing a prediction. `null` means "no history for this
 * route or hour" and is deliberately not collapsed to 0, so the caller chooses
 * the fallback instead of silently treating unknown as never-delayed.
 */
export interface HistoricalRates {
  routeDelayRate: number | null;
  hourlyDelayRate: number | null;
}

export type DelayLabel = 'DELAYED' | 'ON_TIME';

/** What the model returns. */
export interface Prediction {
  /** Confidence in `label`, 0-1. */
  score: number;
  label: DelayLabel;
  modelVersion: string;
}

/** What POST /predict returns: the prediction plus the evidence behind it. */
export interface PredictionResult extends Prediction {
  historical: HistoricalRates;
}

/** Request body for POST /api/predict. */
export interface PredictionRequest {
  originAirportId: number;
  destAirportId: number;
  airlineId: number;
  /** HHMM, e.g. "0800". */
  scheduledDepartureTime: string;
  /** YYYY-MM-DD. */
  flightDate: string;
}

export interface FlightSearchRow {
  flight_date: string;
  airline_code: string;
  flight_number: number | null;
  origin: string;
  destination: string;
  scheduled_departure: string | null;
  scheduled_arrival: string | null;
  departure_delay: number | null;
  arrival_delay: number | null;
  cancelled: number | boolean;
  diverted: number | boolean;
}

export interface MonthlyTrendRow {
  month: string;
  total_flights: number;
  delay_rate: number;
  avg_delay: number | null;
}

export interface HourlyTrendRow {
  departure_hour: string;
  total_flights: number;
  delay_rate: number;
  avg_delay: number | null;
}

export interface DelayCauseRow {
  rank: number;
  delay_cause: string;
  delay_hours: number;
  delay_percentage: number;
}

export interface LiveFlightRow {
  number: string | null;
  airline: string | null;
  airlineCode: string | null;
  status: string | null;
  airport: string | null;
  scheduledTime: string | null;
  revisedTime: string | null;
  terminal: string | null;
  gate: string | null;
  aircraft: string | null;
  latitude: number | null;
  longitude: number | null;
  lastUpdatedUtc: string | null;
}

// Authentication types
export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateProfileRequest {
  email?: string;
  password?: string;
  name?: string;
}
