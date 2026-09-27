// Read-only aggregate endpoints. A thin HTTP layer over src/db/queries.ts:
// no SQL here, and no business logic beyond forwarding query parameters.
import { Router } from 'express';
import {
  getSummary,
  getRoutePerformance,
  getAirportCongestion,
  listAirports,
  listAirlines,
} from '../../db/queries.js';
import { ok, serverError } from '../respond.js';

const router = Router();

router.get('/summary', async (_req, res) => {
  try {
    ok(res, await getSummary());
  } catch (error) {
    serverError(res, 'Summary query', error);
  }
});

// Filters are passed through untouched; validation and clamping belong to the
// query layer, which is the only place that knows what is safe to inline.
router.get('/airlines', async (req, res) => {
  try {
    ok(res, await getRoutePerformance({
      airlineId: req.query.airlineId,
      originId: req.query.originId,
      limit: req.query.limit,
    }));
  } catch (error) {
    serverError(res, 'Route performance query', error);
  }
});

router.get('/airports/congestion', async (req, res) => {
  try {
    ok(res, await getAirportCongestion({
      airportId: req.query.airportId,
      limit: req.query.limit,
    }));
  } catch (error) {
    serverError(res, 'Congestion query', error);
  }
});

// Dropdown sources. '/airports' and '/airlines/list' sit alongside '/airlines'
// safely: Express matches exact paths, so '/airlines' never swallows the others.
router.get('/airports', async (_req, res) => {
  try {
    ok(res, await listAirports());
  } catch (error) {
    serverError(res, 'Airport list query', error);
  }
});

router.get('/airlines/list', async (_req, res) => {
  try {
    ok(res, await listAirlines());
  } catch (error) {
    serverError(res, 'Airline list query', error);
  }
});

export default router;
