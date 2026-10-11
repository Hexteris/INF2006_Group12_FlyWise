# Threat Control Map Evidence

This page collects the image evidence for the security and threat control measures implemented in FlyWise.

## Threat-control map

Primary named threat: unauthorised access to user account data through the API (rows 1 and 5).

| # | Threat | Control | Where implemented | Validation | Result |
|---|---|---|---|---|---|
| 1 | Unauthenticated access to account data | Protected endpoints require a JWT bearer token through `get_current_user` | `src/FastAPI.py` (`/me`, `get_current_user`) | `python3 -m pytest -v "Security Control.py::test_protected_endpoint_rejects_missing_token"` (screenshot 1) | Pass: 1 passed in 0.69s; `/me` returned 401/403 without a token |
| 2 | Aviationstack API key exposed in source code | Key read from the `AVIATIONSTACK_API_KEY` environment variable; request fails with HTTP 503 if the key is not configured | `src/FastAPI.py` (`live_flights`) | Code inspection (screenshot 2) | Inspected: no hard-coded key; `access_key` is passed from the environment |
| 3 | Database credentials exposed in source code; database traffic intercepted | `get_connection()` reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` from environment variables and connects with `ssl=True` | `src/FastAPI.py` (`get_connection`) | Code inspection (screenshot 3) | Inspected: no hard-coded credentials; SSL is requested, but certificate verification is not proven |
| 4 | `.env` secrets file committed to version control | `.env` listed in `.gitignore` (line 18) | `.gitignore` | `git ls-files --error-unmatch .env`, `git check-ignore -v --no-index .env` and `git log --all --oneline -- .env`, run on the EC2 deployment checkout (screenshot 4) | Pass: `.env is NOT TRACKED`; ignore rule matched at `.gitignore:18`; no commits found for `.env` |
| 5 | Forged or tampered JWT used to access account data | JWT signature and expiry verified with `JWT_SECRET_KEY` before access is granted | `src/FastAPI.py` (`get_current_user`) | `python3 -m pytest -v "Security Control.py::test_protected_endpoint_rejects_invalid_token"` (screenshot 5) | Pass: 1 passed in 0.75s; `/me` returned 401/403 for an invalid token |
| 6 | Secrets hard-coded in application configuration | Environment variables loaded at runtime from the untracked `.env` file through `load_dotenv(".env")` | `src/FastAPI.py` (module start-up) | Code inspection (screenshot 6) | Inspected: secrets are supplied at runtime, not stored in code |

Screenshot numbers refer to the Media files section below.

---

## Summary

| # | Evidence | Format | Link |
|---|----------|--------|------|
| 1 | Endpoint Authentication | Image | [🖼 View](./evidence_images/Threat%20Control%20Map/Endpoint%20Authentication.jpg) |
| 2 | GET Aviationstack API Key | Image | [🖼 View](./evidence_images/Threat%20Control%20Map/GET%20Aviationstack%20API%20Key.jpg) |
| 3 | GET Environment Variables | Image | [🖼 View](./evidence_images/Threat%20Control%20Map/GET%20env%20variables.jpg) |
| 4 | Gitignore | Image | [🖼 View](./evidence_images/Threat%20Control%20Map/Gitignore.jpg) |
| 5 | JWT Authentication | Image | [🖼 View](./evidence_images/Threat%20Control%20Map/JWT%20Authentication.jpg) |
| 6 | Load Environment Variables | Image | [🖼 View](./evidence_images/Threat%20Control%20Map/Load%20env.jpg) |

---

## Media files

### 1. Endpoint Authentication

![Endpoint Authentication](./evidence_images/Threat%20Control%20Map/Endpoint%20Authentication.jpg)

**Description:**

The /me endpoint rejected the request without an authentication token, returning an HTTP status of either 401 or 403.

---

### 2. GET Aviationstack API Key

![GET Aviationstack API Key](./evidence_images/Threat%20Control%20Map/GET%20Aviationstack%20API%20Key.jpg)

**Description:**

- **os.getenv("AVIATIONSTACK_API_KEY")** — Retrieves the API key from an environment variable.
- **if not api_key:** — Checks whether the key is missing.
- **"access_key":** api_key — Passes the configured key into the API request rather than hardcoding its value in the request parameters.

---

### 3. GET Environment Variables

![GET Environment Variables](./evidence_images/Threat%20Control%20Map/GET%20env%20variables.jpg)

**Description:**

This screenshot demonstrates three relevant security measures:

- **Credential loading:** `load_dotenv(".env")` loads environment variables from the `.env` file.
- **Credential usage:** `os.getenv()` retrieves the database host, username, password, and database name without hardcoding their values in the database connection function.
- **SSL/TLS connection:** `ssl=True` requests an SSL/TLS connection to the database, although this line alone does not prove that certificate verification is enabled.

---

### 4. Gitignore

![Gitignore](./evidence_images/Threat%20Control%20Map/Gitignore.jpg)

**Description:**

- .gitignore line 18 contains .env.
- .env is NOT TRACKED confirms Git is not tracking the file.
- .gitignore:18:.env .env confirms the ignore rule applies.
- git log --all --oneline -- .env returned no commits in the checked history.

---

### 5. JWT Authentication

![JWT Authentication](./evidence_images/Threat%20Control%20Map/JWT%20Authentication.jpg)

**Description:**

Security Control Test to check JWT Authentication: API Rejects invalid JWT token

---

### 6. Load Environment Variables

![Load Environment Variables](./evidence_images/Threat%20Control%20Map/Load%20env.jpg)