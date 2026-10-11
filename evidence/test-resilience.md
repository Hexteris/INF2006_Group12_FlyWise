# Scalability & Recover Evidence

This page collects the screenshot evidence for the scalability and recovery tests, covering Auto Scaling Group (ASG) alarms and scaling actions, and instance-level alarms.

## Scalability and recovery test

Date: 3 Oct 2026
Objective: Verify that the configured Auto Scaling Group performs a scale-in action when triggered by its target-tracking policy.
Setup: Auto Scaling Group (INF2006-FlyWise-ASG) with a target-tracking scaling policy on CPU utilisation (threshold 40%), fronted by the ALB distributing traffic across instances in two Availability Zones.
Steps: Reviewed the AWS Auto Scaling notification and associated target-tracking alarm information for the recorded scaling event.
Expected result: The scaling policy reduces desired capacity and records the corresponding instance termination when a scale-in action is triggered.
Actual result: An AWS notification records a scale-in event reducing desired capacity from 3 to 2 and terminating one instance on 3 October 2026 at 09:35 UTC. This supports an observed scale-in action. The available record does not establish scale-out, response-time behaviour during scaling or uninterrupted service; those outcomes require additional testing and evidence.
Artefact: evidence/test-resilience.md (redacted AWS notification emails, CloudWatch alarm screenshots)

## Reproduction from ZIP/repository root

Script: `tests/Scalability.py`
What it checks:
- `test_health_endpoint_under_light_concurrency`: sends 10 `GET /health` requests through 5 concurrent workers. All must return HTTP 200 with `success: true`. It prints the success count and the average and maximum response times.
- `test_flight_search_after_service_recovery`: run after restarting the cloud services. It confirms that the database-backed `GET /flights` search returns HTTP 200 and a non-empty list.

```powershell
python -m pip install pytest requests
$env:API_BASE_URL = "<ALB_DNS_REDACTED or http://localhost:8000>"
python -m pytest "tests/Scalability.py" -v -s
```

## Supporting artefacts
- tests/Scalability.py
- evidence/evidence_images/Scalability & Recover Evidence/ASG AlarmHigh Details.png
- evidence/evidence_images/Scalability & Recover Evidence/ASG AlarmLow Details.png
- evidence/evidence_images/Scalability & Recover Evidence/ASG CPU Util Alarms.png
- evidence/evidence_images/Scalability & Recover Evidence/ASG Instance Creation.png
- evidence/evidence_images/Scalability & Recover Evidence/ASG Instance Termination.png
- evidence/evidence_images/Scalability & Recover Evidence/ASG Send Email Config.png
- evidence/evidence_images/Scalability & Recover Evidence/Instance Alarms.png
- evidence/evidence_images/Scalability & Recover Evidence/Instance CPU Util Alarm.png
- evidence/evidence_images/Scalability & Recover Evidence/Instance StatusCheck Alarm.png

## Summary

| # | Evidence | Group | Format | Link |
|---|----------|-------|--------|------|
| 1 | ASG AlarmHigh Details | ASG | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20AlarmHigh%20Details.png) |
| 2 | ASG AlarmLow Details | ASG | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20AlarmLow%20Details.png) |
| 3 | ASG CPU Util Alarms | ASG | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20CPU%20Util%20Alarms.png) |
| 4 | ASG Instance Creation | ASG | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20Instance%20Creation.png) |
| 5 | ASG Instance Termination | ASG | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20Instance%20Termination.png) |
| 6 | ASG Send Email Config | ASG | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20Send%20Email%20Config.png) |
| 7 | Instance Alarms | Instance | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/Instance%20Alarms.png) |
| 8 | Instance CPU Util Alarm | Instance | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/Instance%20CPU%20Util%20Alarm.png) |
| 9 | Instance StatusCheck Alarm | Instance | Image | [🖼 View](./evidence_images/Scalability%20%26%20Recover%20Evidence/Instance%20StatusCheck%20Alarm.png) |

---

## Auto Scaling Group (ASG) Evidence

### 1. ASG AlarmHigh Details

![ASG AlarmHigh Details](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20AlarmHigh%20Details.png)

---

### 2. ASG AlarmLow Details

![ASG AlarmLow Details](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20AlarmLow%20Details.png)

---

### 3. ASG CPU Util Alarms

![ASG CPU Util Alarms](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20CPU%20Util%20Alarms.png)

---

### 4. ASG Instance Creation

![ASG Instance Creation](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20Instance%20Creation.png)

---

### 5. ASG Instance Termination

![ASG Instance Termination](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20Instance%20Termination.png)

---

### 6. ASG Send Email Config

![ASG Send Email Config](./evidence_images/Scalability%20%26%20Recover%20Evidence/ASG%20Send%20Email%20Config.png)

---

## Instance Evidence

### 7. Instance Alarms

![Instance Alarms](./evidence_images/Scalability%20%26%20Recover%20Evidence/Instance%20Alarms.png)

---

### 8. Instance CPU Util Alarm

![Instance CPU Util Alarm](./evidence_images/Scalability%20%26%20Recover%20Evidence/Instance%20CPU%20Util%20Alarm.png)

---

### 9. Instance StatusCheck Alarm

![Instance StatusCheck Alarm](./evidence_images/Scalability%20%26%20Recover%20Evidence/Instance%20StatusCheck%20Alarm.png)
