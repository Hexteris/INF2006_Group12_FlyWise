import type { Dims, LiveFilters } from '../trip';
import DimSelect from './DimSelect';

interface Props {
  filters: LiveFilters;
  onChange: (f: LiveFilters) => void;
  dims: Dims | null;
  loading: boolean;
  onLoad: () => void;
}

export default function FilterPanel({
  filters,
  onChange,
  dims,
  loading,
  onLoad,
}: Props) {
  const patch = (p: Partial<LiveFilters>) =>
    onChange({ ...filters, ...p });

  const box =
    'w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-normal text-slate-900 cursor-pointer focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30';

  const inputBox =
    'w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30';

  const labelClass = 'font-medium text-ink';

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">

      {/* Flight number */}
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>
          Flight number
        </span>

        <input
          className={inputBox}
          placeholder="e.g. AA1234"
          value={filters.flightNumber}
          onChange={(e) =>
            patch({ flightNumber: e.target.value })
          }
        />
      </label>

      {/* Airline */}
      <DimSelect
        label="Airline"
        value={filters.airline}
        options={dims?.airlines ?? []}
        onChange={(v) => patch({ airline: v })}
      />

      {/* Airport */}
      <DimSelect
        label="Airport"
        value={filters.airport}
        options={dims?.airports ?? []}
        placeholder="Select airport"
        onChange={(v) => patch({ airport: v })}
      />

      {/* Direction */}
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>
          Direction
        </span>

        <select
          className={box}
          value={filters.direction}
          onChange={(e) =>
            patch({
              direction:
                e.target.value as LiveFilters['direction'],
            })
          }
        >
          <option value="Departure">
            Departures
          </option>

          <option value="Arrival">
            Arrivals
          </option>
        </select>
      </label>

      {/* Date */}
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>
          Date
        </span>

        <input
          type="date"
          className={inputBox}
          value={filters.date}
          onChange={(e) =>
            patch({ date: e.target.value })
          }
        />
      </label>

      {/* Load flights */}
      <button
        onClick={onLoad}
        disabled={loading}
        className="w-full rounded-md bg-amber px-4 py-2 font-semibold text-bg transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Load flights'}
      </button>
    </div>
  );
}