// API router. Everything lives under /api with no version segment: this is a
// single-deployment app, so a version prefix would be ceremony with no consumer.
import { Router } from 'express';
import aggregatesRouter from './routes/aggregates.js';
import predictionsRouter from './routes/predictions.js';
import { badRequest } from './respond.js';

const router = Router();

router.use('/api', aggregatesRouter);
router.use('/api', predictionsRouter);

// JSON 404 for unmatched /api paths. Without this, a typo would fall through to
// the SPA fallback in server.ts and hand HTML to a fetch() expecting JSON -
// which surfaces as a confusing parse error rather than a 404.
router.use('/api', (req, res) => {
  badRequest(res, `No such endpoint: ${req.originalUrl}`, 404);
});

export default router;
