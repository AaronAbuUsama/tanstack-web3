---
name: core-flow-browser-audit
description: Use when auditing production-critical web app flows with real browser evidence and existing automated tests, and you need repeatable pass/fail findings across different repositories.
---

# Core Flow Browser Audit

Reusable workflow for auditing core product flows in a live browser session with deterministic artifacts.

This skill is generic by design:
- never assume a fixed framework or route layout
- never hardcode repo-specific paths
- always discover tests/routes/modules from the current workspace first

Required companion skill: `agent-browser`.

## Non-Negotiable Rules

1. Do not run commands or browser actions before preflight confirmations are complete.
2. Use existing automated tests as the first validation gate.
3. Use `agent-browser` for real browser validation of each critical scenario.
4. Every scenario must produce deterministic artifacts and a status: `PASS`, `FAIL`, `PARTIAL`, or `BLOCKED`.
5. Overall audit result is `PASS` only if all validation gates pass and there are no `FAIL` or `BLOCKED` scenarios.

## Step 0: Mandatory Preflight Confirmations (Ask First)

Before any execution, ask the user for explicit confirmation on these 3 areas and wait for all answers.

1. Runtime target confirmation:
- app start command
- base URL to audit
- optional alternate environment URL (if prod/staging differs)

2. Test accounts and seed data confirmation:
- available accounts/roles (admin/member/viewer/etc.)
- credentials or wallet setup method
- seed/reset command (or statement that no seed is available)

3. Critical flow confirmation:
- must-audit flows (explicit list)
- out-of-scope flows (explicit list)
- any strict business risk areas that require highest severity if broken

If any of the 3 confirmations is missing or ambiguous, stop and mark audit start as `BLOCKED`.

## Step 1: Dynamic Project Discovery

Discover context from the current workspace before defining scenarios.

### 1.1 Discover runnable commands

Inspect package/task scripts for:
- app start commands
- unit/integration/e2e test commands
- lint/check commands that act as preflight quality checks

Useful patterns:
- `rg --files -g 'package.json'`
- `rg -n "\"scripts\"|e2e|playwright|cypress|vitest|jest|test" -S **/package.json`

### 1.2 Discover routes/pages/screens

Inspect source directories for route and page definitions:
- `routes/`, `pages/`, `app/`, `screen*`, `view*`
- navigation structures and URL query/state-driven tabs

Useful patterns:
- `rg --files src app pages routes`
- `rg -n "createFileRoute|Route|router|navigate|Link|screen|tab|wizard|step" -S src app`

### 1.3 Discover feature modules and action verbs

Inspect modules and handlers that map to user-critical actions:
- setup/onboarding
- auth/session/connect/disconnect
- create/edit/delete operations
- transactional/checkout/approval/execute paths

Useful patterns:
- `rg -n "create|add|new|edit|update|delete|remove|login|logout|connect|disconnect|approve|confirm|execute|submit|deploy|enable|disable" -S src app packages`

### 1.4 Infer candidate core flows

Build an initial flow list from discovered scripts/routes/modules:
- onboarding/setup flow
- auth/session flow
- CRUD flow(s)
- transactional flow(s)
- cross-screen regression flow (navigation + refresh persistence)

Then reconcile this inferred list with the user-confirmed must-audit flow list from Step 0.

Use `references/scenario-matrix-checklist.md` to finalize scenario coverage.

## Step 2: Build Scenario Matrix

Create a numbered matrix (`S01`, `S02`, ...) with:
- scenario name and flow bucket
- route/page/module touched
- prerequisites (account/seed/state)
- step sequence
- expected state mutation
- regression tags

Coverage minimum:
- at least 1 scenario for setup/onboarding
- at least 1 scenario for auth/session
- at least 1 scenario for create/edit/delete behavior
- at least 1 scenario for transactional behavior
- at least 1 refresh-persistence check

## Step 3: Hard Validation Gates

All gates are required.

### Gate A: Automated Checks (Existing Tests)

Run existing test commands discovered in Step 1.
- prioritize targeted e2e/integration commands related to selected flows
- include baseline smoke checks when available
- store command outputs under the artifact log directory

Gate A fails when required existing tests fail or cannot run.

### Gate B: Real Browser Scenario Checks (`agent-browser`)

For each scenario:
1. open base URL
2. execute scenario steps with `agent-browser`
3. capture evidence at required checkpoints
4. record step-by-step status in the audit log

Required screenshots per scenario:
- before key action
- after key action
- after refresh/revisit persistence check

Gate B fails when any must-audit scenario is `FAIL` or `BLOCKED`.

### Gate C: Regression Sweep

After all scenario checks, run a short regression sweep:
- app load and navigation health
- auth/session stability
- previously passing core action sanity checks

Gate C fails when regression checks break previously healthy behavior.

## Step 4: Deterministic Artifact Conventions

Use this directory layout (no random names):

`artifacts/core-flow-audit/<app-slug>/<YYYY-MM-DD>/run-<NN>/`

Required files:
- `screenshots/`
- `logs/automated-checks.log`
- `logs/browser-actions.log`
- `logs/final-audit-log.ndjson`
- `reports/final-report.md`
- `meta/discovery-summary.md`
- `meta/preflight-confirmations.md`

Screenshot naming convention:

`screenshots/S<scenario2>-ST<step2>-<checkpoint>.png`

Examples:
- `screenshots/S03-ST01-before-owner-add.png`
- `screenshots/S03-ST02-after-owner-add.png`
- `screenshots/S03-ST03-refresh-owner-list.png`

Use `references/evidence-standards.md` and `templates/audit-log-template.ndjson` for exact evidence and log structure.

## Step 5: Scenario Status Rules and Fallback Behavior

Allowed scenario statuses:
- `PASS`: expected behavior observed with complete evidence
- `FAIL`: behavior incorrect or contradictory to expected result
- `PARTIAL`: scenario executed partially; some required checks are unverified
- `BLOCKED`: scenario could not start or continue due to hard blocker

Use `PARTIAL` when:
- native browser/system dialogs cannot be automated end-to-end
- third-party widgets/captcha/2FA break deterministic automation
- partial evidence exists but one or more required checkpoints are missing

Use `BLOCKED` when:
- required test data/accounts are unavailable
- mandatory environment/service is down
- app cannot reach required route/feature

`PARTIAL` and `BLOCKED` must always include:
- reason code
- concrete blocker description
- minimal repro/evidence path
- next action to unblock

## Step 6: Final Reporting

Generate the final report with `templates/audit-report-template.md`.

Report requirements:
- gate-by-gate outcomes
- scenario matrix with status per scenario
- findings with severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- reproducible steps
- artifact links
- concrete fix recommendations

Also emit `logs/final-audit-log.ndjson` using the template schema.

## Completion Checklist

Before closing the audit:
- 3 preflight confirmations are recorded
- Gate A/B/C outcomes are recorded
- every must-audit scenario has deterministic artifacts
- every non-pass scenario has a blocker/failure reason and next action
- final report and ndjson log are present
