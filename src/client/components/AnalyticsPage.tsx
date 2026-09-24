import type { Column } from './DataTable';
import DataTable from './DataTable';
import ErrorBanner from './ErrorBanner';
import { useApiResource } from '../hooks/useApiResource';
import { count } from '../format';
import {
  fetchDelayCauses,
  fetchHourlyDelayTrends,
  fetchMonthlyDelayTrends,
} from '../services/api';
import type { DelayCauseRow, HourlyTrendRow, MonthlyTrendRow } from '../../types';

const EMPTY_MONTHS: MonthlyTrendRow[] = [];
const EMPTY_HOURS: HourlyTrendRow[] = [];
const EMPTY_CAUSES: DelayCauseRow[] = [];

const monthColumns: Column<MonthlyTrendRow>[] = [
  { label: 'Month', render: row => row.month },
  { label: 'Flights', render: row => count(row.total_flights), numeric: true },
  { label: 'Delay rate', render: row => `${Number(row.delay_rate).toFixed(1)}%`, numeric: true },
  { label: 'Average delay', render: row => row.avg_delay == null ? '—' : `${Number(row.avg_delay).toFixed(1)} min`, numeric: true },
];

const hourColumns: Column<HourlyTrendRow>[] = [
  { label: 'Departure hour', render: row => row.departure_hour },
  { label: 'Flights', render: row => count(row.total_flights), numeric: true },
  { label: 'Delay rate', render: row => `${Number(row.delay_rate).toFixed(1)}%`, numeric: true },
  { label: 'Average delay', render: row => row.avg_delay == null ? '—' : `${Number(row.avg_delay).toFixed(1)} min`, numeric: true },
];

const causeColumns: Column<DelayCauseRow>[] = [
  { label: 'Rank', render: row => row.rank, numeric: true },
  { label: 'Cause', render: row => row.delay_cause },
  { label: 'Delay hours', render: row => Number(row.delay_hours).toFixed(1), numeric: true },
  { label: 'Share of delay', render: row => `${Number(row.delay_percentage).toFixed(1)}%`, numeric: true },
];

export default function AnalyticsPage() {
  const months = useApiResource(fetchMonthlyDelayTrends, EMPTY_MONTHS, [], 'analytics-months');
  const hours = useApiResource(fetchHourlyDelayTrends, EMPTY_HOURS, [], 'analytics-hours');
  const causes = useApiResource(fetchDelayCauses, EMPTY_CAUSES, [], 'analytics-causes');

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber">Intelligence</p>
        <h2 className="text-3xl font-bold tracking-tight text-ink">Delay analytics</h2>
        <p className="mt-2 text-ink-dim">Understand when delays happen and what is driving them across the network.</p>
      </div>

      <ErrorBanner errors={[months.error, hours.error, causes.error]} />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="h-[430px]">
          <DataTable title="Monthly delay trend" columns={monthColumns} rows={months.data} rowKey={row => row.month} emptyMessage={months.loading ? 'Loading monthly trends…' : 'No monthly data'} />
        </div>
        <div className="h-[430px]">
          <DataTable title="Delay by departure hour" columns={hourColumns} rows={hours.data} rowKey={row => row.departure_hour} emptyMessage={hours.loading ? 'Loading hourly trends…' : 'No hourly data'} />
        </div>
        <div className="h-[430px] xl:col-span-2">
          <DataTable title="Delay causes" columns={causeColumns} rows={causes.data} rowKey={row => row.delay_cause} emptyMessage={causes.loading ? 'Loading delay causes…' : 'No delay cause data'} />
        </div>
      </div>
    </main>
  );
}
