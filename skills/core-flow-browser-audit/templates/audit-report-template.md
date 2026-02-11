# Core Flow Browser Audit Report

## 1) Audit Metadata

- Audit Date:
- Workspace:
- App Slug:
- Run Directory:
- Auditor:
- Base URL:
- App Start Command:

## 2) Preflight Confirmations

- Runtime target confirmed: `YES/NO`
- Test accounts and seed data confirmed: `YES/NO`
- Critical flow list confirmed: `YES/NO`

If any is `NO`, mark overall audit `BLOCKED`.

## 3) Discovery Summary

- Detected app scripts:
- Detected automated test scripts:
- Detected routes/pages:
- Detected feature modules:
- Inferred core flow buckets:

## 4) Validation Gates

### Gate A: Automated Checks

| Command | Result | Evidence |
| --- | --- | --- |
| `<command-1>` | `PASS/FAIL/PARTIAL/BLOCKED` | `logs/automated-checks.log` |

### Gate B: Browser Scenario Checks

| Scenario ID | Name | Flow Bucket | Result | Evidence |
| --- | --- | --- | --- | --- |
| `S01` | `<name>` | `<bucket>` | `PASS/FAIL/PARTIAL/BLOCKED` | `screenshots/...` |

### Gate C: Regression Sweep

| Check | Result | Evidence |
| --- | --- | --- |
| `<check-1>` | `PASS/FAIL/PARTIAL/BLOCKED` | `screenshots/...` |

## 5) Findings

### F-001: <short title>

- Severity: `CRITICAL/HIGH/MEDIUM/LOW`
- Status: `FAIL/PARTIAL/BLOCKED`
- Scenario IDs: `Sxx[, Syy]`
- Repro Steps:
1. ...
2. ...
3. ...
- Expected:
- Actual:
- Artifact Links:
  - `screenshots/...`
  - `logs/final-audit-log.ndjson`
- Root Cause Hypothesis:
- Fix Recommendation:

## 6) Non-Automatable or Blocked Paths

| Scenario ID | Status | Reason Code | Reason | Next Action |
| --- | --- | --- | --- | --- |
| `Sxx` | `PARTIAL/BLOCKED` | `...` | `...` | `...` |

## 7) Overall Result

- Overall Audit Status: `PASS/FAIL/PARTIAL/BLOCKED`
- Release Risk Summary:
- Must-Fix Before Release:
1. ...
2. ...

## 8) Recommended Follow-Up

1. Add/repair automated checks for uncovered core flows.
2. Re-run the same scenario matrix with identical artifact conventions.
3. Confirm non-pass scenarios are resolved with new evidence.
