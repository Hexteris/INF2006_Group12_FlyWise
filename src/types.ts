// The FlyWise client API contract: the exact shapes expected from the backend.
//
// Declared once here and imported by the client, so a field can never drift
// between what the backend returns and what the UI renders.
//
// The client expects every endpoint to return an ApiEnvelope<T> wrapper.
// All rates are fractions in the range 0-1, never percentages. Formatting to a
// percentage is a presentation concern and happens only in the client.

/**
 * Uniform response envelope for every /api route. A discriminated union, so
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

/** What POST /api/predict returns: the prediction plus the evidence behind it. */
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
