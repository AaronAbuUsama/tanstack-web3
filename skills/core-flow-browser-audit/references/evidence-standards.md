# Evidence Standards

Evidence requirements are strict. Missing evidence downgrades status to `PARTIAL` or `BLOCKED`.

## 1) Required Artifact Tree

`artifacts/core-flow-audit/<app-slug>/<YYYY-MM-DD>/run-<NN>/`

Required contents:
- `screenshots/`
- `logs/automated-checks.log`
- `logs/browser-actions.log`
- `logs/final-audit-log.ndjson`
- `reports/final-report.md`
- `meta/discovery-summary.md`
- `meta/preflight-confirmations.md`

## 2) Screenshot Standards

Naming:
- `S<scenario2>-ST<step2>-<checkpoint>.png`

Minimum per scenario:
1. before key action
2. after key action
3. refresh/revisit persistence state

If scenario fails:
- capture one additional screenshot focused on failure state

## 3) Automated Check Standards

`logs/automated-checks.log` must include:
- exact command executed
- exit code
- concise pass/fail result
- notable error lines for failed commands

If tests are missing:
- record `PARTIAL` with reason code `NO_EXISTING_AUTOMATED_CHECK`

## 4) Browser Action Standards

`logs/browser-actions.log` must include:
- scenario ID
- ordered action list
- key UI assertions made during steps
- references to screenshot paths

## 5) Final Audit Log (NDJSON)

Write one JSON object per significant event to:
- `logs/final-audit-log.ndjson`

Use this fixed key set:

`ts, gate, scenario_id, step_id, status, severity, reason_code, message, artifacts, recommendation`

Key notes:
- `ts`: ISO-8601 UTC timestamp
- `gate`: `preflight|automated|browser|regression|summary`
- `status`: `PASS|FAIL|PARTIAL|BLOCKED`
- `severity`: `CRITICAL|HIGH|MEDIUM|LOW|NONE`
- `artifacts`: array of relative paths

## 6) Severity Assignment

- `CRITICAL`: core money/security/irreversible transaction risk or full core-flow break.
- `HIGH`: core flow materially broken but workaround may exist.
- `MEDIUM`: non-core or partial break with moderate impact.
- `LOW`: cosmetic/documentation/low-risk inconsistency.

## 7) Fallback Classification Rules

Use `PARTIAL` when:
- flow is executable but one or more mandatory checkpoints are not automatable
- evidence is incomplete due to automation boundary

Use `BLOCKED` when:
- missing test accounts/seed data
- hard dependency unavailable (service, feature flag, environment)
- required route/action inaccessible

Required reason codes for non-pass:
- `NATIVE_DIALOG_UNAUTOMATABLE`
- `MISSING_TEST_DATA`
- `MISSING_ACCOUNT_ROLE`
- `ENVIRONMENT_UNAVAILABLE`
- `FEATURE_NOT_ACCESSIBLE`
- `NO_EXISTING_AUTOMATED_CHECK`
- `UNKNOWN_BLOCKER`
