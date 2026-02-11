# Scenario Matrix Checklist

Use this checklist to build the scenario set after project discovery and user confirmations.

## Matrix Columns (Required)

| Field | Description |
| --- | --- |
| Scenario ID | `S01`, `S02`, ... |
| Flow Bucket | `onboarding`, `auth-session`, `crud`, `transactional`, `regression` |
| Route/Page | Primary route or page identifier |
| Module/Feature | Component, module, or feature area |
| Preconditions | Required account, seed data, and system state |
| Steps | Deterministic action sequence |
| Expected Result | User-visible and state mutation expectations |
| Regression Tags | Areas likely to regress |
| Priority | `P0`, `P1`, `P2` |

## Minimum Coverage Rules

1. Include at least one `onboarding` scenario.
2. Include at least one `auth-session` scenario.
3. Include at least one `crud` scenario (create/edit/delete or equivalent).
4. Include at least one `transactional` scenario (submit/approve/execute/payment-like action).
5. Include at least one `regression` scenario covering cross-page navigation and refresh persistence.

## Scenario Design Rules

1. Keep each scenario independently runnable when possible.
2. Use deterministic, explicit data values (no random generated values unless seeded).
3. Include one negative/assertion guard in each P0/P1 scenario.
4. Include persistence check (`refresh` or revisit) for state-changing scenarios.
5. If a scenario needs role switching, list exact account role transitions.

## Priority Rubric

- `P0`: core business path; failure blocks release confidence.
- `P1`: major supporting path; failure significantly degrades trust/usability.
- `P2`: secondary path; failure is non-critical but should be tracked.

## Scenario Status Rules

- `PASS`: all required checkpoints validated.
- `FAIL`: incorrect behavior observed with complete evidence.
- `PARTIAL`: partially validated due to automability or tooling constraints.
- `BLOCKED`: cannot execute due to prerequisite/environment/data blocker.

## Required Output

Produce a matrix table in the final report and ensure every must-audit flow from user confirmation maps to at least one scenario ID.
