# Production Correctness Baseline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate known correctness regressions in Safe setup/transaction UX and establish a green quality baseline before larger multi-signer and UI-system work.

**Architecture:** Keep existing route and feature structure, but centralize signer constants, fix incorrect guard/module messaging, and tighten transaction status semantics so UI cannot claim readiness that backend state has not reached. Scope is intentionally limited to correctness and documentation truthfulness, not full transaction service integration.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, Safe Protocol Kit, Vitest, Biome

---

**Relevant skills:** @writing-plans, @subagent-driven-development

### Task 1: Centralize Dev Signer Constant

**Files:**
- Modify: `apps/web/src/web3/dev-wallet.ts`
- Modify: `apps/web/src/routes/safe.tsx`
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`

**Step 1: Write failing static check expectation**

Run: `rg -n "const DEV_SIGNER|HARDHAT_PRIVATE_KEY" apps/web/src/routes/safe.tsx apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/web3/dev-wallet.ts`
Expected: duplicate signer constants in multiple files.

**Step 2: Implement shared export**

- Export `DEV_WALLET_PRIVATE_KEY` from `apps/web/src/web3/dev-wallet.ts`.
- Replace local constants in the three consuming files with imports.

**Step 3: Verify duplicate removal**

Run: `rg -n "const DEV_SIGNER|HARDHAT_PRIVATE_KEY" apps/web/src/routes/safe.tsx apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/web3/dev-wallet.ts`
Expected: only one source-of-truth constant remains.

**Step 4: Commit**

```bash
git add apps/web/src/web3/dev-wallet.ts apps/web/src/routes/safe.tsx apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx
git commit -m "refactor(web3): centralize dev signer constant"
```

### Task 2: Fix Connect-to-Existing-Safe Signer Wiring

**Files:**
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Test: `apps/web/src/safe/governance/SetupView.test.tsx` (Create)

**Step 1: Write failing test**

Create test asserting `handleConnect` calls `safe.connectSafe(address, rpcUrl, signer)` with signer in dev mode.

**Step 2: Run focused test**

Run: `cd apps/web && bun run vitest run src/safe/governance/SetupView.test.tsx`
Expected: FAIL because signer argument is missing.

**Step 3: Implement minimal fix**

Update `handleConnect` to pass the shared dev signer.

**Step 4: Re-run focused test**

Run: `cd apps/web && bun run vitest run src/safe/governance/SetupView.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/governance/SetupView.test.tsx
git commit -m "fix(safe): pass signer when connecting existing safe"
```

### Task 3: Correct Guard/Module User-Facing Explanations

**Files:**
- Modify: `apps/web/src/safe/module/ModulePanel.tsx`
- Modify: `apps/web/src/safe/guard/GuardPanel.tsx`
- Modify: `apps/web/src/safe/governance/SafeOverview.tsx`

**Step 1: Locate stale claims**

Run: `rg -n "module-initiated|both owner-signed|subject to the guard|checkModuleTransaction" apps/web/src/safe`
Expected: misleading copy appears in these three components.

**Step 2: Implement copy corrections**

- Clarify module flow is independent from owner multi-sig path.
- Remove or rewrite cross-feature footnote in `SafeOverview`.
- Keep language aligned with current code behavior.

**Step 3: Verify stale phrasing removed**

Run: `rg -n "subject to the guard|both owner-signed and module-initiated" apps/web/src/safe`
Expected: zero matches.

**Step 4: Commit**

```bash
git add apps/web/src/safe/module/ModulePanel.tsx apps/web/src/safe/guard/GuardPanel.tsx apps/web/src/safe/governance/SafeOverview.tsx
git commit -m "fix(safe): correct guard and module behavior messaging"
```

### Task 4: Make Pending Transaction Status Honest

**Files:**
- Modify: `apps/web/src/safe/transactions/use-transactions.ts`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Modify: `apps/web/src/safe/transactions/TxQueue.tsx`
- Test: `apps/web/src/safe/transactions/use-transactions.test.ts` (Create)

**Step 1: Write failing tests for status semantics**

Add tests that enforce:
- `confirmations` increments per local signature, not forced to threshold.
- `isReady` is only true when confirmations >= threshold.

**Step 2: Run focused test**

Run: `cd apps/web && bun run vitest run src/safe/transactions/use-transactions.test.ts`
Expected: FAIL with current threshold-shortcut logic.

**Step 3: Implement minimal state model update**

- Track `confirmations` explicitly per local tx.
- Stop deriving signed state as immediate threshold fulfillment.
- Update `DashboardView` and `TxQueue` to use the corrected values.

**Step 4: Run related transaction tests**

Run: `cd apps/web && bun run vitest run src/safe/transactions/TxQueue.test.tsx src/safe/transactions/use-transactions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/transactions/use-transactions.ts apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/transactions/TxQueue.tsx apps/web/src/safe/transactions/use-transactions.test.ts
git commit -m "fix(transactions): correct local confirmation readiness logic"
```

### Task 5: Bring Tutorial and Safe-App Docs to Current Structure

**Files:**
- Modify: `TUTORIAL.md`
- Modify: `docs/safe-app.md`

**Step 1: Write failing doc consistency checks**

Run:
- `rg -n "src/lib/safe|components/safe|safe.transactions.tsx|buildContractCall|/safe/transactions" TUTORIAL.md docs/safe-app.md`
- `rg -n "apps/web/src/lib/safe/detect.ts" docs/safe-app.md`
Expected: stale references found.

**Step 2: Update paths/flow descriptions**

- Replace old paths with `apps/web/src/safe/core/**`, `apps/web/src/safe/**`, `apps/web/src/web3/**`.
- Remove route/function references that no longer exist.
- Update transaction flow wording to match current implementation boundaries.

**Step 3: Re-run consistency checks**

Run the same `rg` commands.
Expected: zero stale path/function matches.

**Step 4: Commit**

```bash
git add TUTORIAL.md docs/safe-app.md
git commit -m "docs: fix stale safe architecture and route references"
```

### Task 6: Re-establish Green Baseline

**Files:**
- Validate only

**Step 1: Run project checks**

Run:
- `bun run check`
- `bun run test`

Expected: both commands pass.

**Step 2: If check fails on unrelated formatting debt**

- Run scoped formatter/lint fix only on touched files.
- Re-run checks.

**Step 3: Commit validation fixes (if any)**

```bash
git add <touched files>
git commit -m "chore: restore green check and test baseline"
```

