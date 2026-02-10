# Production Correctness Baseline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate known correctness regressions in Safe setup/transaction UX, lock in a deterministic mnemonic-based dev signer flow, and establish a green quality baseline before larger multi-signer and UI-system work.

**Architecture:** Introduce a single runtime policy resolver so three concepts are explicit and consistent across the app: `AppContext` (standalone vs Safe iframe), `SignerProvider` (dev wallet mnemonic account vs injected wallet vs none), and `TxSubmissionPath` (Protocol Kit direct vs Safe Apps SDK vs none). Keep this policy derived in-memory (not persisted), move dev signing from a single fixed key to mnemonic-derived account selection, and enforce deterministic browser validation through a scripted Playwright smoke flow.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, Safe Protocol Kit, Safe Apps SDK, Vitest, Biome

---

**Relevant skills:** @writing-plans, @subagent-driven-development

## Validation Contract (Mandatory For Every Task)

No task is complete without validation evidence in all three categories below.

1. **Automated validation**
- Run the task-focused tests first.
- Run impacted package checks (at minimum `apps/web` test suite).

2. **Real browser validation (non-unit)**
- Run local app and execute scripted browser coverage first (`cd apps/web && bun run e2e:safe-smoke`).
- If a changed flow is not covered yet, validate via `@agent-browser`/Playwright MCP and then extend the script in the same task.
- Capture at least one screenshot per changed user flow.

3. **Regression sweep**
- Confirm unrelated core flows still work: wallet connect, Safe setup visibility, tx builder rendering.
- Record pass/fail notes in a validation log section within this plan before final merge.

Hard rule: unit tests alone are insufficient for sign-off.

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

## Dev Wallet Signer Strategy (Locked)

**Code location:**
- Modify: `apps/web/src/web3/dev-wallet.ts`
- Modify: `apps/web/src/web3/ConnectWallet.tsx`
- Modify: `apps/web/src/routes/safe.tsx`
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Test: `apps/web/src/web3/dev-wallet.test.ts` (Create)

**Hard rules:**
- Dev signing uses mnemonic derivation, not a single hardcoded private key constant.
- Default mnemonic is the Anvil test mnemonic; allow override by env var in dev only.
- Account switching is index-based (`0`, `1`, `2`, ...), with a visible dev-only selector.
- Current dev account index is runtime-only (in-memory or URL param), never persisted in localStorage.

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
- standalone + dev connector resolves to `dev-mnemonic-account`.
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

### Task 2: Replace Fixed Dev Private Key with Mnemonic + Account Index

**Files:**
- Modify: `apps/web/src/web3/dev-wallet.ts`
- Modify: `apps/web/src/web3/ConnectWallet.tsx`
- Modify: `apps/web/src/routes/safe.tsx`
- Modify: `apps/web/src/safe/governance/SetupView.tsx`
- Modify: `apps/web/src/safe/transactions/DashboardView.tsx`
- Test: `apps/web/src/web3/dev-wallet.test.ts` (Create)

**Step 1: Write failing derivation/account-switch tests**

Cover:
- index `0` and `1` derive distinct expected addresses from the Anvil mnemonic.
- signer resolver returns the private key/account for the currently selected index.
- invalid index (negative or non-integer) is rejected with a clear error.

**Step 2: Run focused tests**

Run: `cd apps/web && bun run vitest run src/web3/dev-wallet.test.ts`
Expected: FAIL.

**Step 3: Implement shared mnemonic-based signer exports**

- Replace `DEV_WALLET_PRIVATE_KEY`-centric usage with:
  - `DEV_WALLET_MNEMONIC`
  - `getDevWalletAccount(index)`
  - `getDevWalletSigner(index)`
  - `setActiveDevWalletAccountIndex(index)` / `getActiveDevWalletAccountIndex()`
- Add a dev-only account index selector in `ConnectWallet` that reconnects with the selected signer.
- Update Safe route/setup/dashboard paths to resolve signer from the active dev account index.

**Step 4: Re-run focused tests + static checks**

Run:
- `cd apps/web && bun run vitest run src/web3/dev-wallet.test.ts`
- `rg -n "DEV_WALLET_PRIVATE_KEY" apps/web/src`

Expected:
- tests PASS
- no production path depends on a fixed single private key constant.

**Step 5: Real browser validation for signer switching**

Validate on `/safe`:
- connect with Dev Wallet account index `0`, capture address.
- switch to account index `1`, reconnect, verify rendered address changed.
- deploy/connect flow still works after account switch.

Capture screenshots under `apps/web/e2e/artifacts/`.

**Step 6: Commit**

```bash
git add apps/web/src/web3/dev-wallet.ts apps/web/src/web3/ConnectWallet.tsx apps/web/src/routes/safe.tsx apps/web/src/safe/governance/SetupView.tsx apps/web/src/safe/transactions/DashboardView.tsx apps/web/src/web3/dev-wallet.test.ts
git commit -m "feat(web3): support mnemonic-derived dev signer account switching"
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

### Task 6: Add Scripted Playwright Smoke Validation

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/safe-smoke.spec.ts`
- Create: `apps/web/e2e/README.md`

**Step 1: Add deterministic e2e runner**

Configure Playwright with:
- base URL pointing to web app dev server.
- artifact output folder (`apps/web/e2e/artifacts/`).
- one command (`bun run e2e:safe-smoke`) for local and agent execution.

**Step 2: Implement `safe-smoke` script flow**

Minimum scripted assertions:
- `/safe` loads and wallet can connect.
- dev account index can switch from `0` to `1`.
- Safe setup deploy/connect screen works after signer switch.
- pending tx UI does not claim `Ready` before threshold.

**Step 3: Run scripted browser validation**

Run: `cd apps/web && bun run e2e:safe-smoke`
Expected: PASS with screenshot artifacts generated.

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/playwright.config.ts apps/web/e2e
git commit -m "test(e2e): add scripted safe smoke validation flow"
```

### Task 7: Doc Sync + Baseline Validation

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
- `cd apps/web && bun run e2e:safe-smoke`

Expected: PASS.

**Step 4: Record validation evidence**

Record screenshots and notes in `docs/plans/2026-02-10-production-correctness-baseline.md` under `Validation Evidence`.

**Step 5: Commit**

```bash
git add docs/development.md docs/safe-app.md TUTORIAL.md
git commit -m "docs: align runtime policy documentation and remove stale references"
```

## Validation Evidence

Date: 2026-02-10

### Automated validation

- `cd apps/web && bun run vitest run src/web3/dev-wallet.test.ts src/safe/runtime/resolve-runtime-policy.test.ts src/safe/governance/SetupView.test.tsx`
  - PASS (3 files, 13 tests)
- `cd apps/web && bun run test`
  - PASS (12 files, 45 tests)
- `bun run test` (repo root)
  - PASS (`@tanstack-web3/contracts` + `@tanstack-web3/web`)
- `bun run check` (repo root)
  - FAIL due pre-existing Biome debt in unrelated files (for example `apps/web/src/components/layout/Header.tsx`, `apps/web/vite.config.ts`, `apps/web/src/safe/contracts/bytecodes.ts`). No new PRD1 files introduced check regressions.

### Real browser validation (scripted Playwright)

- `cd apps/web && bun run e2e:safe-smoke`
  - PASS
  - Verified:
    - `/safe` loads
    - Dev Wallet connect works
    - Dev Account switch `#0 -> #1` updates connected address
    - Setup flow deploys Safe after switch
    - Pending tx remains `Pending` at `1/2` and does not show `Ready`/`Execute` prematurely

Artifacts:

- `apps/web/e2e/artifacts/01-safe-connected-dev-account-0.png`
- `apps/web/e2e/artifacts/02-safe-switched-dev-account-1.png`
- `apps/web/e2e/artifacts/03-safe-setup-view.png`
- `apps/web/e2e/artifacts/04-safe-deployed-dashboard.png`
- `apps/web/e2e/artifacts/05-safe-pending-created.png`
- `apps/web/e2e/artifacts/06-safe-pending-not-ready-before-threshold.png`

### Regression sweep

- Wallet connect/disconnect path: PASS
- Safe setup visibility and deploy/connect panels: PASS
- Tx builder render and submission path: PASS
