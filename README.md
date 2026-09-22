# FlyWise: Flight Delay Intelligence Platform

> **INF2006 Cloud Computing & Big Data — Team Project 1 (Group 12)**
> Airline operations platform for predicting departure delays and analysing historical patterns.

## Problem statement

Airline operations staff learn about delays reactively. FlyWise predicts departure-delay
risk from information known **before pushback**, shows the historical rates behind each
prediction, and exposes delay patterns so decisions (gate reassignment, crew contingency,
passenger notification) can be made proactively.

Delay means a departure 15 or more minutes behind schedule (`DepDel15`).

## Run it

```powershell
docker compose up -d --build
```

Then open <http://localhost:8000>. Two containers, one port: `flywise-mysql` and
`flywise-app`. The app image builds the React client and serves it alongside the API from
the same origin, so there is no CORS layer and no proxy in the production path.

On the first boot of an empty volume, MySQL runs the three migration files to create the
schema. Loading flight data is a separate step, below.

## What is implemented today

| Area | State |
|---|---|
| Dashboard: headline metrics, route table, hourly congestion table, server-side filters | Working |
| `GET /api/summary`, `/api/airlines`, `/api/airports/congestion`, `/api/airports`, `/api/airlines/list` | Working |
| `POST /api/predict` | Working, backed by a baseline heuristic |
| `GET /api/health`, `/api/health/db` | Working |
| CSV loader and aggregate refresh (`npm run etl`, `npm run etl:aggregates`) | Working |
| Migration runner (`npm run db:migrate`) with checksum immutability | Working |
| Trained ML model | **Not built.** `src/ml/model.ts` is a documented seam holding a baseline heuristic |
| Authentication and roles | **Not built.** `users` / `prediction_log` exist in migration 002 as the intended schema; no code reads them |
| Weather, charts, watchlist, AWS deployment | **Not built** (phase 2) |

> **Access control:** every endpoint is currently unauthenticated. This is fine for the
> local stack and must not be exposed to an untrusted network as-is.

## Architecture

```
Browser  http://localhost:8000
   |
   v
flywise-app        Express, run with tsx
                     /api/*              JSON API
                     dist/client         built React app + SPA fallback
   |
   v
flywise-mysql      MySQL 8, schema from db/migrations
```

Flexibility is concentrated in three places, deliberately, so a change has one obvious home:

- **`src/types.ts`** — the API contract. Every shape crossing HTTP is declared once here and
  imported by the query layer, the model, the routes, and the client, so the two sides
  cannot drift.
- **`src/db/queries.ts`** — every SQL string. A schema change means editing this file only.
  `DECIMAL` columns arrive from mysql2 as strings and are coerced to numbers here, and rows
  are mapped to camelCase, so no raw column name escapes this module.
- **`src/ml/model.ts`** — one `predict()` function. Replacing the model means replacing this
  file and nothing else.

**Stack:** React 18 + Vite + Tailwind, Express + TypeScript run through `tsx`, MySQL 8, zod
for validation. There is no build step for the server: `tsx` strips types at run time, and
`vite build` (esbuild) compiles the client without type-checking. Run `npm run type-check`
in CI, because a type error cannot fail the image build.

## Loading flight data

`flight_project_cleaned.csv` is roughly 895 MB. It is gitignored and excluded from the
Docker build context, so it is **not** present inside the container. Load it from the host
against the published MySQL port:

```powershell
npm install
npm run db:migrate        # records checksums in schema_migrations
npm run etl               # streams the CSV into fact_flight
npm run etl:aggregates    # computes the aggregate tables
```

> **Why 3307.** The stack publishes MySQL on host port **3307**, not 3306, because a
> natively installed MySQL or MariaDB service commonly already owns 3306 on a developer
> machine. When that happens the host port answers from the wrong server and the symptom is
> a misleading auth error such as `unknown plugin auth_gssapi_client` rather than a
> connection failure. `.env.example` sets `DB_PORT=3307` to match.
>
> Inside the compose network the app still connects on 3306; only the host-facing port
> differs. To check what owns a port:
> `Get-NetTCPConnection -LocalPort 3306 -State Listen`.

## Local development without Docker for the app

```powershell
Copy-Item .env.example .env
docker compose up -d mysql     # database only
npm run dev                    # API on :8000, Vite on :3000 proxying /api
```

Open <http://localhost:3000>.

### Do not put this repo in OneDrive, Dropbox, or Google Drive

`npm install` writes and deletes tens of thousands of files in `node_modules`. Sync clients
hold file handles during that churn and the install fails partway with `EPERM: rmdir`
followed by `ENOENT: mkdir`. Keep the working copy on a local path such as
`C:\dev\INF2006_Group12_FlyWise`.

### PowerShell execution policy

If `npm` fails with *"running scripts is disabled on this system"*, either allow signed
scripts for your user only (no admin rights, reversible with `-ExecutionPolicy Undefined`):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

or call `npm.cmd` instead of `npm`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API + Vite dev servers in parallel |
| `npm run dev:server` | API only, restart on change (:8000) |
| `npm run dev:client` | Vite only (:3000) |
| `npm run build` | Builds the React client into `dist/client`. Pins `NODE_ENV=production`; without it React's development build ends up in the bundle |
| `npm start` | Runs the server with `tsx` |
| `npm test` / `npm run test:run` | Vitest, watch / once |
| `npm run lint` | ESLint, zero warnings tolerated |
| `npm run type-check` | `tsc --noEmit`. Not part of the build or the image |
| `npm run db:status` / `db:migrate` / `db:verify` | Migration state, apply, verify |
| `npm run etl` / `etl:aggregates` | Load the CSV, then recompute aggregates |

## Project structure

```
├── src/
│   ├── server.ts             # Express entry: health, API, static client
│   ├── types.ts              # the API contract, shared by server and client
│   ├── api/
│   │   ├── index.ts          # router, JSON 404 for unknown /api paths
│   │   ├── respond.ts        # ok / badRequest / serverError envelope helpers
│   │   └── routes/           # aggregates.ts, predictions.ts (no SQL in here)
│   ├── db/queries.ts         # every SQL string
│   ├── ml/model.ts           # the model seam
│   ├── config/               # env validation + MySQL pool (the hybrid seam)
│   ├── etl/                  # CSV parser, loader, aggregate refresh, training window
│   └── client/               # React app: components, hooks, services, format helpers
├── db/
│   ├── runner.ts             # migration CLI: status | migrate | verify
│   └── migrations/           # NNN_description.sql, immutable once merged
├── tests/                    # vitest; the aggregate suite needs a live database
├── data/DATA_DICTIONARY.md
├── Dockerfile                # single stage, runs as the non-root `node` user
└── docker-compose.yml        # flywise-mysql + flywise-app
```

## Configuration

`src/config/env.ts` validates the environment with zod at startup and exits with a named
error if anything is missing. Every key it declares is read by real code; keys nothing
consumes are deliberately not validated, because a check that guards nothing only fails
deploys for no reason.

`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `PORT`, `NODE_ENV`.
`DB_SSL` has no default on purpose: TLS silently defaulting to off is how a cloud
deployment ends up unencrypted. See `.env.example`.

This is the hybrid seam — the same variable names come from `.env` locally and from SSM
Parameter Store or a task definition in phase 2, with no code change.

## Data model and the leakage rule

Target variable: `DepDel15`.

These columns are **outcomes** and must never become model features:
`DepTime`, `DepDelay`, `ArrTime`, `ArrDelay`, `ArrDel15`, `ActualElapsedTime`, `AirTime`,
`CarrierDelay`, `WeatherDelay`, `NASDelay`, `SecurityDelay`, `LateAircraftDelay`,
`Cancelled`, `CancellationCode`.

Historical-rate features are computed over the **training window only**
(`src/etl/training-window.ts`), never the full dataset. `src/etl/refresh-aggregates.ts`
asserts this, and `PredictionFeatures` in `src/types.ts` contains no post-departure field,
so a leaking feature cannot reach the model without a type change.

`crs_dep_time` is stored as **minutes since midnight** (0-1439), not HHMM;
`dep_hour = FLOOR(crs_dep_time / 60)`.

## Schema change workflow

1. Add `db/migrations/NNN_description.sql` with a header stating author, purpose, rollback.
2. Update `data/DATA_DICTIONARY.md` in the same commit.
3. Test locally: `npm run db:migrate && npm run db:verify`.
4. PR review, merge.

**Once merged, a migration is immutable.** The runner checksums applied files and fails
loudly if one changes; corrections go in a new numbered file. `schema_migrations` is created
and maintained by the runner alone — nothing pre-seeds it with hardcoded checksums, which
would drift the moment a migration was edited.

## Machine learning approach (planned)

- **Target** — `DepDel15`, binary classification
- **Split** — temporal, never a random shuffle: a random split lets the model see the future
- **Features** — pre-pushback only: airline, origin, destination, month, day of week,
  scheduled departure hour, distance, plus historical delay rates from the training window
- **Model** — logistic regression, chosen for interpretability, so per-feature contributions
  can be shown to the user
- **Evaluation** — ROC-AUC, PR-AUC, Brier score, calibration, against two baselines: the
  overall base rate and the airline's own historical rate
- **Runtime** — Python trains and exports coefficients; Node applies the sigmoid. Nothing
  Python-related is deployed

Until that lands, `predict()` returns a documented baseline: the worse of the route's and the
departure hour's historical delay rate, thresholded at 30%.

## License

MIT — academic project for INF2006.
