import { describe, expect, it } from 'vitest';
import { TRAINING_WINDOW_START, TRAINING_WINDOW_END, TEST_WINDOW_START, TEST_WINDOW_END } from '../../src/etl/training-window.js';

describe('training window boundary', () => {
  it('defines a contiguous, non-overlapping train/test split', () => {
    expect(TRAINING_WINDOW_START < TRAINING_WINDOW_END).toBe(true);
    expect(TEST_WINDOW_START).toBe(TRAINING_WINDOW_END);
    expect(TEST_WINDOW_START < TEST_WINDOW_END).toBe(true);
  });

  it('stays within the discovered dataset range (2025-01-01 to 2025-10-31)', () => {
    expect(TRAINING_WINDOW_START >= '2025-01-01').toBe(true);
    expect(TEST_WINDOW_END <= '2025-11-01').toBe(true);
  });
});
