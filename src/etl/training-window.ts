// Single source of truth for the temporal train/test split boundary.
// Shared by Task 5 (feature aggregates) and Task 7 (model training) so
// aggregate features and model evaluation never disagree on where the
// training window ends.
//
// Full dataset spans 2025-01-01 to 2025-10-31 (discovered in Task 4).
// Training window: 2025-01-01 through 2025-08-31 (8 months).
// Held-out test period: 2025-09-01 through 2025-10-31 (2 months).
// This is a fixed boundary, not a random split - flights on or after this
// date must never contribute to aggregate rates or training data.

export const TRAINING_WINDOW_START = '2025-01-01';
export const TRAINING_WINDOW_END = '2025-09-01'; // exclusive: flight_date < this

export const TEST_WINDOW_START = TRAINING_WINDOW_END;
export const TEST_WINDOW_END = '2025-11-01'; // exclusive
