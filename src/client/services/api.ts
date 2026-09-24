// API client for the FastAPI backend.
//
// React → Vite → FastAPI → MariaDB
//
// FastAPI endpoints do NOT use an /api prefix.
// Vite proxies the endpoint paths below to FastAPI on port 8000.
//
// FastAPI returns JSON data directly, so there is no Express-style
// ApiEnvelope to unwrap.

import type {
  Airline,
  Airport,
  Route,
  Flight,
  FlightDetails,
  AirlineAnalytics,
  RouteAnalytics,
  AirportAnalytics,
  MonthlyDelayTrend,
  HourlyDelayTrend,
  DelayCause,
  AirlineRouteAnalytics,
  PredictionFeatures,
  PredictionRequest,
  PredictionResult,
} from '../../types';

const BASE = '';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Unexpected non-JSON response (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    if (
      typeof data === 'object' &&
      data !== null &&
      'detail' in data
    ) {
      throw new Error(String(data.detail));
    }

    throw new Error(
      `Request failed: HTTP ${response.status}`
    );
  }

  return data as T;
}

function query(
  params: Record<string, string | number | undefined>
): string {
  const entries = Object.entries(params)
    .filter(
      ([, value]) =>
        value !== undefined &&
        value !== ''
    )
    .map(
      ([key, value]) =>
        [key, String(value)] as [string, string]
    );

  return entries.length > 0
    ? `?${new URLSearchParams(entries).toString()}`
    : '';
}

/* =========================================================
   Dropdown / Search APIs
   ========================================================= */

export const fetchAirlines = () =>
  request<Airline[]>('/airlines');

export const fetchAirports = () =>
  request<Airport[]>('/airports');

export const fetchRoutes = (origin: string) =>
  request<Route[]>(
    `/routes${query({ origin })}`
  );

/* =========================================================
   Flight APIs
   ========================================================= */

export const fetchFlights = (
  flightDate: string,
  origin: string,
  destination: string
) =>
  request<Flight[]>(
    `/flights${query({
      flight_date: flightDate,
      origin,
      destination,
    })}`
  );

export const fetchFlightDetails = (
  flightId: number
) =>
  request<FlightDetails[]>(
    `/flights/${flightId}`
  );

/* =========================================================
   Analytics APIs
   ========================================================= */

export const fetchAirlineAnalytics = (
  airline: string
) =>
  request<AirlineAnalytics[]>(
    `/analytics/airline${query({ airline })}`
  );

export const fetchRouteAnalytics = (
  origin: string,
  destination: string
) =>
  request<RouteAnalytics[]>(
    `/analytics/route${query({
      origin,
      destination,
    })}`
  );

export const fetchAirportAnalytics = (
  airport: string
) =>
  request<AirportAnalytics[]>(
    `/analytics/airport${query({ airport })}`
  );

export const fetchMonthlyDelayTrends = () =>
  request<MonthlyDelayTrend[]>(
    '/analytics/delay-trends/monthly'
  );

export const fetchHourlyDelayTrends = () =>
  request<HourlyDelayTrend[]>(
    '/analytics/delay-trends/hourly'
  );

export const fetchDelayCauses = () =>
  request<DelayCause[]>(
    '/analytics/delay-causes'
  );

export const fetchAirlineRouteAnalytics = (
  airline: string,
  origin: string,
  destination: string
) =>
  request<AirlineRouteAnalytics[]>(
    `/analytics/airline-route${query({
      airline,
      origin,
      destination,
    })}`
  );

/* =========================================================
   Prediction APIs
   ========================================================= */

export const fetchPredictionData = (
  airline: string,
  origin: string,
  destination: string
) =>
  request<PredictionFeatures[]>(
    `/prediction-data${query({
      airline,
      origin,
      destination,
    })}`
  );

export const submitPrediction = (
  body: PredictionRequest
) =>
  request<PredictionResult>(
    '/predict',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );