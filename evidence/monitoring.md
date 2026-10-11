# Cloud Monitoring Evidence

This page collects the image evidence for monitoring the various AWS services used by FlyWise.

## Monitoring observation

CloudWatch provides CPU metrics and target-tracking alarms for the 40% CPU scaling policy. The 3 October 2026 notification at 09:35 UTC records desired capacity decreasing from three to two. Monitoring screenshots are indexed in evidence/monitoring.md. They support the documented observation but do not establish response times or uninterrupted service. A complete written record with observation window, metric statistic/unit, alarm condition and interpretation, supported by dated redacted exports, remains outstanding.

## Supporting artefacts

| # | Evidence | Format | Link |
|---|----------|--------|------|
| 1 | Application Load Balancer (ALB) | Image | [🖼 View](./evidence_images/Monitoring/ALB.jpg) |
| 2 | EC2 Instance | Image | [🖼 View](./evidence_images/Monitoring/EC2.jpg) |
| 3 | RDS Metrics 1 | Image | [🖼 View](./evidence_images/Monitoring/RDS1.jpg) |
| 4 | RDS Metrics 2 | Image | [🖼 View](./evidence_images/Monitoring/RDS2.jpg) |
| 5 | Target Group | Image | [🖼 View](./evidence_images/Monitoring/Target%20Group.jpg) |

---

## Media files

### 1. Application Load Balancer (ALB)

![Application Load Balancer (ALB)](./evidence_images/Monitoring/ALB.jpg)

---

### 2. EC2 Instance

![EC2 Instance](./evidence_images/Monitoring/EC2.jpg)

---

### 3. RDS Metrics 1

![RDS Metrics 1](./evidence_images/Monitoring/RDS1.jpg)

---

### 4. RDS Metrics 2

![RDS Metrics 2](./evidence_images/Monitoring/RDS2.jpg)

---

### 5. Target Group

![Target Group](./evidence_images/Monitoring/Target%20Group.jpg)
