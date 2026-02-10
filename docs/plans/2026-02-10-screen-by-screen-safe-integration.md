# Screen-by-Screen Safe Integration Plan (PRD4)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-02-10

**Goal:** Migrate the `/safe` experience to the new command-center compositions one screen at a time, while keeping existing Safe logic correct and fully validated in real browser flows.

**Architecture:** Keep all business logic in existing `safe/**` hooks/services. Introduce a screen-selection layer and lightweight view-model mappers that feed composition props. Route rendering changes only after each screen passes scripted and manual browser validation.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, Safe Protocol Kit, Safe Apps SDK, Vitest, Playwright, Storybook

---

**Relevant skills:** @writing-plans, @subagent-driven-development, @agent-browser

## Options For This PRD

### Option A: Big-bang route swap (not recommended)
- Replace all `/safe` sections in one large change.
- Pros: fewer refactors and fewer merge points.
- Cons: high regression risk; harder root-cause analysis; weak rollback granularity.

### Option B: Screen-by-screen migration with hard gates (recommended)
- Add one production screen at a time behind a shared layout and URL-driven screen state.
- Pros: clear validation per screen, clean rollback points, easier review.
- Cons: more commits and temporary adapter code.

### Option C: Dual-render feature flag per screen
- Keep old/new versions behind flags and switch per environment.
- Pros: safer rollout in shared environments.
- Cons: extra complexity and stale-flag risk.

**Selected option:** Option B.

## Validation Contract (Mandatory For Every Task)

No task is complete unless all three categories pass:

1. **Automated validation**
- Run focused tests for changed modules first.
- Run impacted package tests (`cd apps/web && bun run test` at minimum before task sign-off).

2. **Real browser validation (non-unit)**
- Run scripted flow first:
  - `cd apps/web && bun run e2e:safe-smoke`
  - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "<screen>"`
- If any changed flow is not covered, validate with `@agent-browser` and extend scripts in the same task.
- Capture screenshots for every changed screen.

3. **Regression sweep**
- Re-check unaffected core flows: wallet connect, Safe connect/setup, tx propose/confirm/execute, guard/module actions.
- Record pass/fail notes in `Validation Evidence` before closing each task.

Hard rule: unit tests alone are insufficient for sign-off.

## Artifact Policy (Locked)

- Store PRD4 artifacts in `apps/web/e2e/artifacts/prd4/`.
- Keep runtime artifacts out of git via `apps/web/e2e/artifacts/.gitignore`.
- Record command + pass/fail + screenshot paths in `Validation Evidence`.
- If a validation command fails, stop and fix before moving to the next task.

## Locked Decisions

- Active screen state is URL-driven (`/safe?screen=<name>`) for deterministic QA and deep-linking.
- No fake fixture data inside `/safe` route rendering; fixture data remains Storybook-only.
- Existing runtime policy (`safe/runtime/**`) stays the authority for signer/tx behavior.
- Preserve dev account switcher and chain switcher behavior during all migrations.

## Screen Scope (Ordered)

1. `overview`
2. `transactions`
3. `owners`
4. `guard`
5. `modules`
6. `setup-runtime`

## Task Plan

### Task 0: Add PRD4 E2E Harness + Screen Artifact Bucket

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/e2e/safe-screen-matrix.spec.ts`
- Modify: `apps/web/playwright.config.ts` (if needed)
- Modify: `apps/web/e2e/README.md`
- Modify: `apps/web/e2e/artifacts/.gitignore`

**Steps:**
1. Add a scripted matrix covering each screen (`overview`, `transactions`, `owners`, `guard`, `modules`, `setup-runtime`) in standalone dev-wallet mode.
2. Add per-screen screenshot capture under `apps/web/e2e/artifacts/prd4/`.
3. Validate:
   - `cd apps/web && bun run e2e:safe-screen-matrix`
4. Commit:
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
1. Introduce typed screen IDs and URL parse/serialize helpers.
2. Add a shared layout wrapper that wires top status + sidebar + main slot.
3. Default to `overview` when no query is provided.
4. Validate:
   - `cd apps/web && bun run vitest run src/safe/screens/screen-state.test.ts`
   - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "overview"`
5. Commit:
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
1. Map existing transaction hook data to `CommandCenterTransactions` props.
2. Keep current tx actions (`build`, `confirm`, `execute`) unchanged.
3. Validate:
   - `cd apps/web && bun run vitest run src/safe/screens/mappers/transactions.test.ts src/safe/transactions/TxQueue.test.tsx`
   - `cd apps/web && bun run e2e:safe-smoke`
   - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "transactions"`
4. Commit:
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
1. Wire owners + threshold data/actions into `CommandCenterOwners`.
2. Keep add/remove/change-threshold behavior intact.
3. Validate:
   - `cd apps/web && bun run vitest run src/safe/screens/mappers/owners.test.ts src/safe/governance/Owners.test.tsx`
   - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "owners"`
4. Commit:
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
1. Wire guard status/limit/actions into `CommandCenterGuard`.
2. Preserve deploy/enable/disable behavior.
3. Validate:
   - `cd apps/web && bun run vitest run src/safe/screens/mappers/guard.test.ts src/safe/guard/GuardPanel.test.tsx`
   - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "guard"`
4. Commit:
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
1. Wire module/delegate data and module actions into `CommandCenterModules`.
2. Preserve add/disable/execute delegate flows.
3. Validate:
   - `cd apps/web && bun run vitest run src/safe/screens/mappers/modules.test.ts src/safe/module/ModulePanel.test.tsx`
   - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "modules"`
4. Commit:
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
1. Render setup/runtime controls via `CommandCenterSetupRuntime`.
2. Preserve dev signer account switching and chain switching behavior.
3. Validate:
   - `cd apps/web && bun run vitest run src/safe/screens/mappers/setup-runtime.test.ts src/safe/governance/SetupView.test.tsx`
   - `cd apps/web && bun run e2e:safe-smoke`
   - `cd apps/web && bun run e2e:safe-screen-matrix -- --grep "setup-runtime"`
4. Commit:
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
1. Remove now-obsolete legacy section rendering blocks in `/safe`.
2. Document final screen map and testing commands.
3. Validate:
   - `cd apps/web && bun run test`
   - `cd apps/web && bun run e2e:safe-smoke`
   - `cd apps/web && bun run e2e:safe-multisig`
   - `cd apps/web && bun run e2e:safe-screen-matrix`
4. Commit:
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

If `bun x biome check` fails because of unrelated pre-existing debt, run scoped check on changed files and log results.

## Validation Evidence

Date: 2026-02-10

Status:
- Pending implementation.
- This PRD defines the execution and validation contract for incremental `/safe` migration.
