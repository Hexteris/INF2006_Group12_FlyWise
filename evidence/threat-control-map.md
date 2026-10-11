# Threat Control Map Evidence

This page collects the image evidence for the security and threat control measures implemented in FlyWise.

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

The /me endpoint rejected the request without an authentication token, returning an HTTP status of either 401 or 403 as required by your test.

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

Your terminal screenshot shows all three relevant checks:

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