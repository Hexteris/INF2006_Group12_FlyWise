// The model seam. This is the ONLY file the ML teammate needs to replace:
// keep the `predict` signature and everything upstream (route, queries, client)
// keeps working unchanged.
//
// `PredictionFeatures` contains no post-departure fields (no dep_delay,
// arr_delay, actual times), so it cannot leak the target into a prediction.
import type { PredictionFeatures, Prediction } from '../types.js';

/** Rate at or above which the baseline calls a flight delayed. */
const DELAY_THRESHOLD = 0.3;

export const MODEL_VERSION = 'baseline-v1';

/**
 * Baseline heuristic, not a trained model: take the worse of the route's and the
 * departure hour's historical delay rate and compare it to DELAY_THRESHOLD.
 *
 * `score` is confidence in the label it returned, not probability of delay, so
 * it is always >= 0.5 at the extremes and reads correctly in the UI either way.
 *
 * `dayOfWeek` is supplied but intentionally unused here: it is a real signal
 * that a trained model should consume, so the feature is plumbed through the
 * route and kept in the contract rather than being wired up later.
 */
export function predict(features: PredictionFeatures): Prediction {
  // A missing history is treated as no evidence of risk rather than as risk.
  const routeRisk = features.routeDelayRate ?? 0;
  const hourRisk = features.hourlyDelayRate ?? 0;
  const risk = Math.max(routeRisk, hourRisk);

  const delayed = risk > DELAY_THRESHOLD;

  return {
    score: delayed ? risk : 1 - risk,
    label: delayed ? 'DELAYED' : 'ON_TIME',
    modelVersion: MODEL_VERSION,
  };
}
