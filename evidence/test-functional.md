# Functional Workflow Evidence

This page collects the image and video evidence for the functional workflow tests.

## Functional workflow test

Date: 3 Oct 2026
Objective: Verify responses from the deployed application's root and delay-causes endpoints, and check that the saved-flight count displayed on the frontend matches the database record count. Direct instance requests do not establish a complete workflow through the ALB.
Setup: Two EC2 instances running the FlyWise Docker container behind the ALB, connected to the RDS MariaDB instance.
Steps: Sent GET / and GET /analytics/delay-causes requests directly to a deployed instance; separately, saved flights through the website and queried the upcoming_saved_flights table directly via the running container to compare against what the Prediction page displayed.
Expected result: HTTP 200 responses; saved-flight count displayed on the frontend matches the database record count.
Actual result: GET/returned HTTP 200 (~0.032s); GET /analytics/delay-causes returned HTTP 200 (~0.303s). The database contained 8 records in upcoming_saved_flights, matching the Prediction page's displayed "Saved (8)" count after a known frontend list-rendering bug (duplicate React keys causing stale rows to persist across tab switches) was identified and fixed.
Artefact: evidence/test-functional.md (endpoint response logs, saved-flight count verification)

## Reproduction from ZIP/repository root

Script: `tests/Functional Workflow.py` (`test_flight_search_workflow`)
What it checks: `GET /flights?flight_date=2025-01-20&origin=JFK&destination=LAX` returns HTTP 200 and a non-empty list, and every record matches the requested date, origin and destination.

```powershell
python -m pip install pytest requests
$env:API_BASE_URL = "<ALB_DNS_REDACTED or http://localhost:8000>"
python -m pytest "tests/Functional Workflow.py" -v
```

## Supporting artefacts
- tests/Functional Workflow.py
- evidence/evidence_images/Functional Workflow Evidence/API Endpoint Test.jpg
- evidence/evidence_images/Functional Workflow Evidence/Cloud Video.mp4

## Summary

| # | Evidence | Format | Link |
|---|----------|--------|------|
| 1 | API Endpoint Test | Image | [🖼 View](./evidence_images/Functional%20Workflow%20Evidence/API%20Endpoint%20Test.jpg) |
| 2 | Cloud Video | Video | [▶ Watch](./evidence_images/Functional%20Workflow%20Evidence/Cloud%20Video.mp4) |

---

## Media files

### 1. API Endpoint Test

![API Endpoint Test](./evidence_images/Functional%20Workflow%20Evidence/API%20Endpoint%20Test.jpg)

---

### 2. Cloud Video

[▶ Open video: Cloud Video](./evidence_images/Functional%20Workflow%20Evidence/Cloud%20Video.mp4)
