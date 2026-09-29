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
  ApiEnvelope, Summary, RoutePerformanceRow, CongestionRow, DimRow,
  PredictionRequest, PredictionResult, FlightSearchRow, MonthlyTrendRow,
  HourlyTrendRow, DelayCauseRow, LiveFlightRow,
  AuthResponse, SavedUpcomingRow, UpcomingSavedBody, HistoryRow,
} from '../../types';

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
type ApiRow = Record<string, unknown>;

let token: string | null = localStorage.getItem('flywise_token');
export const hasToken = () => token !== null;
export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('flywise_token', t);
  else localStorage.removeItem('flywise_token');
}

/** One fetch wrapper: adds the Bearer token and surfaces FastAPI `detail` errors. */
async function http<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Unexpected non-JSON response (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const b = body as { detail?: unknown; error?: string };
    throw new Error(
      (typeof b.detail === 'string' ? b.detail : b.error) ?? `Request failed: HTTP ${response.status}`
    );
  }
  return body as T;
}

/** For routes wrapped in { success, data }. */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const envelope = await http<ApiEnvelope<T>>(endpoint, options);
  if (!envelope.success) throw new Error(envelope.error);
  return envelope.data;
}

/** For older routes that return rows directly. */
const requestRaw = http;

function query(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => [k, String(v)]);
  return entries.length > 0 ? `?${new URLSearchParams(entries).toString()}` : '';
}

export const fetchSummary = () => request<Summary>('/summary');

export const fetchRoutePerformance = (
  params: { airlineId?: number; originId?: number; limit?: number } = {}
) => request<RoutePerformanceRow[]>(`/airlines${query(params)}`);

export const fetchCongestion = (params: { airportId?: number; limit?: number } = {}) =>
  request<CongestionRow[]>(`/airports/congestion${query(params)}`);

export const fetchAirports = async (): Promise<DimRow[]> => {
  const rows = await requestRaw<Array<{
    airport_id: number;
    airport_code: string;
    city_name?: string | null;
  }>>('/airports');

  return rows.map((row) => ({
    id: row.airport_id,
    code: row.airport_code,
    cityName: row.city_name,
  }));
};

export const fetchAirlines = async (): Promise<DimRow[]> => {
  const rows = await requestRaw<Array<{
    airline_id: number;
    airline_code: string;
  }>>('/airlines');

  return rows.map((row) => ({
    id: row.airline_id,
    code: row.airline_code,
  }));
};

export const submitPrediction = (body: PredictionRequest) =>
  request<PredictionResult>('/predict', { method: 'POST', body: JSON.stringify(body) });

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

// ---- auth ----
export const login = (username: string, password: string) =>
  http<AuthResponse>('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const signup = (username: string, email: string, password: string) =>
  http<{ message: string }>('/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) });
export const fetchMe = () =>
  http<{ user_id: number; username: string; email: string }>('/me');

// ---- saved upcoming flights ----
export const fetchUpcomingSaved = () => http<SavedUpcomingRow[]>('/upcoming-saved-flights');
export const saveUpcoming = (body: UpcomingSavedBody) =>
  http<{ message: string }>('/upcoming-saved-flights', { method: 'POST', body: JSON.stringify(body) });
export const deleteUpcoming = (id: number) =>
  http<{ message: string }>(`/upcoming-saved-flights/${id}`, { method: 'DELETE' });

// ---- historical flights (backend patch 2) ----
export const fetchHistory = (p: { airline?: string; origin?: string; destination?: string; limit?: number }) =>
  http<HistoryRow[]>(`/history${query(p)}`);