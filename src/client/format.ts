// Presentation-only formatting. Rates cross the API as fractions (0-1); turning
// them into percentages happens here and nowhere else, so the conversion factor
// appears exactly once in the client.

/** 0.1834 -> "18.3%". */
export function percent(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

/** 402995 -> "402,995". */
export function count(value: number): string {
  return value.toLocaleString();
}

/** 0 -> "00:00", 14 -> "14:00". Departure-hour buckets, not clock times. */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** Renders an airport as "JFK - New York, NY", or just "JFK" when city is absent. */
export function airportLabel(code: string, cityName?: string | null): string {
  return cityName ? `${code} - ${cityName}` : code;
}

/** Placeholder shown in a metric slot whose value has not arrived yet. */
export const PENDING = '—';
