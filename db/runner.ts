// Database migration runner for FlyWise
// Load environment variables first
import 'dotenv/config';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PoolConnection } from 'mysql2/promise';
import { getPool } from '../src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

interface MigrationRecord {
  id: number;
  filename: string;
  checksum: string;
  applied_at: Date;
}

function checksum(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

/**
 * Splits a migration file into individual statements on semicolons that
 * terminate a line, skipping full-line SQL comments. This is intentionally
 * simple - it assumes each statement's terminating semicolon is the last
 * non-whitespace character on its line, which holds for this project's
 * migrations. It does not attempt to parse strings or comments containing
 * semicolons.
 */
function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  return withoutComments
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

async function createMigrationsTable(): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename),
        INDEX idx_applied_at (applied_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } finally {
    connection.release();
  }
}

async function getAppliedMigrations(connection: PoolConnection): Promise<MigrationRecord[]> {
  const [rows] = await connection.execute(
    'SELECT * FROM schema_migrations ORDER BY filename'
  );
  return rows as MigrationRecord[];
}

async function getMigrationFiles(): Promise<string[]> {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files.filter(f => f.endsWith('.sql')).sort();
}

async function status(): Promise<void> {
  try {
    await createMigrationsTable();

    const connection = await getPool().getConnection();
    let applied: MigrationRecord[];
    try {
      applied = await getAppliedMigrations(connection);
    } finally {
      connection.release();
    }

    const migrationFiles = await getMigrationFiles();

    console.log('\nMigration Status:');
    console.log('================');

    for (const file of migrationFiles) {
      const record = applied.find(m => m.filename === file);
      const label = record ? '✓ APPLIED' : '✗ PENDING';
      const date = record ? ` (${record.applied_at.toISOString()})` : '';
      console.log(`${label} ${file}${date}`);
    }

    console.log(`\nTotal files: ${migrationFiles.length}`);
    console.log(`Applied: ${applied.length}`);
    console.log(`Pending: ${migrationFiles.length - applied.length}`);
  } catch (error) {
    console.error('Migration status check failed:', error);
    process.exit(1);
  }
}

/**
 * Applies all pending migrations in filename order.
 *
 * Immutability: before applying, every already-applied file's on-disk
 * checksum is compared against the recorded one. Any mismatch aborts the
 * entire run before touching the database - a modified applied migration
 * is rejected loudly, never silently re-run.
 * Atomicity caveat: MySQL 8 auto-commits before DDL (CREATE TABLE, indexes,
 * etc), so a single migration file containing DDL cannot be rolled back as
 * a unit if a later statement in the same file fails. Each statement is
 * executed in filename+statement order and the runner reports the exact
 * statement index on failure so the DBA can see what already landed. DML-only
 * migrations (future data-seeding files) run inside a transaction and do
 * roll back cleanly.
 */
async function migrate(): Promise<void> {
  await createMigrationsTable();

  const connection = await getPool().getConnection();

  try {
    const applied = await getAppliedMigrations(connection);
    const appliedByName = new Map(applied.map(m => [m.filename, m]));
    const migrationFiles = await getMigrationFiles();

    // Immutability check across ALL applied files before applying anything.
    for (const file of migrationFiles) {
      const record = appliedByName.get(file);
      if (!record) continue;

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      const actual = checksum(sql);

      if (actual !== record.checksum) {
        throw new Error(
          `Immutability violation: "${file}" was modified after being applied.\n` +
          `  recorded checksum: ${record.checksum}\n` +
          `  current checksum:  ${actual}\n` +
          `Corrections must go in a new migration file, not an edit to an applied one.`
        );
      }
    }

    const pending = migrationFiles.filter(f => !appliedByName.has(f));

    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.');
      return;
    }

    for (const file of pending) {
      console.log(`Applying ${file}...`);
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      const statements = splitStatements(sql);
      const isDdl = /\b(CREATE|ALTER|DROP)\b/i.test(sql);

      if (isDdl) {
        // DDL auto-commits in MySQL - no explicit transaction wraps this.
        for (let i = 0; i < statements.length; i++) {
          try {
            await connection.query(statements[i]);
          } catch (error) {
            throw new Error(
              `Migration "${file}" failed at statement ${i + 1} of ${statements.length}.\n` +
              `Statements before this one in the file have already been committed by MySQL ` +
              `(DDL auto-commits) and were NOT rolled back.\n` +
              `Statement: ${statements[i].slice(0, 200)}\n` +
              `Cause: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      } else {
        // Pure DML migrations get real transactional atomicity.
        await connection.beginTransaction();
        try {
          for (let i = 0; i < statements.length; i++) {
            try {
              await connection.query(statements[i]);
            } catch (error) {
              throw new Error(
                `Migration "${file}" failed at statement ${i + 1} of ${statements.length}. ` +
                `Transaction rolled back, no partial changes committed.\n` +
                `Statement: ${statements[i].slice(0, 200)}\n` +
                `Cause: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }
          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      }

      const fileChecksum = checksum(sql);
      await connection.execute(
        'INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)',
        [file, fileChecksum]
      );

      console.log(`✓ Applied ${file}`);
    }

    console.log(`\nApplied ${pending.length} migration(s).`);
  } finally {
    connection.release();
  }
}

/**
 * Verifies the live schema matches expectations: every migration file on
 * disk is applied, every applied file's checksum still matches disk, and
 * no applied record references a file that no longer exists.
 */
async function verify(): Promise<void> {
  try {
    await createMigrationsTable();

    const connection = await getPool().getConnection();
    let applied: MigrationRecord[];
    try {
      applied = await getAppliedMigrations(connection);
    } finally {
      connection.release();
    }

    const migrationFiles = await getMigrationFiles();
    const migrationFileSet = new Set(migrationFiles);
    const appliedByName = new Map(applied.map(m => [m.filename, m]));

    let ok = true;

    for (const file of migrationFiles) {
      const record = appliedByName.get(file);
      if (!record) {
        console.error(`✗ PENDING: ${file} exists on disk but is not applied.`);
        ok = false;
        continue;
      }

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      const actual = checksum(sql);

      if (actual !== record.checksum) {
        console.error(`✗ CHECKSUM MISMATCH: ${file} was modified after being applied.`);
        ok = false;
      } else {
        console.log(`✓ ${file} matches applied checksum`);
      }
    }

    for (const record of applied) {
      if (!migrationFileSet.has(record.filename)) {
        console.error(`✗ ORPHANED RECORD: "${record.filename}" is applied but missing from disk.`);
        ok = false;
      }
    }

    if (!ok) {
      console.error('\nSchema verification FAILED.');
      process.exit(1);
    }

    console.log('\nSchema verification passed. All migrations applied and unmodified.');
  } catch (error) {
    console.error('Schema verification failed:', error);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'status':
    await status();
    break;
  case 'migrate':
    await migrate();
    break;
  case 'verify':
    await verify();
    break;
  default:
    console.log('Usage: tsx db/runner.ts <command>');
    console.log('Commands: status | migrate | verify');
    process.exit(1);
}

process.exit(0);
