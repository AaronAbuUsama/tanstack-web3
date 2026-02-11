# Core Flow Browser Validation PRD (Agent-Browser First)

> **For Claude/Codex:** REQUIRED SKILL: `agent-browser` (mandatory for all real-flow validation tasks in this PRD).

**Goal:** Validate and harden all production-critical Safe flows in real browser sessions, with deterministic evidence and bug isolation, before further feature work. This PRD explicitly targets unresolved functional concerns around module allowance creation/spending, guard behavior, owner management, and threshold updates.

**Architecture:** Keep current runtime architecture (`/safe` setup + command-center screens) and run scenario-driven validation against real app state with deterministic dev signer accounts. Every scenario must collect browser artifacts and produce a pass/fail outcome tied to observable UI + chain-backed behavior.

**Tech Stack:** TanStack Start, React, TypeScript, wagmi, Safe Protocol Kit, local Anvil fork (Chiado), Playwright tests, `agent-browser` skill

---

## Validation Contract (Mandatory)

No task is complete without all 4 evidence categories:

1. **Scripted automated validation**
- Run targeted unit/integration checks for touched logic.
- Run scripted e2e (`safe-smoke`, `safe-screen-matrix`, `safe-multisig`) after each major fix group.

2. **Agent-browser real-flow validation (required)**
- Use `agent-browser` commands for every core flow below.
- Capture screenshots at each gate (before action, after action, final state).
- Save screenshots under `apps/web/e2e/artifacts/prd5/`.

3. **State correctness checks**
- Confirm on-screen state is honest (no fabricated activity, no stale badges, no fake confirmations).
- Confirm actions mutate state in expected direction and survive refresh.

4. **Regression sweep**
- Confirm setup page, connect flow, navigation, and disconnect remain stable after each fix.

Hard rule: Unit tests or Playwright alone are insufficient. `agent-browser` evidence is required.

## Scope

### In scope
- Safe setup and connection flow.
- Owner add/remove.
- Threshold update.
- Guard deploy/enable/disable + limit update semantics.
- Module deploy/enable/disable.
- Allowance create/update flow.
- Delegate spend flow and post-spend state updates.
- Pending/sign/execute transaction lifecycle.

### Out of scope
- Storybook visual-only stories.
- Non-Safe routes except regression checks for landing and top-level navigation behavior.

## Environment Baseline

Run before any scenario:

```bash
bun run --cwd /Users/abuusama/projects/starter-dapp/tanstack-web3/apps/web e2e:safe-smoke
```

Then start manual browser validation session:

```bash
agent-browser open http://localhost:3000/safe
agent-browser snapshot -i
```

If RPC is unavailable, start/restart Anvil fork:

```bash
bun run --cwd /Users/abuusama/projects/starter-dapp/tanstack-web3 dev:anvil
```

## Scenario Matrix (Core Flows)

### Scenario 1: Safe Setup + Deterministic Wallet Session

**Objective:** Setup screen is stable; connect is deterministic; no header thrash.

**Steps (agent-browser):**
- Open `/safe`, select `Anvil (Chiado Fork)` network, click `Connect Wallet`.
- Verify exactly one connected header state (`Disconnect` visible, no `Dev Wallet` button).
- Verify `Dev Account` switcher appears only after dev-chain connect.
- Switch account `#0 -> #1`, verify address changes.
- Capture screenshots:
  - `s1-setup-disconnected.png`
  - `s1-setup-connected-account0.png`
  - `s1-setup-connected-account1.png`

**Pass criteria:**
- No reconnect/disconnect loop.
- No duplicated headers.
- No legacy wallet button variant.

### Scenario 2: Create Safe (2-of-3) + Baseline Navigation

**Objective:** Create new Safe and confirm screen navigation integrity.

**Steps:**
- In setup, create owners `[account0, account1, account2]`, set threshold `2`, deploy.
- Verify command-center loads with created safe address.
- Navigate `Overview -> Transactions -> Owners -> Guard -> Modules`.
- Capture screenshots:
  - `s2-overview-created.png`
  - `s2-transactions-empty.png`
  - `s2-owners-initial.png`
  - `s2-guard-initial.png`
  - `s2-modules-initial.png`

**Pass criteria:**
- Navigation links update URL/search state correctly.
- No route drops back to setup unless disconnected.

### Scenario 3: Owners + Threshold Mutation

**Objective:** Add/remove owner and change threshold with correct constraints.

**Steps:**
- Add one owner from Owners screen.
- Verify owner list increments and UI reflects signer set.
- Change threshold to a higher valid value, verify success state.
- Remove an owner, verify threshold auto-validates (or prompts for valid threshold).
- Refresh page and confirm persisted state.
- Capture:
  - `s3-owners-added.png`
  - `s3-threshold-updated.png`
  - `s3-owner-removed.png`
  - `s3-owners-refreshed.png`

**Pass criteria:**
- Owner and threshold state are chain-consistent after reload.
- No impossible threshold accepted.

### Scenario 4: Guard Lifecycle

**Objective:** Verify guard contract lifecycle and behavior hints are coherent.

**Steps:**
- Deploy guard from Guard screen.
- Enable guard on Safe.
- Update spending limit value and apply.
- Disable guard.
- Capture:
  - `s4-guard-deployed.png`
  - `s4-guard-enabled.png`
  - `s4-guard-limit-updated.png`
  - `s4-guard-disabled.png`

**Pass criteria:**
- Status banner and action buttons reflect true guard state.
- Limit display/metadata updates and persists across refresh.

### Scenario 5: Module Lifecycle + Allowance Semantics (Critical)

**Objective:** Diagnose and fix module allowance bugs reported by user.

**Known concern to investigate:**
- Delegate/allowance card shows unclear address.
- Cannot create new allowance reliably.
- Cannot spend from allowance.

**Steps:**
- Deploy AllowanceModule.
- Enable module.
- Create allowance for a known delegate address (explicitly entered).
- Verify created allowance row identity:
  - delegate address matches entered address
  - used/remaining values reflect configured amount.
- Execute spend as delegate flow.
- Verify allowance used increments and remaining decreases.
- Capture:
  - `s5-module-enabled.png`
  - `s5-allowance-created.png`
  - `s5-allowance-post-refresh.png`
  - `s5-spend-submitted.png`
  - `s5-allowance-after-spend.png`

**Pass criteria:**
- Allowance rows are not hardcoded/fabricated.
- Address identity is deterministic and understandable.
- Spend action materially mutates allowance state.

### Scenario 6: Pending Transaction Honesty + Activity Integrity

**Objective:** Confirm no fake activity and pending state reflects real confirmations.

**Steps:**
- Create a transaction from Transactions screen.
- Sign once (below threshold), verify `Execute` remains unavailable.
- Sign with second owner, verify `Execute` becomes available.
- Execute and verify moved/updated activity state.
- Validate fresh Safe shows no fake history/activity entries.
- Capture:
  - `s6-pending-created.png`
  - `s6-pending-1of2.png`
  - `s6-pending-2of2-ready.png`
  - `s6-executed.png`
  - `s6-fresh-safe-empty-activity.png`

**Pass criteria:**
- Confirmation count is accurate.
- Activity panel does not show non-existent events.

## Execution Method (Agent-Browser Required)

For each scenario:

1. `agent-browser open http://localhost:3000/safe`
2. `agent-browser snapshot -i`
3. Interact with `agent-browser click/fill/select`
4. `agent-browser screenshot apps/web/e2e/artifacts/prd5/<name>.png`
5. Record step result in validation log (pass/fail + notes)

Use semantic commands where possible:

```bash
agent-browser find role button click --name "Connect Wallet"
agent-browser find label "Safe Address" fill "0x..."
agent-browser screenshot apps/web/e2e/artifacts/prd5/example.png
```

## Deliverables

- Browser evidence set under `apps/web/e2e/artifacts/prd5/`.
- Updated bug list with root cause + fix mapping.
- Updated/added automated tests for any fixed bug.
- Final validation summary appended to this PRD.

## Exit Criteria

- All 6 scenarios pass with screenshots.
- `bun run e2e:safe-smoke`, `bun run e2e:safe-screen-matrix`, `bun run e2e:safe-multisig` pass.
- No unresolved critical blocker in module allowance or owner/threshold/guard mutation flows.

## Validation Log (To Fill During Execution)

Date:

Scenario 1:
- Status:
- Notes:
- Artifacts:

Scenario 2:
- Status:
- Notes:
- Artifacts:

Scenario 3:
- Status:
- Notes:
- Artifacts:

Scenario 4:
- Status:
- Notes:
- Artifacts:

Scenario 5:
- Status:
- Notes:
- Artifacts:

Scenario 6:
- Status:
- Notes:
- Artifacts:
