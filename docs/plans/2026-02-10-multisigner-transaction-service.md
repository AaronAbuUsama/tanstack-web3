# Multi-Signer Transaction Service Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable real multi-owner Safe signing across sessions/devices by integrating Safe Transaction Service via API Kit, while preserving a clear local fallback mode.

**Architecture:** Add a thin API abstraction in `safe/core`, then migrate transaction orchestration from local-only storage to dual-mode behavior: hosted Safe Transaction Service on supported chains, local fallback on unsupported dev chains. Keep UI components mostly unchanged but feed them real confirmation state.

**Tech Stack:** React, TypeScript, Safe Protocol Kit, `@safe-global/api-kit`, wagmi, viem, Vitest

---

**Relevant skills:** @writing-plans, @subagent-driven-development

## Validation Contract (Mandatory For Every Task)

No task is complete without both automated and real browser validation.

1. **Automated checks**
- Focused tests for each changed module.
- Full `apps/web` test run before task sign-off.

2. **Real multi-session browser checks (non-unit)**
- Validate with two browser sessions/users for signer A and signer B.
- Confirm cross-session visibility of pending tx, confirmation updates, and execute gating.
- Use `@agent-browser`/Playwright and capture screenshots from both sessions.

3. **Fallback mode checks**
- Validate local-only path behavior on unsupported tx-service chains.
- Confirm UI labels clearly indicate fallback mode.

Hard rule: no task closed without evidence for the user-visible flow it changes.

### Task 1: Add API Kit Adapter Layer

**Files:**
- Create: `apps/web/src/safe/core/api.ts`
- Test: `apps/web/src/safe/core/api.test.ts` (Create)

**Step 1: Write failing tests for chain mapping and unsupported-chain behavior**

Cover:
- supported chain IDs map to expected service URLs.
- unsupported chain (e.g. 31337) throws clear error.

**Step 2: Run focused test**

Run: `cd apps/web && bun run vitest run src/safe/core/api.test.ts`
Expected: FAIL (module missing).

**Step 3: Implement adapter**

Implement:
- `getApiKit(chainId: number)`
- `proposeTransaction(...)`
- `getTransaction(...)`
- `confirmTransaction(...)`
- `getPendingTransactions(...)`

Use explicit service URL map for Mainnet, Gnosis, Sepolia, Chiado.

**Step 4: Re-run focused test**

Run: `cd apps/web && bun run vitest run src/safe/core/api.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/core/api.ts apps/web/src/safe/core/api.test.ts
git commit -m "feat(safe): add api-kit transaction service adapter"
```

### Task 2: Expand Transaction Domain Types

**Files:**
- Modify: `apps/web/src/safe/core/types.ts`
- Modify: `apps/web/src/safe/transactions/transactions.ts` (if needed)
- Test: `apps/web/src/safe/transactions/transactions.test.ts`

**Step 1: Write failing tests for signer-aware confirmation status**

Add/adjust tests to support:
- confirmation count from signer list.
- readiness based on threshold.

**Step 2: Run focused tests**

Run: `cd apps/web && bun run vitest run src/safe/transactions/transactions.test.ts`
Expected: FAIL for missing fields/helpers.

**Step 3: Implement minimal type/model updates**

Introduce normalized types for:
- pending transaction with confirmation addresses.
- execution eligibility.
- source mode (`tx-service` vs `local`).

**Step 4: Re-run focused tests**

Run same test command.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/core/types.ts apps/web/src/safe/transactions/transactions.ts apps/web/src/safe/transactions/transactions.test.ts
git commit -m "refactor(transactions): add signer-aware transaction status model"
```

### Task 3: Migrate `use-transactions` to Dual-Mode Backend

**Files:**
- Modify: `apps/web/src/safe/transactions/use-transactions.ts`
- Test: `apps/web/src/safe/transactions/use-transactions.test.ts`

**Step 1: Write failing hook tests for service mode**

Cover:
- proposes tx via API kit on supported chain.
- fetches pending queue from service.
- confirm action submits signature.
- execute enabled only when service confirmations >= threshold.

**Step 2: Run focused hook tests**

Run: `cd apps/web && bun run vitest run src/safe/transactions/use-transactions.test.ts`
Expected: FAIL.

**Step 3: Implement service-backed path**

- Resolve chain and service availability.
- Use Protocol Kit for tx creation/signing.
- Use API Kit for propose/confirm/fetch pending.
- Keep localStorage path as fallback for unsupported chain IDs.

**Step 4: Add refresh/poll behavior**

- Poll pending txs on interval in service mode.
- Keep interval modest (e.g., 10-15s).
- Clean up timer on unmount.

**Step 5: Re-run hook tests**

Run the same command.
Expected: PASS.

**Step 6: Commit**

```bash
git add apps/web/src/safe/transactions/use-transactions.ts apps/web/src/safe/transactions/use-transactions.test.ts
git commit -m "feat(transactions): support safe transaction service with local fallback"
```

### Task 4: Update Dashboard and Queue UI for Real Confirmation State

**Files:**
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Modify: `apps/web/src/safe/transactions/TxQueue.tsx`
- Modify: `apps/web/src/safe/transactions/TransactionFlow.tsx`
- Test: `apps/web/src/safe/transactions/TxQueue.test.tsx`

**Step 1: Write failing UI tests**

Add tests for:
- confirmation count display sourced from real tx state.
- execute button disabled until threshold reached.
- local fallback banner visible when tx service unavailable.

**Step 2: Run focused UI tests**

Run: `cd apps/web && bun run vitest run src/safe/transactions/TxQueue.test.tsx`
Expected: FAIL.

**Step 3: Implement UI updates**

- Pass signer-aware confirmation metadata into components.
- Show per-mode indicator (`Transaction Service` vs `Local-only`).
- Ensure optimistic states do not claim execution prematurely.

**Step 4: Re-run UI tests**

Run same command.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/transactions/TxQueue.tsx apps/web/src/safe/transactions/TransactionFlow.tsx apps/web/src/safe/transactions/TxQueue.test.tsx
git commit -m "feat(ui): render real multi-signer confirmation and execution states"
```

### Task 5: Add Safe Setup Guidance for Multi-Signer Usage

**Files:**
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Modify: `docs/development.md`
- Modify: `TUTORIAL.md`

**Step 1: Add explicit mode messaging**

In setup/dashboard, state:
- supported chains use hosted transaction service.
- local anvil uses fallback mode unless separate infra is configured.

**Step 2: Validate docs contain accurate chain/service notes**

Run: `rg -n "transaction service|local-only|anvil|chiado|multi-sig" docs/development.md TUTORIAL.md apps/web/src/safe/governance/SetupView.tsx`
Expected: clear references present.

**Step 3: Commit**

```bash
git add apps/web/src/safe/governance/SetupView.tsx docs/development.md TUTORIAL.md
git commit -m "docs(safe): clarify multi-signer transaction service and local fallback"
```

### Task 6: Validate End-to-End Behavior

**Files:**
- Validate only

**Step 1: Run automated checks**

Run:
- `bun run check`
- `bun run test`

Expected: PASS.

**Step 2: Manual sanity flow (supported chain)**

- Owner A proposes tx.
- Owner B sees same pending tx in separate session and confirms.
- Execute after threshold is met.

Capture screenshots from both sessions and attach notes to this plan under `Validation Evidence`.

**Step 3: Manual sanity flow (local fallback)**

- Verify explicit local-only label appears.
- Build/confirm/execute still works single-session.

Capture fallback screenshots and note expected/actual behavior.

**Step 4: Commit any final fixes**

```bash
git add <touched files>
git commit -m "chore: stabilize multi-signer transaction service flow"
```
