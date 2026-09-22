// Environment contract, validated once at startup.
//
// This is the hybrid seam: the same variable names are supplied by .env locally
// and by the platform (compose env, SSM, task definition) in the cloud.
//
// Deliberately minimal. Every key here is read by real code - if a key is not
// consumed anywhere, it does not belong in this schema, because a missing or
// malformed value aborts startup and a check that guards nothing is only a way
// to fail a deploy for no reason.
import { z } from 'zod';

export const envSchema = z.object({
  // Database
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.string().regex(/^\d+$/, 'DB_PORT must be a number').transform(Number),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  // Required, not defaulted: silently defaulting TLS to off is how a cloud
  // deployment ends up unencrypted without anyone noticing.
  DB_SSL: z.enum(['true', 'false']).transform(value => value === 'true'),

  // Server
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number).default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/** Parses an environment-like object with no process side effects. Used by tests. */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  return envSchema.parse(source);
}

/**
 * Validates process.env and exits with a readable report if it is wrong.
 *
 * Failing fast at startup is intentional: a half-configured server that accepts
 * traffic and then throws per-request is much harder to diagnose than one that
 * refuses to boot and says which key is bad.
 */
export function validateEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      console.error(`Environment validation failed:\n${issues}`);
      console.error('\nCopy .env.example to .env and fill in the values.\n');
      process.exit(1);
    }
    throw error;
  }
}

let cached: Env | null = null;

/** Returns the validated environment, parsing it on first use only. */
export function getEnv(): Env {
  if (!cached) {
    cached = validateEnv();
  }
  return cached;
}
