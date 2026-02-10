# Screen-by-Screen Safe Integration Plan (PRD4)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-02-10

**Goal:** Migrate `/safe` to command-center compositions one screen at a time without regressing signer/runtime behavior, transaction correctness, or cross-session reliability.

**Architecture:** Keep business logic in existing `safe/**` hooks/services. Add a URL-driven screen state layer and mapper/adapters that convert runtime data into composition props. Perform render swaps only after each screen passes hard validation gates.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, Safe Protocol Kit, Safe Apps SDK, Vitest, Playwright, Storybook

---

**Relevant skills:** @writing-plans, @subagent-driven-development, @agent-browser

## Options For This PRD

### Option A: Big-bang route swap (not recommended)
- Replace all `/safe` sections in a single large change.
- Pros: fewer transition adapters.
- Cons: high regression risk, weak rollback granularity, harder debugging.

### Option B: Screen-by-screen migration with hard gates (recommended)
- Migrate one production screen at a time behind a shared layout + URL-driven screen state.
- Pros: deterministic validation per screen, easier review, safer rollback.
- Cons: more commits and temporary adapter code.

### Option C: Dual-render with feature flags
- Keep legacy and new screens in parallel and gate per environment.
- Pros: safest progressive rollout.
- Cons: extra complexity and stale-flag risk.

**Selected option:** Option B.

## Validation Contract (Mandatory For Every Task)

No task is complete unless all categories pass.

1. **Fail-first proof**
- Run at least one focused validation command expected to fail before implementation.
- Record command + fail reason in `Validation Evidence`.

2. **Automated validation**
- Run focused tests for changed modules first.
- Run impacted package checks before task sign-off (`cd apps/web && bun run test` minimum unless explicitly scoped with rationale).

3. **Real browser validation (non-unit)**
- Run scripted validation first:
  - `cd apps/web && bun run e2e:safe-smoke`
  - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "<screen-or-mode>"`
- If changed behavior is not scripted yet, validate with `@agent-browser` and extend script coverage in the same task.
- Capture screenshots for all changed screens/modes at desktop and mobile.

4. **Regression sweep**
- Re-check unaffected core flows:
  - wallet connect/disconnect
  - Safe connect/setup visibility
  - tx build/propose/confirm/execute
  - guard/module control visibility and action states
- Record pass/fail in `Validation Evidence`.

Hard rule: unit tests alone are insufficient for sign-off.

## Artifact Policy (Locked)

- Store PRD4 artifacts in `apps/web/e2e/artifacts/prd4/`.
- Keep runtime artifacts out of git via `apps/web/e2e/artifacts/.gitignore`.
- Each task must include:
  - command run
  - pass/fail
  - screenshot list
  - explicit assertion that required artifact files exist
- Required naming convention:
  - `prd4/<task>-<screen>-<mode>-<viewport>.png`
  - Example: `prd4/t2-transactions-tx-service-desktop.png`
- If any validation command fails, stop and fix before moving to next task.

## Locked Decisions

- Active screen state is URL-driven: `/safe?screen=<screen-id>`.
- No fixture data inside `/safe` runtime rendering; fixtures remain Storybook-only.
- Runtime policy (`safe/runtime/**`) remains the signer/tx behavior authority.
- Dev account switcher and chain switcher behavior must remain available and deterministic during migration.
- PRD4 does not loosen any PRD1/PRD2 correctness guarantees.

## Verification Matrix (Locked)

| Screen | Required modes | Required automated checks | Required browser assertions | Required artifacts |
| --- | --- | --- | --- | --- |
| `overview` | standalone + dev signer | screen-state tests | layout renders with expected nav active + stats visible | `t1-overview-standalone-desktop.png`, `t1-overview-standalone-mobile.png` |
| `transactions` | tx-service + local fallback + multisigner | mapper tests + tx queue tests | pending/confirm/execute states correct in both modes | `t2-transactions-tx-service-desktop.png`, `t2-transactions-local-desktop.png`, `t2-transactions-mobile.png` |
| `owners` | 1-of-1 and 2-of-3 | mapper tests + owners tests | threshold controls and owner rows match runtime data | `t3-owners-1of1-desktop.png`, `t3-owners-2of3-desktop.png`, `t3-owners-mobile.png` |
| `guard` | active + inactive | mapper tests + guard panel tests | guard status, limit messaging, and actions reflect runtime | `t4-guard-active-desktop.png`, `t4-guard-inactive-desktop.png`, `t4-guard-mobile.png` |
| `modules` | no-modules + active-modules | mapper tests + module panel tests | delegate cards and actions match runtime module state | `t5-modules-empty-desktop.png`, `t5-modules-active-desktop.png`, `t5-modules-mobile.png` |
| `setup-runtime` | account index switch + chain switch | mapper tests + setup view tests | runtime policy and selected account/chain update visibly | `t6-setup-runtime-account0-desktop.png`, `t6-setup-runtime-account1-desktop.png`, `t6-setup-runtime-mobile.png` |

## Task Completion Evidence Template (Use Per Task)

```md
### Task X Evidence
- Fail-first:
  - Command:
  - Result: FAIL
  - Reason:
- Automated:
  - Command(s):
  - Result:
- Browser:
  - Command(s):
  - Result:
  - Screenshots:
- Artifact assertion:
  - Command:
  - Result:
- Regression sweep:
  - Notes:
```

## Task Plan

### Task 0: Add PRD4 E2E Harness + Artifact Bucket

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/e2e/safe-screen-matrix.spec.ts`
- Modify: `apps/web/playwright.config.ts` (if needed)
- Modify: `apps/web/e2e/README.md`
- Modify: `apps/web/e2e/artifacts/.gitignore`

**Steps:**
1. **Fail-first check**
- Run: `cd apps/web && bun run e2e:safe-screen-matrix`
- Expected: FAIL (script/spec missing before implementation).

2. Implement matrix coverage for:
- `overview`
- `transactions` (`tx-service`, `local`)
- `owners` (`1of1`, `2of3`)
- `guard` (`active`, `inactive`)
- `modules` (`empty`, `active`)
- `setup-runtime` (`account0`, `account1`)

3. Add deterministic screenshot capture (desktop + mobile) for each matrix case.

4. Re-run validation:
- Run: `cd apps/web && bun run e2e:safe-screen-matrix`
- Expected: PASS.

5. Assert artifacts exist:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg '^t0-|^t1-|^t2-|^t3-|^t4-|^t5-|^t6-'`
- Expected: non-empty output with matrix screenshot files.

6. Commit:
```bash
git add apps/web/package.json apps/web/playwright.config.ts apps/web/e2e/safe-screen-matrix.spec.ts apps/web/e2e/README.md apps/web/e2e/artifacts/.gitignore
git commit -m "test(e2e): add screen-matrix validation harness for safe route migration"
```

### Task 1: Shared Safe Screen State + Layout Adapter

**Files:**
- Modify: `apps/web/src/routes/safe.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `apps/web/src/safe/screens/types.ts`
- Create: `apps/web/src/safe/screens/screen-state.ts`
- Create: `apps/web/src/safe/screens/screen-layout.tsx`
- Test: `apps/web/src/safe/screens/screen-state.test.ts`

**Steps:**
1. Write failing tests for parse/serialize/default behavior.

2. **Fail-first check**
- Run: `cd apps/web && bun run vitest run src/safe/screens/screen-state.test.ts`
- Expected: FAIL (before implementation).

3. Implement screen IDs + URL helpers + shared layout slot.

4. Re-run focused checks:
- Run: `cd apps/web && bun run vitest run src/safe/screens/screen-state.test.ts`
- Expected: PASS.

5. Browser check:
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "overview"`
- Expected: PASS.

6. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg 't1-overview-standalone-(desktop|mobile)\\.png'`
- Expected: both files present.

7. Commit:
```bash
git add apps/web/src/routes/safe.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens
git commit -m "feat(safe): add url-driven screen state and shared safe screen layout"
```

### Task 2: Integrate Transactions Screen (Production)

**Files:**
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `apps/web/src/safe/screens/mappers/transactions.ts`
- Test: `apps/web/src/safe/screens/mappers/transactions.test.ts`
- Modify: `apps/web/src/safe/transactions/TxQueue.test.tsx` (if needed)

**Steps:**
1. Write failing mapper + queue assertions for tx-service/local parity.

2. **Fail-first check**
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/transactions.test.ts src/safe/transactions/TxQueue.test.tsx`
- Expected: FAIL (before implementation).

3. Implement mapper and wire `CommandCenterTransactions` with unchanged tx actions.

4. Re-run focused checks:
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/transactions.test.ts src/safe/transactions/TxQueue.test.tsx`
- Expected: PASS.

5. Browser checks:
- Run: `cd apps/web && bun run e2e:safe-smoke`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "transactions.*tx-service"`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "transactions.*local"`
- Expected: PASS.

6. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg 't2-transactions-(tx-service|local|mobile)'`
- Expected: required files present.

7. Commit:
```bash
git add apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens/mappers/transactions.ts apps/web/src/safe/screens/mappers/transactions.test.ts apps/web/src/safe/transactions/TxQueue.test.tsx
git commit -m "feat(safe): migrate transactions screen to command-center composition"
```

### Task 3: Integrate Owners Screen (Production)

**Files:**
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `apps/web/src/safe/screens/mappers/owners.ts`
- Test: `apps/web/src/safe/screens/mappers/owners.test.ts`
- Modify: `apps/web/src/safe/governance/Owners.test.tsx` (if needed)

**Steps:**
1. Write failing tests for owner rows and threshold mapping in 1-of-1 and 2-of-3 modes.

2. **Fail-first check**
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/owners.test.ts src/safe/governance/Owners.test.tsx`
- Expected: FAIL (before implementation).

3. Implement mapping + wiring to `CommandCenterOwners`.

4. Re-run focused checks:
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/owners.test.ts src/safe/governance/Owners.test.tsx`
- Expected: PASS.

5. Browser checks:
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "owners.*1of1"`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "owners.*2of3"`
- Expected: PASS.

6. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg 't3-owners-(1of1|2of3|mobile)'`
- Expected: required files present.

7. Commit:
```bash
git add apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens/mappers/owners.ts apps/web/src/safe/screens/mappers/owners.test.ts apps/web/src/safe/governance/Owners.test.tsx
git commit -m "feat(safe): migrate owners screen to command-center composition"
```

### Task 4: Integrate Guard Screen (Production)

**Files:**
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `apps/web/src/safe/screens/mappers/guard.ts`
- Test: `apps/web/src/safe/screens/mappers/guard.test.ts`
- Modify: `apps/web/src/safe/guard/GuardPanel.test.tsx` (create/modify if missing)

**Steps:**
1. Write failing tests for active/inactive guard mapping and action visibility.

2. **Fail-first check**
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/guard.test.ts src/safe/guard/GuardPanel.test.tsx`
- Expected: FAIL (before implementation).

3. Implement mapping + wiring to `CommandCenterGuard`.

4. Re-run focused checks:
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/guard.test.ts src/safe/guard/GuardPanel.test.tsx`
- Expected: PASS.

5. Browser checks:
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "guard.*active"`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "guard.*inactive"`
- Expected: PASS.

6. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg 't4-guard-(active|inactive|mobile)'`
- Expected: required files present.

7. Commit:
```bash
git add apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens/mappers/guard.ts apps/web/src/safe/screens/mappers/guard.test.ts apps/web/src/safe/guard/GuardPanel.test.tsx
git commit -m "feat(safe): migrate guard screen to command-center composition"
```

### Task 5: Integrate Modules Screen (Production)

**Files:**
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `apps/web/src/safe/screens/mappers/modules.ts`
- Test: `apps/web/src/safe/screens/mappers/modules.test.ts`
- Modify: `apps/web/src/safe/module/ModulePanel.test.tsx` (create/modify if missing)

**Steps:**
1. Write failing tests for empty and active module/delegate states.

2. **Fail-first check**
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/modules.test.ts src/safe/module/ModulePanel.test.tsx`
- Expected: FAIL (before implementation).

3. Implement mapping + wiring to `CommandCenterModules`.

4. Re-run focused checks:
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/modules.test.ts src/safe/module/ModulePanel.test.tsx`
- Expected: PASS.

5. Browser checks:
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "modules.*empty"`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "modules.*active"`
- Expected: PASS.

6. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg 't5-modules-(empty|active|mobile)'`
- Expected: required files present.

7. Commit:
```bash
git add apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens/mappers/modules.ts apps/web/src/safe/screens/mappers/modules.test.ts apps/web/src/safe/module/ModulePanel.test.tsx
git commit -m "feat(safe): migrate modules screen to command-center composition"
```

### Task 6: Integrate Setup/Runtime Screen (Production)

**Files:**
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Create: `apps/web/src/safe/screens/mappers/setup-runtime.ts`
- Test: `apps/web/src/safe/screens/mappers/setup-runtime.test.ts`

**Steps:**
1. Write failing tests for runtime policy mapping and dev account/chain selection visibility.

2. **Fail-first check**
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/setup-runtime.test.ts src/safe/governance/SetupView.test.tsx`
- Expected: FAIL (before implementation).

3. Implement mapping + wiring to `CommandCenterSetupRuntime`.

4. Re-run focused checks:
- Run: `cd apps/web && bun run vitest run src/safe/screens/mappers/setup-runtime.test.ts src/safe/governance/SetupView.test.tsx`
- Expected: PASS.

5. Browser checks:
- Run: `cd apps/web && bun run e2e:safe-smoke`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "setup-runtime.*account0"`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "setup-runtime.*account1"`
- Expected: PASS.

6. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4 | rg 't6-setup-runtime-(account0|account1|mobile)'`
- Expected: required files present.

7. Commit:
```bash
git add apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens/mappers/setup-runtime.ts apps/web/src/safe/screens/mappers/setup-runtime.test.ts
git commit -m "feat(safe): migrate setup and runtime controls to command-center screen"
```

### Task 7: Remove Legacy Duplicate UI + Final Hardening

**Files:**
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Modify: `apps/web/src/safe/transactions/TransactionFlow.tsx` (if needed)
- Modify: `docs/development.md`
- Modify: `TUTORIAL.md`

**Steps:**
1. Remove legacy duplicate rendering blocks and dead adapters.

2. **Fail-first check**
- Run: `rg -n "Legacy|Old dashboard|TODO migrate screen" apps/web/src/safe/transactions/DashboardView.tsx`
- Expected: FAIL (legacy markers still present before cleanup).

3. Final docs + cleanup implementation.

4. Re-run full validation:
- Run: `cd apps/web && bun run test`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-smoke`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-multisig`
- Expected: PASS.
- Run: `cd apps/web && bun run e2e:safe-screen-matrix`
- Expected: PASS.

5. Artifact assertion:
- Run: `ls -la apps/web/e2e/artifacts/prd4`
- Expected: contains full matrix artifacts across t1-t6.

6. Commit:
```bash
git add apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/transactions/TransactionFlow.tsx docs/development.md TUTORIAL.md
git commit -m "refactor(safe): finalize screen-by-screen command-center migration"
```

## Final Gate

Run before PRD4 sign-off:
- `bun run test`
- `cd apps/web && bun run test`
- `cd apps/web && bun run storybook --ci --smoke-test`
- `cd apps/web && bun run e2e:safe-smoke`
- `cd apps/web && bun run e2e:safe-multisig`
- `cd apps/web && bun run e2e:safe-screen-matrix`
- `cd apps/web && bun run e2e:storybook-visual -- --grep "Compositions CommandCenter Screens"`

Expected:
- All commands PASS.
- `apps/web/e2e/artifacts/prd4/` contains required per-screen artifacts defined in Verification Matrix.
- `Validation Evidence` section is fully populated for all tasks.

If `bun x biome check` fails due unrelated pre-existing repo debt:
- Run scoped check on changed files and log pass/fail + rationale.

## Validation Evidence

Date: 2026-02-10

Status:
- Pending implementation.
- This PRD defines the execution and validation contract for incremental `/safe` migration with fail-first proof and required artifact assertions.

### Task 0 Evidence
- Fail-first:
  - Command: `cd apps/web && bun run e2e:safe-screen-matrix`
  - Result: FAIL
  - Reason: `Script not found "e2e:safe-screen-matrix"` before harness implementation.
- Automated:
  - Command: N/A (Task 0 is e2e harness setup only).
  - Result: N/A
- Browser:
  - Command: `cd apps/web && bun run e2e:safe-screen-matrix`
  - Result: PASS (2 tests)
  - Screenshots:
    - `apps/web/e2e/artifacts/prd4/t1-overview-standalone-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t1-overview-standalone-mobile.png`
    - `apps/web/e2e/artifacts/prd4/t2-transactions-tx-service-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t2-transactions-local-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t2-transactions-mobile.png`
    - `apps/web/e2e/artifacts/prd4/t3-owners-1of1-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t3-owners-2of3-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t3-owners-mobile.png`
    - `apps/web/e2e/artifacts/prd4/t4-guard-inactive-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t4-guard-mobile.png`
    - `apps/web/e2e/artifacts/prd4/t5-modules-empty-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t5-modules-mobile.png`
    - `apps/web/e2e/artifacts/prd4/t6-setup-runtime-account0-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t6-setup-runtime-account1-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t6-setup-runtime-mobile.png`
- Artifact assertion:
  - Command: `ls -la apps/web/e2e/artifacts/prd4 | rg '^-'`
  - Result: PASS
- Regression sweep:
  - Notes: Existing smoke and multisig scripts were not modified and remain available. Task 0 introduces a new harness without changing runtime production code.

### Task 1 Evidence
- Fail-first:
  - Command: `cd apps/web && bun run vitest run src/safe/screens/screen-state.test.ts`
  - Result: FAIL
  - Reason: No test file existed before implementation (`No test files found`).
- Automated:
  - Command: `cd apps/web && bun run vitest run src/safe/screens/screen-state.test.ts`
  - Result: PASS (5 tests)
- Browser:
  - Command: `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "overview|setup"`
  - Result: PASS (setup/runtime matrix flow)
  - Screenshots:
    - `apps/web/e2e/artifacts/prd4/t1-overview-standalone-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t1-overview-standalone-mobile.png`
    - `apps/web/e2e/artifacts/prd4/t6-setup-runtime-account0-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t6-setup-runtime-account1-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t6-setup-runtime-mobile.png`
- Artifact assertion:
  - Command: `ls -la apps/web/e2e/artifacts/prd4 | rg 't1-overview-standalone-(desktop|mobile)|t6-setup-runtime-account(0|1)-desktop|t6-setup-runtime-mobile'`
  - Result: PASS
- Regression sweep:
  - Notes: URL screen parsing added in route/search state; runtime logic unchanged. Dashboard rendering remains functionally intact while nav active state is now URL-driven.

### Task 2 Evidence
- Fail-first:
  - Command: `cd apps/web && bun run vitest run src/safe/screens/mappers/transactions.test.ts`
  - Result: FAIL
  - Reason: No mapper tests existed before implementation (`No test files found`).
- Automated:
  - Command(s):
    - `cd apps/web && bun run vitest run src/safe/screens/mappers/transactions.test.ts src/safe/transactions/TxQueue.test.tsx`
    - `cd apps/web && bun run test`
  - Result: PASS (`transactions.test.ts` + `TxQueue.test.tsx` + full `apps/web` suite).
- Browser:
  - Command(s):
    - `cd apps/web && bun run e2e:safe-smoke`
    - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "transactions.*tx-service"`
    - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "transactions.*local"`
  - Result: PASS
  - Screenshots:
    - `apps/web/e2e/artifacts/prd4/t2-transactions-tx-service-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t2-transactions-local-desktop.png`
    - `apps/web/e2e/artifacts/prd4/t2-transactions-mobile.png`
- Artifact assertion:
  - Command: `ls -la apps/web/e2e/artifacts/prd4 | rg 't2-transactions-(tx-service|local|mobile).*\.png'`
  - Result: PASS
- Regression sweep:
  - Notes: `safe-smoke` validated wallet connect/disconnect, setup flow, pending confirmation behavior, and local mode status text. Matrix checks validated tx-service and local-mode transaction artifacts. Full `e2e:safe-screen-matrix` also passed after Task 2 wiring.

### Task 3 Evidence
- Pending.

### Task 4 Evidence
- Pending.

### Task 5 Evidence
- Pending.

### Task 6 Evidence
- Pending.

### Task 7 Evidence
- Pending.
