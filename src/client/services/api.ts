// API client.
//
// The base URL is RELATIVE by design: the client and the API are served from the
// same origin by FastAPI, so a hardcoded http://localhost:8000 would break the
// moment the host or port changed. In dev, vite.config.ts proxies these routes
// to port 8000 so this same code works unchanged from the Vite dev server.
//
// Response types come from src/types.ts, the same file the server builds them
// from, so the two sides cannot drift.
import type {
  ApiEnvelope,
  Summary,
  RoutePerformanceRow,
  CongestionRow,
  DimRow,
  PredictionRequest,
  PredictionResult,
  FlightSearchRow,
  MonthlyTrendRow,
  HourlyTrendRow,
  DelayCauseRow,
  LiveFlightRow,
} from '../../types';

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
type ApiRow = Record<string, unknown>;

/**
 * Unwraps the ApiEnvelope so callers receive `T` directly and never have to
 * check `success` themselves. A failed request throws, which is what lets
 * useApiResource report an error message instead of rendering an empty table.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let envelope: ApiEnvelope<T>;

  const response = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // A non-JSON body means something upstream answered instead of the API
    // (a proxy error page, for example). Report the status rather than a
    // confusing JSON parse error.
    throw new Error(`Unexpected non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const error = 'error' in envelope && envelope.error ? envelope.error : `Request failed: HTTP ${response.status}`;
    throw new Error(error);
  }
  if (!envelope.success) {
    throw new Error(envelope.error);
  }

  return envelope.data;
}

/** Reads older FastAPI routes that return rows directly rather than envelopes. */
async function requestRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

/** Serialises defined, non-empty params into a query string. */
function query(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? `?${new URLSearchParams(entries).toString()}` : '';
}

export const fetchSummary = () => request<Summary>('/summary');

export const fetchRoutePerformance = (
  params: { airlineId?: number; originId?: number; limit?: number } = {}
) => request<RoutePerformanceRow[]>(`/airlines${query(params)}`);

export const fetchCongestion = (params: { airportId?: number; limit?: number } = {}) =>
  request<CongestionRow[]>(`/airports/congestion${query(params)}`);

export const fetchAirports = () => request<DimRow[]>('/airports');

export const fetchAirlines = () => request<DimRow[]>('/airlines/list');

export const submitPrediction = (body: PredictionRequest) =>
  request<PredictionResult>('/predict', { method: 'POST', body: JSON.stringify(body) });

export const fetchLegacyAirlines = () => requestRaw<ApiRow[]>('/legacy/airlines');

export const fetchLegacyAirports = () => requestRaw<ApiRow[]>('/legacy/airports');

export const fetchRoutes = (origin: string) =>
  requestRaw<ApiRow[]>(`/routes${query({ origin })}`);

export const searchFlights = (params: {
  flight_date: string;
  origin: string;
  destination: string;
}) => requestRaw<FlightSearchRow[]>(`/flights${query(params)}`);

export const fetchFlightDetails = (flightId: number) =>
  requestRaw<ApiRow[]>(`/flights/${flightId}`);

export const fetchAirlineAnalytics = (airline: string) =>
  requestRaw<ApiRow[]>(`/analytics/airline${query({ airline })}`);

export const fetchRouteAnalytics = (origin: string, destination: string) =>
  requestRaw<ApiRow[]>(`/analytics/route${query({ origin, destination })}`);

export const fetchAirportAnalytics = (airport: string) =>
  requestRaw<ApiRow[]>(`/analytics/airport${query({ airport })}`);

export const fetchMonthlyDelayTrends = () =>
  requestRaw<MonthlyTrendRow[]>('/analytics/delay-trends/monthly');

export const fetchHourlyDelayTrends = () =>
  requestRaw<HourlyTrendRow[]>('/analytics/delay-trends/hourly');

export const fetchDelayCauses = () =>
  requestRaw<DelayCauseRow[]>('/analytics/delay-causes');

export const fetchAirlineRouteAnalytics = (
  airline: string,
  origin: string,
  destination: string
) => requestRaw<ApiRow[]>(
  `/analytics/airline-route${query({ airline, origin, destination })}`
);

export const fetchPredictionData = (airline: string, origin: string, destination: string) =>
  requestRaw<ApiRow[]>(`/prediction-data${query({ airline, origin, destination })}`);

export const fetchLiveFlights = (
  airport: string,
  direction: 'Departure' | 'Arrival' = 'Departure'
) => request<LiveFlightRow[]>(`/live-flights${query({ airport, direction })}`);
