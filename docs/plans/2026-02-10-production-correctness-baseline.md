# Production Correctness Baseline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate known correctness regressions in Safe setup/transaction UX and establish a green quality baseline before larger multi-signer and UI-system work.

**Architecture:** Introduce a single runtime policy resolver so three concepts are explicit and consistent across the app: `AppContext` (standalone vs Safe iframe), `SignerProvider` (dev private key vs injected wallet vs none), and `TxSubmissionPath` (Protocol Kit direct vs Safe Apps SDK vs none). Keep this policy derived in-memory (not persisted), centralize dev signer constants, and align UI state/docs with actual transaction behavior.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, Safe Protocol Kit, Safe Apps SDK, Vitest, Biome

---

**Relevant skills:** @writing-plans, @subagent-driven-development

## Runtime Policy Structure (Locked)

**Code location:**
- Create: `apps/web/src/safe/runtime/types.ts`
- Create: `apps/web/src/safe/runtime/resolve-runtime-policy.ts`
- Create: `apps/web/src/safe/runtime/use-runtime-policy.ts`
- Create: `apps/web/src/safe/runtime/index.ts`
- Create: `apps/web/src/safe/runtime/resolve-runtime-policy.test.ts`

**Documentation location:**
- Create: `docs/architecture/runtime-policy.md`
- Modify: `docs/development.md` (link to architecture doc)
- Modify: `docs/safe-app.md` (link to architecture doc)
- Modify: `TUTORIAL.md` (link to architecture doc)

**Hard rules:**
- Runtime policy is derived, never stored in localStorage.
- `safe-app-iframe` context must use `safe-apps-sdk` submission path.
- Standalone context can only sign when signer provider is not `none`.

### Task 1: Add Runtime Policy Module + Architecture Doc

**Files:**
- Create: `apps/web/src/safe/runtime/types.ts`
- Create: `apps/web/src/safe/runtime/resolve-runtime-policy.ts`
- Create: `apps/web/src/safe/runtime/use-runtime-policy.ts`
- Create: `apps/web/src/safe/runtime/index.ts`
- Create: `apps/web/src/safe/runtime/resolve-runtime-policy.test.ts`
- Create: `docs/architecture/runtime-policy.md`

**Step 1: Write failing policy tests**

Cover:
- iframe context resolves to `safe-apps-sdk` + no local signer.
- standalone + dev connector resolves to `dev-private-key`.
- standalone + injected resolves to `injected-eip1193`.
- standalone + no wallet resolves to `none` + no submit.

**Step 2: Run focused tests**

Run: `cd apps/web && bun run vitest run src/safe/runtime/resolve-runtime-policy.test.ts`
Expected: FAIL (files not implemented yet).

**Step 3: Implement minimal policy resolver**

Define:
- `AppContext`
- `SignerProvider`
- `TxSubmissionPath`
- `RuntimePolicy`
- `resolveRuntimePolicy(...)`

**Step 4: Add architecture doc**

`docs/architecture/runtime-policy.md` must include:
- concept definitions
- decision table
- ownership map by file
- examples for iframe, standalone-dev-wallet, standalone-injected

**Step 5: Re-run focused tests**

Run: `cd apps/web && bun run vitest run src/safe/runtime/resolve-runtime-policy.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add apps/web/src/safe/runtime docs/architecture/runtime-policy.md
git commit -m "feat(safe): add runtime policy resolver and architecture documentation"
```

### Task 2: Centralize Dev Signer Constant (No Behavior Change)

**Files:**
- Modify: `apps/web/src/web3/dev-wallet.ts`
- Modify: `apps/web/src/routes/safe.tsx`
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`

**Step 1: Write failing static check expectation**

Run: `rg -n "const DEV_SIGNER|HARDHAT_PRIVATE_KEY" apps/web/src/routes/safe.tsx apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/web3/dev-wallet.ts`
Expected: duplicate constants in multiple files.

**Step 2: Implement shared export**

- Export `DEV_WALLET_PRIVATE_KEY` from `apps/web/src/web3/dev-wallet.ts`.
- Replace local constants in consuming files with imports.

**Step 3: Re-run check command**

Run same `rg` command.
Expected: single source-of-truth key declaration.

**Step 4: Commit**

```bash
git add apps/web/src/web3/dev-wallet.ts apps/web/src/routes/safe.tsx apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx
git commit -m "refactor(web3): centralize dev wallet private key constant"
```

### Task 3: Fix Connect-to-Existing-Safe Signer Wiring + Guard Rails

**Files:**
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Test: `apps/web/src/safe/governance/SetupView.test.tsx` (Create)

**Step 1: Write failing tests**

Test matrix:
- when using dev wallet in standalone, `connectSafe` receives signer.
- when signer provider is `none`, connect action is blocked with clear error.

**Step 2: Run focused tests**

Run: `cd apps/web && bun run vitest run src/safe/governance/SetupView.test.tsx`
Expected: FAIL.

**Step 3: Implement minimal fix**

- pass signer where required (dev wallet path)
- gate connect/deploy buttons with policy-derived `canSign`

**Step 4: Re-run focused tests**

Run same command.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/governance/SetupView.test.tsx
git commit -m "fix(safe): wire signer policy into existing safe connection flow"
```

### Task 4: Correct Guard/Module User-Facing Explanations

**Files:**
- Modify: `apps/web/src/safe/module/ModulePanel.tsx`
- Modify: `apps/web/src/safe/guard/GuardPanel.tsx`
- Modify: `apps/web/src/safe/governance/SafeOverview.tsx`

**Step 1: Locate stale claims**

Run: `rg -n "module-initiated|subject to the guard|both owner-signed|guard.*module" apps/web/src/safe`
Expected: misleading copy found.

**Step 2: Implement copy corrections**

- clarify guard path vs module path independence
- remove incorrect “guard checks module tx” copy

**Step 3: Verify removal**

Run: `rg -n "subject to the guard|both owner-signed and module-initiated" apps/web/src/safe`
Expected: zero matches.

**Step 4: Commit**

```bash
git add apps/web/src/safe/module/ModulePanel.tsx apps/web/src/safe/guard/GuardPanel.tsx apps/web/src/safe/governance/SafeOverview.tsx
git commit -m "fix(safe): correct guard and module behavior messaging"
```

### Task 5: Make Pending Transaction Status Honest

**Files:**
- Modify: `apps/web/src/safe/transactions/use-transactions.ts`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Modify: `apps/web/src/safe/transactions/TxQueue.tsx`
- Test: `apps/web/src/safe/transactions/use-transactions.test.ts` (Create)

**Step 1: Write failing tests for local flow semantics**

Assert:
- confirmations are counted explicitly, not auto-equal to threshold on first signature.
- ready state is `confirmations >= threshold`.
- iframe submission is not auto-labeled as on-chain executed unless receipt is known.

**Step 2: Run focused tests**

Run: `cd apps/web && bun run vitest run src/safe/transactions/use-transactions.test.ts src/safe/transactions/TxQueue.test.tsx`
Expected: FAIL.

**Step 3: Implement minimal state model update**

- add `confirmations` field in local transaction model
- derive `isReady` from actual confirmation count
- remove premature executed labeling in iframe path (mark as proposed/pending equivalent)

**Step 4: Re-run focused tests**

Run same command.
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/safe/transactions/use-transactions.ts apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/safe/transactions/TxQueue.tsx apps/web/src/safe/transactions/use-transactions.test.ts
git commit -m "fix(transactions): make pending and readiness status truthful"
```

### Task 6: Doc Sync + Baseline Validation

**Files:**
- Modify: `docs/development.md`
- Modify: `docs/safe-app.md`
- Modify: `TUTORIAL.md`

**Step 1: Add links to runtime policy architecture doc**

Add a short section in each file pointing to `docs/architecture/runtime-policy.md`.

**Step 2: Remove stale architecture/path references**

Run:
- `rg -n "src/lib/safe|safe.transactions.tsx|buildContractCall|apps/web/src/lib/safe/detect.ts" TUTORIAL.md docs/safe-app.md docs/development.md`
Expected: zero matches.

**Step 3: Run full validation**

Run:
- `bun run check`
- `bun run test`

Expected: PASS.

**Step 4: Commit**

```bash
git add docs/development.md docs/safe-app.md TUTORIAL.md
git commit -m "docs: align runtime policy documentation and remove stale references"
```

