import type { DimRow } from '../../types';
import DimSelect from './DimSelect';
import { ACCENT_BORDER, PANEL, PANEL_PADDING, SECTION_HEADING } from '../styles';

export interface Filters {
  airlineId: number | undefined;
  originId: number | undefined;
  congestionAirportId: number | undefined;
}

interface FilterPanelProps {
  airports: DimRow[];
  airlines: DimRow[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  disabled?: boolean;
}

/**
 * Filter controls for the two tables below them.
 *
 * Every change here re-queries the server rather than filtering a pre-fetched
 * blob in the browser: the aggregate tables hold thousands of rows and the API
 * already accepts these exact filters.
 */
export default function FilterPanel({
  airports,
  airlines,
  filters,
  onChange,
  disabled = false,
}: FilterPanelProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <section className={`${PANEL} ${ACCENT_BORDER.slate} ${PANEL_PADDING} mb-8`}>
      <div className="mb-4 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-ink-dim"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
          />
        </svg>
        <h2 className={SECTION_HEADING}>Filters</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DimSelect
          label="Airline"
          placeholder="All airlines"
          options={airlines}
          value={filters.airlineId}
          onChange={airlineId => update({ airlineId })}
          disabled={disabled}
        />
        <DimSelect
          label="Origin airport"
          placeholder="All origins"
          options={airports}
          value={filters.originId}
          onChange={originId => update({ originId })}
          disabled={disabled}
        />
        <DimSelect
          label="Congestion airport"
          placeholder="All airports"
          options={airports}
          value={filters.congestionAirportId}
          onChange={congestionAirportId => update({ congestionAirportId })}
          disabled={disabled}
        />
      </div>
    </section>
  );
}
