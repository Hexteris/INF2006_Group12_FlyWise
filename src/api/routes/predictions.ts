// POST /api/predict - the only write-shaped endpoint.
//
// This file does three things and nothing else: validate the request, fetch the
// historical evidence, hand both to the model seam in src/ml/model.ts.
import { Router } from 'express';
import { z } from 'zod';
import { getHistoricalRates } from '../../db/queries.js';
import { predict } from '../../ml/model.js';
import { ok, badRequest, serverError } from '../respond.js';

const router = Router();

/**
 * Request schema. Ids are coerced because JSON may deliver them as either a
 * number or a string depending on the caller.
 */
const predictionRequestSchema = z.object({
  originAirportId: z.coerce.number().int().positive(),
  destAirportId: z.coerce.number().int().positive(),
  airlineId: z.coerce.number().int().positive(),
  // HHMM, e.g. "0800". Range-checked below, since the regex alone would admit
  // impossible clock values like "9999".
  scheduledDepartureTime: z
    .string()
    .regex(/^\d{4}$/, 'scheduledDepartureTime must be HHMM, e.g. "0800"')
    .refine(value => {
      const hour = Number(value.slice(0, 2));
      const minute = Number(value.slice(2));
      return hour <= 23 && minute <= 59;
    }, 'scheduledDepartureTime is not a valid time of day'),
  flightDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'flightDate must be YYYY-MM-DD')
    .refine(isRealCalendarDate, 'flightDate is not a real date'),
});

/**
 * Rejects calendar-invalid dates that still match the YYYY-MM-DD pattern, such
 * as 2025-02-30.
 *
 * Date.parse is not usable for this: given "2025-02-30T00:00:00Z" it does not
 * return NaN, it silently rolls the value over to 2025-03-02. So the components
 * are compared against what the Date actually became, and any normalisation
 * means the input was not a real date.
 */
function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const asDate = new Date(Date.UTC(year, month - 1, day));

  return (
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day
  );
}

router.post('/predict', async (req, res) => {
  const parsed = predictionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ');
    return badRequest(res, `Invalid prediction request - ${detail}`);
  }

  const { originAirportId, destAirportId, airlineId, scheduledDepartureTime, flightDate } =
    parsed.data;

  // HHMM -> hour bucket. The aggregates are keyed by hour, so minutes are dropped.
  const depHour = Number(scheduledDepartureTime.slice(0, 2));
  // getUTCDay, not getDay: the date string is parsed as UTC midnight, so the
  // local-time accessor would shift the weekday in negative-offset timezones.
  const dayOfWeek = new Date(`${flightDate}T00:00:00Z`).getUTCDay();

  try {
    const historical = await getHistoricalRates({
      originAirportId,
      destAirportId,
      airlineId,
      depHour,
    });

    const prediction = predict({
      originAirportId,
      destAirportId,
      airlineId,
      depHour,
      dayOfWeek,
      routeDelayRate: historical.routeDelayRate,
      hourlyDelayRate: historical.hourlyDelayRate,
    });

    // The evidence travels with the verdict so the UI can justify it rather than
    // asking the user to trust a bare label.
    ok(res, { ...prediction, historical });
  } catch (error) {
    serverError(res, 'Prediction', error);
  }
});

export default router;
