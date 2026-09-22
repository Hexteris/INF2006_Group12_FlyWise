import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env.js';
import {
  buildPoolOptions,
  redactConnectionInfo,
} from '../../src/config/database.js';

const validRawEnv: NodeJS.ProcessEnv = {
  DB_HOST: 'mysql.internal',
  DB_PORT: '3306',
  DB_USER: 'flywise',
  DB_PASSWORD: 'database-secret',
  DB_NAME: 'flywise',
  DB_SSL: 'false',
  PORT: '8000',
  NODE_ENV: 'test',
};

describe('environment validation', () => {
  it('rejects a missing required key and names it', () => {
    const raw = { ...validRawEnv };
    delete raw.DB_HOST;

    expect(() => parseEnv(raw)).toThrow(/DB_HOST/);
  });

  it('rejects a malformed numeric value and names it', () => {
    const raw = { ...validRawEnv, DB_PORT: 'not-a-port' };

    expect(() => parseEnv(raw)).toThrow(/DB_PORT/);
  });

  it('requires DB_SSL to be set explicitly rather than defaulting it', () => {
    const raw = { ...validRawEnv };
    delete raw.DB_SSL;

    expect(() => parseEnv(raw)).toThrow(/DB_SSL/);
  });

  it('rejects a DB_SSL value that is not exactly true or false', () => {
    expect(() => parseEnv({ ...validRawEnv, DB_SSL: 'yes' })).toThrow(/DB_SSL/);
  });
});

describe('database configuration', () => {
  it('omits TLS options when DB_SSL is false', () => {
    const env = parseEnv(validRawEnv);
    const options = buildPoolOptions(env);

    expect(options).not.toHaveProperty('ssl');
  });

  it('enables certificate-validated TLS only when DB_SSL is true', () => {
    const env = parseEnv({ ...validRawEnv, DB_SSL: 'true' });
    const options = buildPoolOptions(env);

    expect(options.ssl).toEqual({ rejectUnauthorized: true });
  });

  it('redacts the password from connection metadata', () => {
    const env = parseEnv(validRawEnv);
    const connectionInfo = redactConnectionInfo(env);

    expect(connectionInfo).toEqual({
      host: 'mysql.internal',
      port: 3306,
      database: 'flywise',
      user: 'flywise',
      ssl: false,
    });
    expect(JSON.stringify(connectionInfo)).not.toContain('database-secret');
  });
});
