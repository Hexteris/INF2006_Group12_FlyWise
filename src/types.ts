// FlyWise API contract.
//
// These types describe the data exchanged between the React frontend
// and the FastAPI backend.
//
// Architecture:
//
//   React frontend
//        ↓
//   Vite
//        ↓
//   FastAPI
//        ↓
//   MariaDB
//
// FastAPI returns JSON data directly, so the old Express ApiEnvelope
// is no longer required.
//
// Rates are represented as fractions from 0-1, not percentages.


/* =========================================================
   Dimension / Dropdown Data
   ========================================================= */

export interface Airline {
  airline_id: number;
  airline_code: string;
  airline_name?: string | null;
}

export interface Airport {
  airport_id: number;
  airport_code: string;
  airport_name?: string | null;
  city_name?: string | null;
}

export interface Route {
  origin_code: string;
  destination_code: string;
  origin_city?: string | null;
  destination_city?: string | null;
}


/* =========================================================
   Flight Search
   ========================================================= */

export interface Flight {
  flight_id: number;
  flight_date?: string | null;
  airline_code?: string | null;
  flight_number?: string | null;

  origin_code?: string | null;
  destination_code?: string | null;

  scheduled_departure_time?: string | null;
  scheduled_arrival_time?: string | null;

  actual_departure_time?: string | null;
  actual_arrival_time?: string | null;

  departure_delay?: number | null;
  arrival_delay?: number | null;

  cancelled?: boolean | null;
  diverted?: boolean | null;
}

export interface FlightDetails extends Flight {
  origin_city?: string | null;
  destination_city?: string | null;

  airline_name?: string | null;

  cancellation_reason?: string | null;
  delay_reason?: string | null;
}


/* =========================================================
   Analytics
   ========================================================= */

export interface AirlineAnalytics {
  airline_code?: string | null;
  airline_name?: string | null;

  total_flights?: number;
  operated_flights?: number;

  cancelled_flights?: number;
  diverted_flights?: number;

  delayed_flights?: number;
  severe_delay_flights?: number;

  delay_rate?: number;
  severe_delay_rate?: number;

  average_departure_delay?: number | null;
  average_arrival_delay?: number | null;
  max_arrival_delay?: number | null;
}

export interface RouteAnalytics {
  origin_code?: string | null;
  destination_code?: string | null;

  total_flights?: number;
  operated_flights?: number;

  cancelled_flights?: number;
  diverted_flights?: number;

  delayed_flights?: number;
  severe_delay_flights?: number;

  delay_rate?: number;
  severe_delay_rate?: number;

  average_departure_delay?: number | null;
  average_arrival_delay?: number | null;
  max_arrival_delay?: number | null;
}

export interface AirportAnalytics {
  airport_code?: string | null;
  airport_name?: string | null;

  total_flights?: number;
  operated_flights?: number;

  cancelled_flights?: number;
  diverted_flights?: number;

  delayed_flights?: number;

  delay_rate?: number;

  average_departure_delay?: number | null;
  average_arrival_delay?: number | null;
}

export interface MonthlyDelayTrend {
  month?: string | null;
  total_flights?: number;
  delayed_flights?: number;
  delay_rate?: number;
}

export interface HourlyDelayTrend {
  dep_hour?: number;
  total_flights?: number;
  delayed_flights?: number;
  delay_rate?: number;
}

export interface DelayCause {
  rank: number;
  delay_cause?: string | null;
  total_delays?: number;
  percentage?: number;
}


/* =========================================================
   Airline + Route Analytics
   ========================================================= */

export interface AirlineRouteAnalytics {
  airline_code?: string | null;

  origin_code?: string | null;
  destination_code?: string | null;

  total_flights?: number;
  operated_flights?: number;

  cancelled_flights?: number;
  diverted_flights?: number;

  delayed_flights?: number;
  severe_delay_flights?: number;

  delay_rate?: number;
  severe_delay_rate?: number;

  average_departure_delay?: number | null;
  average_arrival_delay?: number | null;
  max_arrival_delay?: number | null;
}


/* =========================================================
   Prediction
   ========================================================= */

export interface HistoricalRates {
  routeDelayRate: number | null;
  hourlyDelayRate: number | null;
}

export type DelayLabel = 'DELAYED' | 'ON_TIME';

export interface PredictionFeatures {
  originAirportId: number;
  destAirportId: number;
  airlineId: number;

  depHour: number;

  routeDelayRate: number | null;
  hourlyDelayRate: number | null;

  dayOfWeek: number;
}

export interface Prediction {
  score: number;
  label: DelayLabel;
  modelVersion: string;
}

export interface PredictionResult extends Prediction {
  historical: HistoricalRates;
}

export interface PredictionRequest {
  originAirportId: number;
  destAirportId: number;
  airlineId: number;

  scheduledDepartureTime: string;
  flightDate: string;
}


/* =========================================================
   API Query Parameters
   ========================================================= */

export interface RouteQuery {
  origin: string;
}

export interface FlightQuery {
  flight_date: string;
  origin: string;
  destination: string;
}

export interface AirlineAnalyticsQuery {
  airline: string;
}

export interface RouteAnalyticsQuery {
  origin: string;
  destination: string;
}

export interface AirportAnalyticsQuery {
  airport: string;
}

export interface AirlineRouteAnalyticsQuery {
  airline: string;
  origin: string;
  destination: string;
}