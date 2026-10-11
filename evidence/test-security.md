# Security Control Evidence

This page collects the screenshot evidence for the security control tests, covering security group configuration, RDS access rules, and public access restrictions.

## Security control test

Date: 3 Oct 2026
Objective: Verify that the database is not directly reachable from outside the application tier, and identify any gaps against least-privilege access.
Setup: RDS MariaDB instance with public access disabled, SG restricting port 3306 to the EC2 security group.
Steps: Confirmed RDS "Public access: No" setting; verified SSL enforcement (require_secure_transport ON); ran SELECT CURRENT_USER(), USER() and SHOW GRANTS FOR CURRENT_USER() to audit the application's actual database privileges.
Expected result: Database is unreachable from outside the VPC/app tier; application connects with a scoped, least-privilege account.
Actual result: Configuration inspection showed RDS public access disabled, the database security group restricted to the application tier and SSL enforcement enabled. A rejected external-connection test was not recorded, so these observations establish inspected settings rather than demonstrated network rejection. The privilege audit showed that the application connects as admin@% with administrative privileges, including CREATE USER, GRANT OPTION, DROP and ALTER. Least privilege was therefore not achieved; remediation and retesting remain necessary.
Artefact: evidence/test-security.md (grants output, redacted RDS configuration)

## Reproduction from ZIP/repository root

Script: `tests/Security Control.py`
What it checks:
- `test_protected_endpoint_rejects_missing_token`: `GET /me` without an `Authorization` header returns HTTP 401 or 403.
- `test_protected_endpoint_rejects_invalid_token`: `GET /me` with a malformed bearer token returns HTTP 401 or 403.

Named threat: unauthorised access to user account data through the API (see `evidence/threat-control-map.md`, "Endpoint Authentication" and "JWT Authentication").

```powershell
python -m pip install pytest requests
$env:API_BASE_URL = "<ALB_DNS_REDACTED or http://localhost:8000>"
python -m pytest "tests/Security Control.py" -v
```

## Supporting artefacts
- tests/Security Control.py
- evidence/threat-control-map.md
- evidence/evidence_images/Security Control Evidence/Created SecGrps.png
- evidence/evidence_images/Security Control Evidence/RDS EC2 Access PASS.png
- evidence/evidence_images/Security Control Evidence/RDS Inbound Rule.png
- evidence/evidence_images/Security Control Evidence/RDS No Allow Public Access.png
- evidence/evidence_images/Security Control Evidence/RDS Public Access FAIL.png
- evidence/evidence_images/Security Control Evidence/RDS SecGrp Rules.png

## Summary

| # | Evidence | Format | Link |
|---|----------|--------|------|
| 1 | Created SecGrps | Image | [🖼 View](./evidence_images/Security%20Control%20Evidence/Created%20SecGrps.png) |
| 2 | RDS EC2 Access PASS | Image | [🖼 View](./evidence_images/Security%20Control%20Evidence/RDS%20EC2%20Access%20PASS.png) |
| 3 | RDS Inbound Rule | Image | [🖼 View](./evidence_images/Security%20Control%20Evidence/RDS%20Inbound%20Rule.png) |
| 4 | RDS No Allow Public Access | Image | [🖼 View](./evidence_images/Security%20Control%20Evidence/RDS%20No%20Allow%20Public%20Access.png) |
| 5 | RDS Public Access FAIL | Image | [🖼 View](./evidence_images/Security%20Control%20Evidence/RDS%20Public%20Access%20FAIL.png) |
| 6 | RDS SecGrp Rules | Image | [🖼 View](./evidence_images/Security%20Control%20Evidence/RDS%20SecGrp%20Rules.png) |

---

## Media files

### 1. Created SecGrps

![Created SecGrps](./evidence_images/Security%20Control%20Evidence/Created%20SecGrps.png)

---

### 2. RDS EC2 Access PASS

![RDS EC2 Access PASS](./evidence_images/Security%20Control%20Evidence/RDS%20EC2%20Access%20PASS.png)

---

### 3. RDS Inbound Rule

![RDS Inbound Rule](./evidence_images/Security%20Control%20Evidence/RDS%20Inbound%20Rule.png)

---

### 4. RDS No Allow Public Access

![RDS No Allow Public Access](./evidence_images/Security%20Control%20Evidence/RDS%20No%20Allow%20Public%20Access.png)

---

### 5. RDS Public Access FAIL

![RDS Public Access FAIL](./evidence_images/Security%20Control%20Evidence/RDS%20Public%20Access%20FAIL.png)

---

### 6. RDS SecGrp Rules

![RDS SecGrp Rules](./evidence_images/Security%20Control%20Evidence/RDS%20SecGrp%20Rules.png)
