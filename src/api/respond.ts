// Response helpers shared by every route, so the ApiEnvelope shape is produced
// in exactly one place and the client can rely on it unconditionally.
import type { Response } from 'express';
import type { ApiEnvelope } from '../types.js';

/** Sends a 200 with the success branch of the envelope. */
export function ok<T>(res: Response, data: T): void {
  res.json({ success: true, data } satisfies ApiEnvelope<T>);
}

/** Sends a client error (default 400) with a caller-facing message. */
export function badRequest(res: Response, error: string, status = 400): void {
  res.status(status).json({ success: false, error } satisfies ApiEnvelope<never>);
}

/**
 * Logs the real cause server-side and returns a generic 500. The underlying
 * error is deliberately not sent to the client: it can contain SQL text,
 * column names, or connection details.
 */
export function serverError(res: Response, label: string, cause: unknown): void {
  console.error(`${label} failed:`, cause);
  res.status(500).json({ success: false, error: `${label} failed` } satisfies ApiEnvelope<never>);
}
