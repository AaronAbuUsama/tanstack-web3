# Scenario 3-4-5 Correctness Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the remaining core-flow correctness gaps from the browser audit: owner/threshold governance actions (Scenario 3), guard limit behavior (Scenario 4), and module allowance/delegate spend integrity (Scenario 5).

**Architecture:** Move governance-affecting actions to deterministic, signer-aware transaction paths, remove mocked module/allowance presentation, and align guard UI behavior with on-chain capabilities. Every deliverable must be proven with automated checks and real `agent-browser` evidence.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, viem, Safe Protocol Kit, Foundry, Playwright, agent-browser

---

**Relevant skills:** `@writing-plans`, `@subagent-driven-development`, `@agent-browser`

## Validation Contract (Hard Gate)

No task is complete without all three:

1. **Automated validation**
- Focused tests for touched modules.
- Relevant package tests (at minimum `apps/web` test suite; include contracts tests when Solidity changes).

2. **Real browser validation using `agent-browser`**
- Perform scenario-specific verification in a real running app.
- Capture screenshots and text snapshots at each gate.

3. **Evidence entry in this PRD**
- Update `Validation Evidence Log` with pass/fail, artifact paths, and notes.

Hard rule: a code change without `agent-browser` artifacts is incomplete.

## Artifact Policy (Locked)

All remediation evidence goes under:

- `apps/web/e2e/artifacts/prd6/`

Required artifact types per scenario step:

- screenshot: `*.png`
- semantic state snapshot: `*.txt` (output of `agent-browser snapshot -c`)
- optional console/network capture when debugging: `*-console.txt`

Required naming format:

- `s3-*` for Scenario 3 evidence
- `s4-*` for Scenario 4 evidence
- `s5-*` for Scenario 5 evidence

## Task 0: Verification Harness + Repeatable Session Setup

**Files:**
- Modify: `docs/plans/2026-02-11-scenario-3-4-5-correctness-remediation.md` (validation log section only)
- Modify: `apps/web/e2e/README.md`

**Step 1: Add explicit manual verification commands to e2e docs**

Document:
- dedicated app port launch
- anvil health check
- `agent-browser` session lifecycle
- artifact save commands

**Step 2: Run baseline scripted suites before code changes**

Run:
- `cd apps/web && bun run e2e:safe-smoke`
- `cd apps/web && bun run e2e:safe-screen-matrix`
- `cd apps/web && bun run e2e:safe-multisig`

Expected: PASS (baseline checkpoint before remediation changes).

**Step 3: Capture baseline manual evidence**

Run with `agent-browser`:
- open `/safe`
- connect on Anvil (Chiado fork)
- capture baseline state screenshot/snapshot

Artifacts:
- `apps/web/e2e/artifacts/prd6/baseline-safe-connected.png`
- `apps/web/e2e/artifacts/prd6/baseline-safe-connected.txt`

**Step 4: Commit**

```bash
git add apps/web/e2e/README.md docs/plans/2026-02-11-scenario-3-4-5-correctness-remediation.md
git commit -m "docs(test): add repeatable prd6 browser verification harness"
```

## Task 1: Governance Action Path Hardening (Scenario 3 Foundation)

**Files:**
- Modify: `apps/web/src/safe/transactions/use-transactions.ts`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Modify: `apps/web/src/safe/transactions/transactions.ts`
- Create: `apps/web/src/safe/governance/actions.ts`
- Test: `apps/web/src/safe/transactions/use-transactions.test.ts`
- Test: `apps/web/src/safe/governance/actions.test.ts`

**Step 1: Write failing tests for governance-action transaction path**

Cover:
- owner add/remove/threshold actions create signable pending transactions (do not claim immediate execution when threshold > confirmations).
- pending entries appear with correct confirmation gating.

**Step 2: Run focused tests to verify failures**

Run:
- `cd apps/web && bun x vitest run src/safe/transactions/use-transactions.test.ts src/safe/governance/actions.test.ts`

Expected: FAIL for missing governance transaction proposal behavior.

**Step 3: Implement governance action encoding + queue integration**

- Encode owner/threshold contract calls into Safe transactions.
- Route owner governance actions through same pending/sign/execute lifecycle.
- Ensure UI messaging reflects “proposed / awaiting signatures” instead of pretending completion.

**Step 4: Re-run focused tests**

Run same command as Step 2.

Expected: PASS.

**Step 5: Real browser verification (agent-browser, mandatory)**

Flow:
- create/connect to 2-of-3 safe
- on Owners screen trigger threshold change
- verify transaction enters pending queue
- sign with account A only, verify execute unavailable
- sign with account B, verify execute available and completes

Artifacts:
- `apps/web/e2e/artifacts/prd6/s3-threshold-proposed.png`
- `apps/web/e2e/artifacts/prd6/s3-threshold-proposed.txt`
- `apps/web/e2e/artifacts/prd6/s3-threshold-1of2.png`
- `apps/web/e2e/artifacts/prd6/s3-threshold-2of2-ready.png`
- `apps/web/e2e/artifacts/prd6/s3-threshold-executed.png`

**Step 6: Commit**

```bash
git add apps/web/src/safe/transactions/use-transactions.ts apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/transactions/transactions.ts apps/web/src/safe/governance/actions.ts apps/web/src/safe/transactions/use-transactions.test.ts apps/web/src/safe/governance/actions.test.ts
git commit -m "feat(governance): route owner and threshold actions through pending transaction lifecycle"
```

## Task 2: Owners Screen Deterministic UX (No Prompt-Based Input)

**Files:**
- Modify: `apps/web/src/design-system/compositions/command-center/CommandCenterOwners.tsx`
- Modify: `apps/web/src/design-system/compositions/command-center/command-center.css`
- Test: `apps/web/src/design-system/compositions/command-center/CommandCenterOwners.test.tsx`

**Step 1: Write failing component tests**

Cover:
- add-owner uses explicit inline form/modal input (no `window.prompt` path).
- remove-owner action remains available with clear disabled states.

**Step 2: Run focused tests**

Run:
- `cd apps/web && bun x vitest run src/design-system/compositions/command-center/CommandCenterOwners.test.tsx`

Expected: FAIL before implementation.

**Step 3: Implement deterministic owner add form**

- Replace `window.prompt` with explicit UI input + submit action.
- Show validation errors inline for invalid addresses.

**Step 4: Re-run focused tests**

Run same command as Step 2.

Expected: PASS.

**Step 5: Real browser verification (agent-browser, mandatory)**

Flow:
- open Owners screen
- add owner via new explicit input control
- remove owner through action button
- verify pending governance entries and final state after confirmations

Artifacts:
- `apps/web/e2e/artifacts/prd6/s3-owner-add-form.png`
- `apps/web/e2e/artifacts/prd6/s3-owner-add-proposed.png`
- `apps/web/e2e/artifacts/prd6/s3-owner-remove-proposed.png`
- `apps/web/e2e/artifacts/prd6/s3-owner-state-refreshed.png`

**Step 6: Commit**

```bash
git add apps/web/src/design-system/compositions/command-center/CommandCenterOwners.tsx apps/web/src/design-system/compositions/command-center/command-center.css apps/web/src/design-system/compositions/command-center/CommandCenterOwners.test.tsx
git commit -m "feat(owners): replace prompt-based owner changes with deterministic inline controls"
```

## Task 3: Guard Limit Behavior Remediation (Scenario 4)

**Files:**
- Modify: `packages/contracts/src/SpendingLimitGuard.sol`
- Modify: `packages/contracts/test/SpendingLimitGuard.t.sol`
- Modify: `apps/web/src/safe/contracts/abis.ts`
- Modify: `apps/web/src/design-system/compositions/command-center/CommandCenterGuard.tsx`
- Modify: `apps/web/src/safe/screens/mappers/guard.ts`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Test: `apps/web/src/safe/screens/mappers/guard.test.ts`

**Step 1: Write failing contract and UI tests**

Contract tests:
- `setSpendingLimit` restricted to Safe caller.
- spending limit updates and affects guard checks.

UI tests:
- when guard active, explicit limit update action exists and triggers update transaction flow.

**Step 2: Run failing tests**

Run:
- `cd packages/contracts && forge test --match-contract SpendingLimitGuardTest -vv`
- `cd apps/web && bun x vitest run src/safe/screens/mappers/guard.test.ts`

Expected: FAIL before implementation.

**Step 3: Implement guard limit update capability**

- Add `setSpendingLimit(uint256)` and event in guard contract with safe-only guardrail.
- Update ABI and app flow to call limit-update path.
- Keep deploy/enable/disable actions explicit and non-ambiguous.

**Step 4: Re-run tests**

Run same commands as Step 2.

Expected: PASS.

**Step 5: Real browser verification (agent-browser, mandatory)**

Flow:
- deploy guard
- enable guard
- update limit to new value (e.g., `0.5 ETH`)
- refresh and confirm updated value still displayed
- disable guard and verify status flips

Artifacts:
- `apps/web/e2e/artifacts/prd6/s4-guard-deployed.png`
- `apps/web/e2e/artifacts/prd6/s4-guard-enabled.png`
- `apps/web/e2e/artifacts/prd6/s4-limit-update-submitted.png`
- `apps/web/e2e/artifacts/prd6/s4-limit-updated-refreshed.png`
- `apps/web/e2e/artifacts/prd6/s4-guard-disabled.png`

**Step 6: Commit**

```bash
git add packages/contracts/src/SpendingLimitGuard.sol packages/contracts/test/SpendingLimitGuard.t.sol apps/web/src/safe/contracts/abis.ts apps/web/src/design-system/compositions/command-center/CommandCenterGuard.tsx apps/web/src/safe/screens/mappers/guard.ts apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/screens/mappers/guard.test.ts
git commit -m "feat(guard): implement and validate on-chain guard limit update flow"
```

## Task 4: Module Allowance + Delegate Spend Integrity (Scenario 5 Critical Fix)

**Files:**
- Create: `apps/web/src/safe/module/allowance-service.ts`
- Create: `apps/web/src/safe/module/types.ts`
- Modify: `apps/web/src/safe/screens/mappers/modules.ts`
- Modify: `apps/web/src/design-system/compositions/command-center/CommandCenterModules.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Modify: `apps/web/src/safe/contracts/abis.ts` (if additional ABI fragments needed)
- Test: `apps/web/src/safe/module/allowance-service.test.ts`
- Test: `apps/web/src/safe/screens/mappers/modules.test.ts`

**Step 1: Write failing tests for real module state mapping**

Cover:
- delegate list resolved from on-chain allowance events/state, not from module-address placeholders.
- allowance `used/total/available` values reflect contract state.
- execute spend updates usage values after transaction receipt.

**Step 2: Run failing tests**

Run:
- `cd apps/web && bun x vitest run src/safe/module/allowance-service.test.ts src/safe/screens/mappers/modules.test.ts`

Expected: FAIL before implementation.

**Step 3: Implement real allowance service + UI wiring**

- Read delegates from `AllowanceSet` logs for active module.
- Read per-delegate allowance struct and available allowance from contract.
- Wire `Set Allowance` to Safe-executed module call.
- Wire `Execute Spend` to delegate-executed module call with signer/address guardrails.
- Remove fake `0.00 / 0.00` placeholders and hardcoded “available” copy.

**Step 4: Re-run tests**

Run same command as Step 2.

Expected: PASS.

**Step 5: Real browser verification (agent-browser, mandatory)**

Flow:
- deploy + enable module
- set allowance for delegate address
- verify delegate card address and values update
- refresh and verify persistence
- switch to delegate account and execute spend
- verify used increases and available decreases

Artifacts:
- `apps/web/e2e/artifacts/prd6/s5-module-enabled.png`
- `apps/web/e2e/artifacts/prd6/s5-allowance-set-submitted.png`
- `apps/web/e2e/artifacts/prd6/s5-allowance-card-updated.png`
- `apps/web/e2e/artifacts/prd6/s5-allowance-refreshed.png`
- `apps/web/e2e/artifacts/prd6/s5-spend-submitted.png`
- `apps/web/e2e/artifacts/prd6/s5-allowance-after-spend.png`

**Step 6: Commit**

```bash
git add apps/web/src/safe/module/allowance-service.ts apps/web/src/safe/module/types.ts apps/web/src/safe/screens/mappers/modules.ts apps/web/src/design-system/compositions/command-center/CommandCenterModules.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/contracts/abis.ts apps/web/src/safe/module/allowance-service.test.ts apps/web/src/safe/screens/mappers/modules.test.ts
git commit -m "fix(module): replace mocked allowance UI with real delegate state and spend flow"
```

## Task 5: Full Regression + Evidence Sign-Off

**Files:**
- Modify: `docs/plans/2026-02-11-scenario-3-4-5-correctness-remediation.md` (validation log only)

**Step 1: Run full automated regression**

Run:
- `cd apps/web && bun x vitest run`
- `cd apps/web && bun run e2e:safe-smoke`
- `cd apps/web && bun run e2e:safe-screen-matrix`
- `cd apps/web && bun run e2e:safe-multisig`
- `cd packages/contracts && forge test -vv`

Expected: PASS.

**Step 2: Re-run manual Scenario 3/4/5 via agent-browser**

Use same artifact naming scheme and ensure each critical transition has screenshot + snapshot evidence.

Expected:
- Scenario 3: PASS
- Scenario 4: PASS
- Scenario 5: PASS

**Step 3: Update validation log in this PRD**

For each scenario:
- Status
- Notes
- Artifact list
- Remaining risks

**Step 4: Commit**

```bash
git add docs/plans/2026-02-11-scenario-3-4-5-correctness-remediation.md
git commit -m "docs(prd6): record scenario 3/4/5 remediation validation evidence"
```

## Exit Criteria

- Scenario 3 owner/threshold flow fully passes with deterministic UI and multisig-aware execution states.
- Scenario 4 guard limit update flow is real, test-covered, and browser-validated.
- Scenario 5 allowance/delegate spend flow reflects truthful on-chain state and survives refresh.
- All automated suites listed in Task 5 pass.
- Validation evidence in `apps/web/e2e/artifacts/prd6/` is complete and referenced in this PRD.

## Validation Evidence Log (To Fill During Execution)

Date: 2026-02-11

Task 0:
- Status: PASS
- Automated checks:
  - `cd apps/web && bun run e2e:safe-smoke` -> PASS
  - `cd apps/web && bun run e2e:safe-screen-matrix` -> PASS
  - `cd apps/web && bun run e2e:safe-multisig` -> PASS
- Browser evidence:
  - `apps/web/e2e/artifacts/prd6/baseline-safe-connected.png`
  - `apps/web/e2e/artifacts/prd6/baseline-safe-connected.txt`
- Notes:
  - Dedicated `agent-browser` session (`prd6`) used on `http://localhost:3002/safe`.
  - Anvil RPC healthy on `127.0.0.1:8545`.

Task 1:
- Status:
- Automated checks:
- Browser evidence:
- Notes:

Task 2:
- Status:
- Automated checks:
- Browser evidence:
- Notes:

Task 3:
- Status:
- Automated checks:
- Browser evidence:
- Notes:

Task 4:
- Status:
- Automated checks:
- Browser evidence:
- Notes:

Task 5:
- Status:
- Automated checks:
- Browser evidence:
- Notes:
