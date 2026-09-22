// FlyWise server: one process, one port, serving both the built React client
// and the JSON API. Same origin, so there is no CORS layer and no proxy in the
// production path.
//
// NOTE ON ACCESS CONTROL: every route below is unauthenticated. That is adequate
// for the local compose stack, but this must not be exposed publicly as-is -
// anyone who can reach the port can read the full dataset and call /api/predict.
// The users table in db/migrations/002_app_schema.sql is the intended seam for
// adding auth; nothing consumes it yet.
import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEnv } from './config/env.js';
import { testConnection, getConnectionInfo, closePool } from './config/database.js';
import apiRouter from './api/index.js';

const env = getEnv(); // exits here if the environment is misconfigured
const app = express();

app.use(express.json());

// Liveness. Deliberately does not touch the database: this answers "is the
// process up", which is what a load balancer needs to decide on restarts.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'FlyWise API', timestamp: new Date().toISOString() });
});

// Readiness. One attempt, no retry - a health check that retries for seconds
// reports stale information by the time it answers.
app.get('/api/health/db', async (_req, res) => {
  try {
    await testConnection(1, 0);
    res.json({
      status: 'ok',
      database: 'connected',
      connection: getConnectionInfo(), // password omitted by construction
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(apiRouter);

// Static client, resolved relative to this module rather than process.cwd(), so
// the server works regardless of the directory it was launched from.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.resolve(moduleDir, '..', 'dist', 'client');

if (fs.existsSync(path.join(CLIENT_DIR, 'index.html'))) {
  app.use(express.static(CLIENT_DIR));
  // SPA fallback, registered after the API router so that an unknown /api path
  // returns the router's JSON 404 instead of this HTML.
  app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIR, 'index.html')));
  console.log(`Serving client from ${CLIENT_DIR}`);
} else {
  console.warn(`No client build at ${CLIENT_DIR}. Run "npm run build".`);
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await closePool();
  process.exit(0);
});

app.listen(env.PORT, () => {
  console.log(`FlyWise running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
