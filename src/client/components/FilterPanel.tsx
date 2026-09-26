import { useState, useCallback, memo } from 'react';
import type { DimRow } from '../../types';
import DimSelect from './DimSelect';
import { ACCENT_BORDER, PANEL, PANEL_PADDING, SECTION_HEADING, BUTTON_SECONDARY, GRID_FORM, MOBILE_ONLY, DESKTOP_ONLY } from '../styles';

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
  isLoading?: boolean;
}

/**
 * Enhanced filter controls with improved UX, visual feedback, and mobile responsiveness.
 * Features clear all filters button, active filter indicators, and loading states.
 */
function FilterPanel({
  airports,
  airlines,
  filters,
  onChange,
  disabled = false,
  isLoading = false,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Calculate active filters for visual indicators
  const updateActiveFilters = useCallback((newFilters: Filters) => {
    const active = [];
    if (newFilters.airlineId !== undefined) active.push('Airline');
    if (newFilters.originId !== undefined) active.push('Origin');
    if (newFilters.congestionAirportId !== undefined) active.push('Congestion');
    setActiveFilters(active);
  }, []);

  const handleChange = useCallback((patch: Partial<Filters>) => {
    const newFilters = { ...filters, ...patch };
    onChange(newFilters);
    updateActiveFilters(newFilters);
  }, [filters, onChange, updateActiveFilters]);

  const handleClearAll = useCallback(() => {
    const newFilters = {
      airlineId: undefined,
      originId: undefined,
      congestionAirportId: undefined,
    };
    onChange(newFilters);
    setActiveFilters([]);
  }, [onChange]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <section 
      className={`${PANEL} ${ACCENT_BORDER.slate} ${PANEL_PADDING} mb-8 transition-all duration-300 hover:shadow-xl`}
      role="search"
      aria-label="Data filters"
    >
      {/* Enhanced header with filter status */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="h-6 w-6 text-ink-dim transition-colors duration-300 group-hover:text-amber"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber rounded-full animate-pulse" aria-hidden="true" />
            )}
          </div>
          <div>
            <h2 className={`${SECTION_HEADING} flex items-center gap-2`}>
              Filters
              {hasActiveFilters && (
                <span className="text-xs font-normal bg-amber/20 text-amber px-2 py-1 rounded-full animate-bounce">
                  {activeFilters.length} active
                </span>
              )}
            </h2>
            <p className="text-sm text-ink-dim mt-1">
              Filter data by airline, origin, or congestion airport
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`${BUTTON_SECONDARY} ${MOBILE_ONLY} text-sm px-3 py-2`}
              disabled={disabled || isLoading}
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleExpand}
            className={`${BUTTON_SECONDARY} ${DESKTOP_ONLY} text-sm px-3 py-2`}
            aria-expanded={isExpanded}
            aria-controls="filter-content"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mb-6 p-4 rounded-xl bg-surface-raised/50 border border-line/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-ink">Active filters</h3>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-ink-dim hover:text-ink transition-colors duration-200"
              disabled={disabled || isLoading}
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <span
                key={filter}
                className="inline-flex items-center gap-1.5 bg-amber/10 text-amber px-3 py-1.5 rounded-lg text-sm font-medium border border-amber/20"
              >
                {filter}
                <button
                  type="button"
                  onClick={() => {
                    if (filter === 'Airline') handleChange({ airlineId: undefined });
                    if (filter === 'Origin') handleChange({ originId: undefined });
                    if (filter === 'Congestion') handleChange({ congestionAirportId: undefined });
                  }}
                  className="text-amber/70 hover:text-amber transition-colors duration-200"
                  aria-label={`Remove ${filter} filter`}
                  disabled={disabled || isLoading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter controls - always visible on desktop, expandable on mobile */}
      <div 
        id="filter-content"
        className={`
          ${GRID_FORM} 
          transition-all duration-300 overflow-hidden
          ${isExpanded || window.innerWidth >= 768 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 md:max-h-[500px] md:opacity-100'}
        `}
        aria-hidden={!isExpanded && window.innerWidth < 768}
      >
        <DimSelect
          label="Airline"
          placeholder="All airlines"
          options={airlines}
          value={filters.airlineId}
          onChange={airlineId => handleChange({ airlineId })}
          disabled={disabled}
          isLoading={isLoading}
          description="Select an airline to filter by"
        />
        <DimSelect
          label="Origin airport"
          placeholder="All origins"
          options={airports}
          value={filters.originId}
          onChange={originId => handleChange({ originId })}
          disabled={disabled}
          isLoading={isLoading}
          description="Select an origin airport to filter by"
        />
        <DimSelect
          label="Congestion airport"
          placeholder="All airports"
          options={airports}
          value={filters.congestionAirportId}
          onChange={congestionAirportId => handleChange({ congestionAirportId })}
          disabled={disabled}
          isLoading={isLoading}
          description="Select an airport for congestion analysis"
        />
      </div>

      {/* Mobile expand/collapse button */}
      <button
        type="button"
        onClick={handleToggleExpand}
        className={`${BUTTON_SECONDARY} ${MOBILE_ONLY} w-full mt-4 justify-center`}
        aria-expanded={isExpanded}
        aria-controls="filter-content"
      >
        <span className="flex items-center gap-2">
          {isExpanded ? (
            <>
              <span>Show less filters</span>
              <span aria-hidden="true">↑</span>
            </>
          ) : (
            <>
              <span>Show all filters</span>
              <span aria-hidden="true">↓</span>
            </>
          )}
        </span>
      </button>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-3 border-amber/30 border-t-amber rounded-full mx-auto mb-4" />
            <p className="text-ink font-medium">Loading filter options...</p>
          </div>
        </div>
      )}
    </section>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(FilterPanel, (prevProps, nextProps) => {
  return (
    prevProps.airports === nextProps.airports &&
    prevProps.airlines === nextProps.airlines &&
    prevProps.filters === nextProps.filters &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isLoading === nextProps.isLoading
  );
});
