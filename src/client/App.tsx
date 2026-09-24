import { useState } from 'react';
import type {
  Airline,
  Airport,
  PredictionRequest,
  PredictionResult,
} from '../types';

import AboutPanel from './components/AboutPanel';
import DashboardCard from './components/DashboardCard';
import DataTable, { type Column } from './components/DataTable';
import ErrorBanner from './components/ErrorBanner';
import FilterPanel, { type Filters } from './components/FilterPanel';
import Header from './components/Header';
import PredictionForm from './components/PredictionForm';
import PredictionPanel from './components/PredictionPanel';
import { useApiResource } from './hooks/useApiResource';
import { PENDING, count, percent } from './format';

import {
  fetchAirlines,
  fetchAirports,
  fetchAirlineAnalytics,
  fetchAirportAnalytics,
  submitPrediction,
} from './services/api';

const NO_AIRLINES: Airline[] = [];
const NO_AIRPORTS: Airport[] = [];
const NO_ANALYTICS: any[] = [];

const NO_FILTERS: Filters = {
  airlineId: undefined,
  originId: undefined,
  congestionAirportId: undefined,
};

const analyticsColumns: Column<any>[] = [
  {
    label: 'Metric',
    render: row => row.metric ?? row.name ?? row.label ?? '—',
  },
  {
    label: 'Value',
    render: row => row.value ?? row.rate ?? row.count ?? '—',
    numeric: true,
  },
];

export default function App() {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const airports = useApiResource(
    fetchAirports,
    NO_AIRPORTS,
    []
  );

  const airlines = useApiResource(
    fetchAirlines,
    NO_AIRLINES,
    []
  );

  const airlineAnalytics = useApiResource(
    () => {
      if (filters.airlineId === undefined) {
        return Promise.resolve(NO_ANALYTICS);
      }

      const airline = airlines.data.find(
        item => item.airline_id === filters.airlineId
      );

      if (!airline) {
        return Promise.resolve(NO_ANALYTICS);
      }

      return fetchAirlineAnalytics(airline.airline_code);
    },
    NO_ANALYTICS,
    [filters.airlineId, airlines.data]
  );

  const airportAnalytics = useApiResource(
    () => {
      if (filters.congestionAirportId === undefined) {
        return Promise.resolve(NO_ANALYTICS);
      }

      const airport = airports.data.find(
        item => item.airport_id === filters.congestionAirportId
      );

      if (!airport) {
        return Promise.resolve(NO_ANALYTICS);
      }

      return fetchAirportAnalytics(airport.airport_code);
    },
    NO_ANALYTICS,
    [filters.congestionAirportId, airports.data]
  );

  const dimensionsLoading = airports.loading || airlines.loading;

  const handlePredict = async (request: PredictionRequest) => {
    setIsPredicting(true);
    setPredictionError(null);

    try {
      const result = await submitPrediction(request);
      setPrediction(result);
    } catch (cause) {
      setPrediction(null);
      setPredictionError(
        cause instanceof Error
          ? cause.message
          : 'Prediction failed'
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const airlineData = airlineAnalytics.data;
  const airportData = airportAnalytics.data;

  const airlineDelayRate =
    airlineData?.delay_rate ??
    airlineData?.delayRate ??
    undefined;

  const airportDelayRate =
    airportData?.delay_rate ??
    airportData?.delayRate ??
    undefined;

  return (
    <div className="min-h-screen bg-bg">
      <Header subtitle="Historical delay analytics and departure risk prediction" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <ErrorBanner
          errors={[
            airports.error,
            airlines.error,
            airlineAnalytics.error,
            airportAnalytics.error,
          ]}
        />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

          <DashboardCard
            title="Airlines"
            value={
              airlines.loading
                ? PENDING
                : count(airlines.data.length)
            }
            description="Airlines in database"
            color="blue"
          />

          <DashboardCard
            title="Airports"
            value={
              airports.loading
                ? PENDING
                : count(airports.data.length)
            }
            description="Airports in database"
            color="yellow"
          />

          <DashboardCard
            title="Airline delay rate"
            value={
              airlineDelayRate === undefined
                ? PENDING
                : percent(airlineDelayRate)
            }
            description={
              filters.airlineId === undefined
                ? 'Select an airline'
                : 'Selected airline'
            }
            color="purple"
          />

          <DashboardCard
            title="Airport delay rate"
            value={
              airportDelayRate === undefined
                ? PENDING
                : percent(airportDelayRate)
            }
            description={
              filters.congestionAirportId === undefined
                ? 'Select an airport'
                : 'Selected airport'
            }
            color="green"
          />

        </div>

        <FilterPanel
          airports={airports.data}
          airlines={airlines.data}
          filters={filters}
          onChange={setFilters}
          disabled={dimensionsLoading}
        />

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">

          <div className="flex flex-col h-[550px]">
            <DataTable
              title="Airline analytics"
              columns={analyticsColumns}
              rows={airlineData ?? []}
              rowKey={(_, index) => `airline-${index}`}
              emptyMessage={
                airlineAnalytics.loading
                  ? 'Loading…'
                  : 'Select an airline to view analytics'
              }
            />
          </div>

          <div className="flex flex-col h-[550px]">
            <DataTable
              title="Airport analytics"
              columns={analyticsColumns}
              rows={airportData ?? []}
              rowKey={(_, index) => `airport-${index}`}
              emptyMessage={
                airportAnalytics.loading
                  ? 'Loading…'
                  : 'Select an airport to view analytics'
              }
            />
          </div>

        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">

          <PredictionForm
            airports={airports.data}
            airlines={airlines.data}
            onSubmit={handlePredict}
            isLoading={isPredicting}
            disabled={dimensionsLoading}
          />

          <PredictionPanel
            result={prediction}
            error={predictionError}
            isLoading={isPredicting}
          />

        </div>

        <AboutPanel />

      </main>

      <footer className="mt-8 border-t border-line bg-surface py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-ink-dim sm:px-6 lg:px-8">

          <p>
            FlyWise Flight Delay Intelligence Platform — INF2006 Group 12
          </p>

          <p className="mt-1 font-mono text-ink-dim/70">
            {airlines.loading || airports.loading
              ? 'Loading database information…'
              : `${airlines.data.length} airlines across ${airports.data.length} airports`}
          </p>

        </div>
      </footer>
    </div>
  );
}
