import { describe, expect, it } from 'vitest';
import { totalFlights, monthsCovered, weightedDelayRate } from './analytics';
import type { MonthlyTrendRow } from '../types';

describe('analytics helpers', () => {
  const empty: MonthlyTrendRow[] = [];

  it('totalFlights returns 0 for empty array', () => {
    expect(totalFlights(empty)).toBe(0);
  });

  it('totalFlights sums total_flights across rows', () => {
    const rows = [
      { month: 'Jan', total_flights: 100, delay_rate: 0.2, avg_delay: null },
      { month: 'Feb', total_flights: 150, delay_rate: 0.3, avg_delay: null },
    ];
    expect(totalFlights(rows)).toBe(250);
  });

  it('monthsCovered returns row count', () => {
    expect(monthsCovered(empty)).toBe(0);
    const rows = [
      { month: 'Jan', total_flights: 100, delay_rate: 0.2, avg_delay: null },
      { month: 'Feb', total_flights: 150, delay_rate: 0.3, avg_delay: null },
      { month: 'Mar', total_flights: 80, delay_rate: 0.15, avg_delay: null },
    ];
    expect(monthsCovered(rows)).toBe(3);
  });

  it('weightedDelayRate returns 0 for empty array', () => {
    expect(weightedDelayRate(empty)).toBe(0);
  });

  it('weightedDelayRate returns 0 when total flights is zero', () => {
    const rows = [
      { month: 'Jan', total_flights: 0, delay_rate: 0.2, avg_delay: null },
      { month: 'Feb', total_flights: 0, delay_rate: 0.3, avg_delay: null },
    ];
    expect(weightedDelayRate(rows)).toBe(0);
  });

  it('weightedDelayRate correctly weights by flight volume', () => {
    const rows = [
      { month: 'Jan', total_flights: 100, delay_rate: 0.2, avg_delay: null },
      { month: 'Feb', total_flights: 300, delay_rate: 0.3, avg_delay: null },
    ];
    // (100*0.2 + 300*0.3) / 400 = (20 + 90) / 400 = 110/400 = 0.275
    expect(weightedDelayRate(rows)).toBeCloseTo(0.275);
  });

  it('weightedDelayRate differs from naive mean of delay_rate', () => {
    const rows = [
      { month: 'Jan', total_flights: 100, delay_rate: 0.2, avg_delay: null },
      { month: 'Feb', total_flights: 300, delay_rate: 0.3, avg_delay: null },
    ];
    const naiveMean = (0.2 + 0.3) / 2; // 0.25
    expect(weightedDelayRate(rows)).not.toBe(naiveMean);
  });
});