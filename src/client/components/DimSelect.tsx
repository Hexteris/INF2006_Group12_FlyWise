import { useId, useState, memo, useCallback } from 'react';
import type { DimRow } from '../../types';
import { airportLabel } from '../format';
import { FIELD_CLASSES, FIELD_LABEL, SKELETON_CLASSES, FOCUS_VISIBLE } from '../styles';

interface DimSelectProps {
  label: string;
  options: DimRow[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  /** Text for the empty option: "All airlines" when filtering, "Select…" when required. */
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  /** Description for screen readers */
  description?: string;
}

/**
 * Enhanced dropdown with improved UX, accessibility, and loading states.
 * Features keyboard navigation, custom focus styles, and skeleton loading.
 */
function DimSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  isLoading = false,
  description,
}: DimSelectProps) {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value ? Number(event.target.value) : undefined);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption ? airportLabel(selectedOption.code, selectedOption.cityName) : placeholder;

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-2">
        <label 
          htmlFor={id} 
          className={`${FIELD_LABEL} flex items-center gap-2 transition-colors duration-200 ${isFocused ? 'text-amber' : ''}`}
        >
          {label}
          {required && (
            <span className="text-bad text-xs font-normal" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {isLoading && (
          <div 
            className={`${SKELETON_CLASSES} w-16 h-3 rounded-full`}
            aria-label="Loading options"
          />
        )}
      </div>

      {/* Custom styled select wrapper */}
      <div className="relative">
        <select
          id={id}
          required={required}
          disabled={disabled || isLoading}
          value={value ?? ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            ${FIELD_CLASSES} 
            appearance-none cursor-pointer disabled:cursor-not-allowed
            pr-10 relative z-10 bg-transparent
            transition-all duration-250
            ${isFocused ? 'ring-3 ring-amber/30 ring-offset-1 ring-offset-surface' : ''}
            ${value ? 'text-ink font-medium' : 'text-ink-dim'}
            hover:border-amber/50 hover:bg-surface-raised/90
            ${FOCUS_VISIBLE}
          `}
          aria-label={label}
          aria-describedby={description ? `${id}-description` : undefined}
          aria-busy={isLoading}
        >
          <option value="" className="text-ink-dim bg-surface">
            {placeholder}
          </option>
          {!isLoading && options.map(option => (
            <option 
              key={option.id} 
              value={option.id}
              className="text-ink bg-surface py-2"
            >
              {airportLabel(option.code, option.cityName)}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div 
          className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-20
            transition-transform duration-250 ${isFocused ? 'rotate-180' : ''}
            ${disabled ? 'opacity-40' : 'opacity-70'}
          `}
          aria-hidden="true"
        >
          <svg 
            className="w-5 h-5 text-ink-dim" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Loading indicator overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-raised/80 rounded-lg z-30">
            <div className="flex items-center gap-2 text-ink-dim text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-amber/30 border-t-amber rounded-full" />
              Loading options...
            </div>
          </div>
        )}

        {/* Selected value display for better UX */}
        {!isLoading && value && (
          <div 
            className={`
              absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-0
              text-sm text-ink-dim/70 bg-surface/50 px-1.5 py-0.5 rounded
              transition-all duration-200 ${isFocused ? 'opacity-0' : 'opacity-100'}
            `}
            aria-hidden="true"
          >
            {displayValue}
          </div>
        )}
      </div>

      {/* Description for screen readers */}
      {description && (
        <p id={`${id}-description`} className="sr-only">
          {description}
        </p>
      )}

      {/* Value indicator for better UX */}
      {!isLoading && value && (
        <div className="mt-2 flex items-center justify-between text-xs text-ink-dim/60">
          <span className="truncate max-w-[200px]">
            Selected: <span className="font-medium text-ink/80">{displayValue}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={`
              text-xs px-2 py-1 rounded border border-line bg-surface
              transition-all duration-200 hover:bg-surface-raised hover:border-ink-dim/40
              focus:outline-none focus:ring-1 focus:ring-amber/40
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
            disabled={disabled}
            aria-label={`Clear ${label} selection`}
          >
            Clear
          </button>
        </div>
      )}

      {/* Skeleton loading for options */}
      {isLoading && options.length === 0 && (
        <div className="mt-2 space-y-1">
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className={`${SKELETON_CLASSES} h-4 rounded`}
              style={{ width: `${60 + (i * 10)}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Focus outline for better accessibility */}
      <div className="absolute inset-0 pointer-events-none border-2 border-transparent rounded-lg group-focus-within:border-amber/30 transition-colors duration-200" />
    </div>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(DimSelect, (prevProps, nextProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.options === nextProps.options &&
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.required === nextProps.required &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isLoading === nextProps.isLoading
  );
});
