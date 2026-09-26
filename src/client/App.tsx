// Dashboard composition. This file wires data sources to presentation and holds
// no fetching, formatting, or SQL-shaped logic of its own:
//
//   requests            src/client/services/api.ts
//   load/error state    src/client/hooks/useApiResource.ts
//   value formatting    src/client/format.ts
//   markup              src/client/components/*
//
// Changing what a table displays means editing one `columns` array below.
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import type {
  CongestionRow,
  DimRow,
  PredictionRequest,
  PredictionResult,
  RoutePerformanceRow,
  Summary,
} from '../types';
import AboutPanel from './components/AboutPanel';
import DashboardCard from './components/DashboardCard';
import DataTable, { type Column } from './components/DataTable';
import ErrorBanner from './components/ErrorBanner';
import FilterPanel, { type Filters } from './components/FilterPanel';
import Header, { type AppView } from './components/Header';
import AnalyticsPage from './components/AnalyticsPage';
import FlightSearchPage from './components/FlightSearchPage';
import LiveFlightsPage from './components/LiveFlightsPage';
import PredictionForm from './components/PredictionForm';
import PredictionPanel from './components/PredictionPanel';
import AuthModal from './components/AuthModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import { useApiResource } from './hooks/useApiResource';
import { PENDING, count, hourLabel, percent } from './format';
import {
  fetchAirlines,
  fetchAirports,
  fetchCongestion,
  fetchRoutePerformance,
  fetchSummary,
  submitPrediction,
} from './services/api';

// Module-level constants: stable references, so they never look like changed
// state to a dependency comparison.
const NO_DIMS: DimRow[] = [];
const NO_ROUTES: RoutePerformanceRow[] = [];
const NO_CONGESTION: CongestionRow[] = [];

const ROUTE_LIMIT = 10;
/** One full day of hourly buckets. */
const CONGESTION_LIMIT = 24;

const NO_FILTERS: Filters = {
  airlineId: undefined,
  originId: undefined,
  congestionAirportId: undefined,
};

/** Above this rate the headline metric is shown as a problem rather than a fact. */
const ELEVATED_DELAY_RATE = 0.2;

const routeColumns: Column<RoutePerformanceRow>[] = [
  { label: 'Airline', render: row => row.airlineCode },
  { label: 'Origin', render: row => row.originCode },
  { label: 'Destination', render: row => row.destCode },
  { label: 'Flights', render: row => count(row.flightCount), numeric: true },
  { label: 'Delay rate', render: row => percent(row.delayRate), numeric: true },
];

const congestionColumns: Column<CongestionRow>[] = [
  { label: 'Airport', render: row => row.airportCode },
  { label: 'Departure hour', render: row => hourLabel(row.depHour) },
  { label: 'Flights', render: row => count(row.flightCount), numeric: true },
  { label: 'Delay rate', render: row => percent(row.delayRate), numeric: true },
];

function AppContent() {
  const [activeView, setActiveView] = useState<AppView>('overview');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Auth context for modals
  const {
    isAuthModalOpen,
    isSettingsModalOpen,
    closeSettingsModal,
  } = useAuth();

  // Loaded once: headline figures and the dropdown sources.
  const overviewEnabled = activeView === 'overview';
  const summary = useApiResource<Summary | null>(fetchSummary, null, [], 'summary', overviewEnabled);
  const airports = useApiResource(fetchAirports, NO_DIMS, [], 'airports', overviewEnabled);
  const airlines = useApiResource(fetchAirlines, NO_DIMS, [], 'airlines', overviewEnabled);

  // Re-queried server-side whenever the relevant filter changes.
  const routes = useApiResource(
    () =>
      fetchRoutePerformance({
        airlineId: filters.airlineId,
        originId: filters.originId,
        limit: ROUTE_LIMIT,
      }),
    NO_ROUTES,
    [filters.airlineId, filters.originId],
    `routes-${filters.airlineId ?? 'all'}-${filters.originId ?? 'all'}`,
    overviewEnabled
  );

  const congestion = useApiResource(
    () => fetchCongestion({ airportId: filters.congestionAirportId, limit: CONGESTION_LIMIT }),
    NO_CONGESTION,
    [filters.congestionAirportId],
    `congestion-${filters.congestionAirportId ?? 'all'}`,
    overviewEnabled
  );

  const dimensionsLoading = airports.loading || airlines.loading;

  const handlePredict = async (request: PredictionRequest) => {
    setIsPredicting(true);
    setPredictionError(null);
    try {
      setPrediction(await submitPrediction(request));
    } catch (cause) {
      setPrediction(null);
      setPredictionError(cause instanceof Error ? cause.message : 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const avgDelayRate = summary.data?.avgDelayRate;

  return (
    <div className="min-h-screen bg-bg">
      <Header
        subtitle="Historical delay analytics and departure risk prediction"
        activeView={activeView}
        onNavigate={setActiveView}
      />

      {activeView === 'flights' ? (
        <FlightSearchPage />
      ) : activeView === 'live' ? (
        <LiveFlightsPage />
      ) : activeView === 'analytics' ? (
        <AnalyticsPage />
      ) : (
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <ErrorBanner
          errors={[summary.error, airports.error, airlines.error, routes.error, congestion.error]}
        />

        {/* Enhanced dashboard cards with skeleton loading */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-in-left">
          <DashboardCard
            title="Flights analysed"
            value={summary.data ? count(summary.data.totalFlights) : PENDING}
            description="Within the training window"
            color="blue"
            isLoading={summary.loading}
            loadingWidth={70}
          />
          <DashboardCard
            title="Average delay rate"
            value={avgDelayRate === undefined ? PENDING : percent(avgDelayRate)}
            description="Weighted by flight volume"
            color={avgDelayRate !== undefined && avgDelayRate > ELEVATED_DELAY_RATE ? 'red' : 'green'}
            isLoading={summary.loading}
            loadingWidth={60}
          />
          <DashboardCard
            title="Routes tracked"
            value={summary.data ? count(summary.data.routeCount) : PENDING}
            description="Route and airline combinations"
            color="purple"
            isLoading={summary.loading}
            loadingWidth={65}
          />
          <DashboardCard
            title="Airports"
            value={summary.data ? count(summary.data.airportCount) : PENDING}
            description={summary.data ? `${count(summary.data.airlineCount)} airlines` : undefined}
            color="yellow"
            isLoading={summary.loading}
            loadingWidth={55}
          />
        </div>

        {/* Enhanced filter panel with loading states */}
        <FilterPanel
          airports={airports.data}
          airlines={airlines.data}
          filters={filters}
          onChange={setFilters}
          disabled={dimensionsLoading}
          isLoading={dimensionsLoading}
        />

        {/* Enhanced data tables section */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2 animate-slide-in-right">
          <DataTable
            title="Busiest routes"
            columns={routeColumns}
            rows={routes.data}
            rowKey={row => `${row.airlineCode}-${row.originCode}-${row.destCode}`}
            emptyMessage={routes.loading ? 'Loading…' : 'No routes match these filters'}
            isLoading={routes.loading}
            loadingRows={5}
          />
          <DataTable
            title="Airport congestion by hour"
            columns={congestionColumns}
            rows={congestion.data}
            rowKey={row => `${row.airportCode}-${row.depHour}`}
            emptyMessage={congestion.loading ? 'Loading…' : 'No congestion data for this airport'}
            isLoading={congestion.loading}
            loadingRows={5}
          />
        </div>

        {/* Enhanced prediction section */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2 animate-fade-in">
          <PredictionForm
            airports={airports.data}
            airlines={airlines.data}
            onSubmit={handlePredict}
            isLoading={dimensionsLoading}
            disabled={dimensionsLoading}
            predictionInProgress={isPredicting}
          />
          <PredictionPanel
            result={prediction}
            error={predictionError}
            isLoading={isPredicting}
          />
        </div>

        <AboutPanel />
      </main>
      )}

      {/* Auth Modals */}
      {isAuthModalOpen && <AuthModal />}
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
      />

      <footer className="mt-8 border-t border-line bg-surface py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-ink-dim sm:px-6 lg:px-8">
          <p>FlyWise Flight Delay Intelligence Platform — INF2006 Group 12</p>
          {summary.data && (
            <p className="mt-1 font-mono text-ink-dim/70">
              {count(summary.data.totalFlights)} flights across{' '}
              {count(summary.data.routeCount)} routes
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
