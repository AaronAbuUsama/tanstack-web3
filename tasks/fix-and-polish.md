# Fix & Polish: Correctness, Multi-Signer, UI Text, Tutorial

## Context

This plan addresses all known issues after the folder restructure. The boilerplate
should be a correct, honest, pick-up-and-go starting point for Safe developers.

---

## Work Stream 1: Fix Misleading UI Text

The guard and module are **orthogonal features**. The guard constrains owner-initiated
transactions via `Safe.execTransaction()`. The module empowers non-owner delegates via
`Safe.execTransactionFromModule()`. They operate on different code paths.

### 1a. Fix ModulePanel InfoSection

**File**: `apps/web/src/safe/module/ModulePanel.tsx:199-205`

Current text (WRONG):
> "If a guard is active, module transactions are still subject to the guard's checks."

Replace with something like:
> "Module transactions bypass the multi-sig flow entirely — the delegate calls the
> module directly. The module's own allowance logic (amount, spent, reset period)
> controls spending. This is independent of any transaction guard."

### 1b. Fix SafeOverview guard+module footnote

**File**: `apps/web/src/safe/governance/SafeOverview.tsx:99-103`

Current text (WRONG):
```tsx
{guard && moduleCount > 0 && (
  <p>The guard checks both owner-signed and module-initiated transactions.</p>
)}
```

Replace with:
> "The guard checks owner-signed transactions. Modules have their own spending controls."

Or remove the footnote entirely — it only shows when both are active and adds confusion.

### 1c. Fix GuardPanel InfoSection

**File**: `apps/web/src/safe/guard/GuardPanel.tsx:96-101`

Current text:
> "A guard is a smart contract that inspects every transaction the Safe tries to execute."

This is vague enough to be OK, but clarify:
> "A guard is a smart contract that inspects every owner-signed transaction before it
> executes. If the guard's check fails, the transaction is blocked. The SpendingLimitGuard
> blocks any single transaction transferring more than the configured ETH limit."

Remove any implication that it checks module transactions.

### 1d. Review all InfoSection / description text

Grep for any other mentions of "guard" and "module" together and fix any text that
implies they interact. Key phrase to search: `checkModuleTransaction`, `module-initiated`,
`guard.*module`.

---

## Work Stream 2: Fix "Connect to Existing Safe" Missing Signer

### Bug

When you use "Connect to Existing Safe" in SetupView, the `connectSafe` call does NOT
pass a signer:

**File**: `apps/web/src/safe/governance/SetupView.tsx:38`
```ts
await safe.connectSafe(connectAddress, rpcUrl)  // <-- no signer!
```

This means the resulting `safeInstance` can read but cannot sign transactions. The first
operation attempt in DashboardView (add owner, build tx, etc.) will fail because
`signTransaction` requires a signer-initialized instance.

Compare with deploy flow (`SetupView.tsx:23-28`) which passes the signer correctly,
and with DashboardView reconnects (`DashboardView.tsx:48,65,81`) which pass `DEV_SIGNER`.

### Fix

Pass `DEV_SIGNER` to `connectSafe` in SetupView:

```ts
await safe.connectSafe(connectAddress, rpcUrl, DEV_SIGNER)
```

### DEV_SIGNER duplication

`DEV_SIGNER` is defined in three files:
- `apps/web/src/routes/safe.tsx:11`
- `apps/web/src/safe/transactions/DashboardView.tsx:20`
- `apps/web/src/safe/governance/SetupView.tsx:4`

Extract to a single constant, e.g., `apps/web/src/web3/dev-wallet.ts` (already exists —
it exports the dev wallet connector). Add an export for the private key constant there,
or create `apps/web/src/web3/constants.ts`. Import everywhere else.

---

## Work Stream 3: Multi-Signer Support (No Docker Required)

### Problem

Currently `use-transactions.ts` stores pending transactions in **localStorage**. This means:
- Only one browser session can see pending txs
- Other signers on other machines can't see or sign them
- Multi-sig (threshold > 1) is non-functional across sessions

The Docker compose (`docker/docker-compose.yml`) exists with Safe Transaction Service,
Postgres, Redis, and Anvil — but it's NOT wired to the frontend at all.

### Solution: Safe Transaction Service API (hosted by Safe)

Safe operates hosted Transaction Service instances for supported chains:
- Mainnet: `https://safe-transaction-mainnet.safe.global`
- Gnosis: `https://safe-transaction-gnosis-chain.safe.global`
- Sepolia: `https://safe-transaction-sepolia.safe.global`
- Chiado: `https://safe-transaction-chiado.safe.global` (if available)

Use `@safe-global/api-kit` to connect to these. This gives real multi-session signing
with zero infrastructure.

For **local Anvil** (chain 31337), the hosted service doesn't work. Options:
1. Document that multi-sig testing on Anvil requires Docker (`docker compose up`)
2. OR provide a "simulate multi-sig" mode for Anvil where you can sign with multiple
   Anvil accounts in the same session (accounts #0 through #9 are all pre-funded)

### Implementation Plan

#### 3a. Add API Kit dependency

```bash
bun add @safe-global/api-kit
```

#### 3b. Create `apps/web/src/safe/core/api.ts`

Thin wrapper around API Kit:

```ts
export function getApiKit(chainId: number) {
  // Returns an ApiKit instance configured for the chain's hosted TX service
  // For Anvil (31337): return null or throw, with clear error message
}

export async function proposeTransaction(apiKit, safeAddress, safeTx, senderAddress, safeTxHash, senderSignature)
export async function getTransaction(apiKit, safeTxHash)
export async function confirmTransaction(apiKit, safeTxHash, signature)
export async function getPendingTransactions(apiKit, safeAddress)
```

#### 3c. Modify `use-transactions.ts` to support dual mode

- For chains with hosted TX service: use API Kit to propose, fetch pending, confirm
- For Anvil: keep localStorage fallback with clear UI indicator ("Local-only mode")
- Pending txs should poll or refresh from the TX service periodically
- Each signer signs off-chain via Protocol Kit, then submits signature to TX service
- When threshold is met, anyone can execute

#### 3d. Update SetupView for multi-signer

Currently the "Connect to Existing Safe" flow is the entry point for additional signers.
Signer B would:
1. Connect their wallet (MetaMask, not dev wallet)
2. Enter the Safe address
3. See the dashboard with pending txs fetched from TX service
4. Click "Confirm" to add their signature
5. When threshold is met, click "Execute"

The Safe instance needs to be initialized with the **connected wallet's signer**, not
the hardcoded DEV_SIGNER. This means:
- In production/testnet mode: use the wallet's injected provider as signer
- In dev mode on Anvil: use DEV_SIGNER (or allow switching between Anvil accounts)

#### 3e. Update DashboardView

- TxQueue should show pending txs from the TX service (not just localStorage)
- Each pending tx shows who has signed and who hasn't
- "Confirm" button adds the current user's signature via API Kit
- "Execute" button is only enabled when confirmations >= threshold

#### 3f. Anvil multi-signer simulation (optional nice-to-have)

For local dev testing without Docker:
- Add a "Switch Signer" dropdown in dev mode with Anvil accounts #0-#9
- Each "signer" gets their own Protocol Kit instance
- Pending txs are still in localStorage (same machine) but signed by different keys
- This lets a single developer test the full multi-sig flow locally

---

## Work Stream 4: Update TUTORIAL.md

The tutorial is stale after the restructure and contains factual errors.

### 4a. Fix all file path references

The tutorial references the OLD file structure throughout. Every path needs updating:

| Old path (in tutorial) | New path |
|------------------------|----------|
| `apps/web/src/components/safe/Owners.tsx` | `apps/web/src/safe/governance/Owners.tsx` |
| `apps/web/src/components/safe/Threshold.tsx` | `apps/web/src/safe/governance/Threshold.tsx` |
| `apps/web/src/components/safe/ModulePanel.tsx` | `apps/web/src/safe/module/ModulePanel.tsx` |
| `apps/web/src/components/safe/GuardPanel.tsx` | `apps/web/src/safe/guard/GuardPanel.tsx` |
| `apps/web/src/components/safe/TransactionFlow.tsx` | `apps/web/src/safe/transactions/TransactionFlow.tsx` |
| `apps/web/src/components/safe/TxBuilder.tsx` | `apps/web/src/safe/transactions/TxBuilder.tsx` |
| `apps/web/src/components/safe/TxQueue.tsx` | `apps/web/src/safe/transactions/TxQueue.tsx` |
| `apps/web/src/components/safe/TxHistory.tsx` | `apps/web/src/safe/transactions/TxHistory.tsx` |
| `apps/web/src/components/ConnectWallet.tsx` | `apps/web/src/web3/ConnectWallet.tsx` |
| `apps/web/src/components/Header.tsx` | `apps/web/src/components/layout/Header.tsx` |
| `apps/web/src/components/Web3Provider.tsx` | `apps/web/src/web3/Web3Provider.tsx` |
| `apps/web/src/lib/wagmi.ts` | `apps/web/src/web3/config.ts` |
| `apps/web/src/lib/safe/provider.tsx` | `apps/web/src/safe/core/provider.tsx` |
| `apps/web/src/lib/safe/standalone.ts` | `apps/web/src/safe/core/standalone.ts` |
| `apps/web/src/lib/safe/detect.ts` | `apps/web/src/safe/core/detect.ts` |
| `apps/web/src/lib/safe/hooks.ts` | `apps/web/src/safe/core/use-safe.ts` |
| `apps/web/src/lib/safe/iframe.ts` | `apps/web/src/safe/core/iframe.ts` |
| `apps/web/src/lib/safe/transactions.ts` | `apps/web/src/safe/transactions/transactions.ts` |
| `apps/web/src/lib/contracts/` | `apps/web/src/safe/contracts/` |
| `apps/web/src/routes/safe.tsx` (DashboardView) | `apps/web/src/safe/transactions/DashboardView.tsx` |

### 4b. Remove references to deleted files

These files no longer exist and must be removed from the tutorial:
- `apps/web/src/lib/safe/multisig.ts` (Section 7 file tree, Section 8)
- `apps/web/src/lib/safe/relay.ts` (Section 7 file tree, Section 8)
- `apps/web/src/lib/safe/api.ts` (Section 7 file tree)
- `apps/web/src/routes/safe.transactions.tsx` (Section 5 header, Section 7 file tree)
- `apps/web/src/components/safe/Modules.tsx` (Section 4, Section 7 file tree)

### 4c. Remove references to deleted functions

- `buildContractCall()` — referenced in Section 8 "Connecting Contracts to the Safe UI"
  Replace with `buildTransaction()` from `safe/transactions/transactions.ts` which still
  exists, or show the viem `encodeFunctionData` pattern directly.

### 4d. Fix Section 5 route structure

Section 5 says "Navigate to /safe/transactions" — this child route was removed.
The transaction builder is now part of the main /safe dashboard. Update accordingly.

### 4e. Fix Section 6 guard/module descriptions

Section 6 says:
> "This guard also checks module transactions via checkModuleTransaction(), so the limit
> applies regardless of whether the transaction goes through the normal multi-sig flow
> or through a module."

This is the same misleading claim. Rewrite to explain orthogonality:
- Guard checks owner-signed transactions (`execTransaction`)
- Module has its own spending controls (allowance tracking)
- They are independent safety mechanisms

### 4f. Fix Section 7 file tree

Replace the entire file tree with the new structure matching the current codebase.
The current tree lists the old `components/`, `lib/` structure.

### 4g. Fix Section 8 "Enabling the Transaction Service" and "Enabling Gelato Relay"

- Transaction Service section: update to reflect API Kit approach (Work Stream 3)
- Gelato Relay section: the relay.ts file was deleted. Either remove this section
  or note it as a future extension
- Account Abstraction section: the account-abstraction.ts file was deleted. Same treatment.

### 4h. Update Section 4 component references

Section 4 references old component paths and mentions the deleted Modules.tsx component.
Update all references to match new feature-based structure.

---

## Work Stream 5: Guard Demo "Proof It Works"

Currently there's no obvious way to SEE the guard block a transaction. A developer
should be able to experience: "I set a 1 ETH limit, tried to send 2 ETH, and it failed."

### 5a. Show guard error clearly in Transaction Builder flow

When `executeTransaction` reverts with `ExceedsSpendingLimit`, the error should be
caught and displayed clearly. Currently `use-transactions.ts:151` catches the error
and sets `txError`, which renders in DashboardView. Verify this actually works:

1. Deploy Safe
2. Fund Safe with 3 ETH
3. Deploy guard with 1 ETH limit, enable it
4. Use Transaction Builder to send 2 ETH
5. Confirm the error message is clear (should say something about exceeding spending limit,
   not a generic revert)

If the error message is opaque (just a hex revert), decode it using viem's
`decodeErrorResult` with the `SpendingLimitGuardABI`.

### 5b. (Optional) Add a visual guard status indicator to TxBuilder

Show "Guard active: 1 ETH limit" near the Transaction Builder so it's obvious
the guard is in play before you even try.

---

## Work Stream 6: Verify AllowanceModule Flow End-to-End

### 6a. Verify setAllowance works correctly

Trace:
1. Deploy AllowanceModule, enable it
2. Set allowance: delegate = some address, amount = 1 ETH, resetPeriod = 0
3. Check allowance — should show 1 ETH
4. This should work because it's a Safe tx with value=0 (function call)

### 6b. Verify executeAllowance works correctly

Trace:
1. Execute allowance: to = any address, amount = 0.5 ETH
2. Check allowance — should show 0.5 ETH remaining
3. Execute again: amount = 0.6 ETH — should fail with ExceedsAllowance

### 6c. Verify executeAllowance error handling

If executeAllowance fails (over limit), the error in ModulePanel should be clear.
Currently `ModulePanel.tsx:187` catches the error. Verify the error message is
human-readable, not a raw hex revert. If needed, decode with `decodeErrorResult`.

### 6d. Verify the delegate address matters

The current flow uses the dev signer's wallet to call executeAllowance
(`ModulePanel.tsx:177`: `privateKeyToAccount(signer as ...)`).

But the AllowanceModule checks `allowances[msg.sender]` (`AllowanceModule.sol:52`).
This means the delegate must be the SAME address that calls executeAllowance.

Verify: if you set allowance for address X, but call executeAllowance from address Y
(the dev signer), it should fail because Y has no allowance. If it's "working" in
testing, it's because the delegate address was set to the dev signer address.

This is important to document clearly: the delegate must be the caller.

---

## Execution Order

```
Work Stream 1 (UI text)           — independent, can start immediately
Work Stream 2 (signer bug)        — independent, can start immediately
Work Stream 5 (guard demo)        — independent, can start immediately
Work Stream 6 (module verify)     — independent, can start immediately

Work Stream 3 (multi-signer)      — larger, depends on Work Stream 2
Work Stream 4 (tutorial)          — depends on all other streams being done
```

Work Streams 1, 2, 5, 6 can all be done in parallel.
Work Stream 3 is the biggest piece of work.
Work Stream 4 should be done last since it documents the final state.

---

## Files Affected Summary

| Work Stream | Files |
|-------------|-------|
| 1 (UI text) | ModulePanel.tsx, GuardPanel.tsx, SafeOverview.tsx |
| 2 (signer bug) | SetupView.tsx, DashboardView.tsx, safe.tsx, + new constants file |
| 3 (multi-signer) | NEW api.ts, use-transactions.ts, SetupView.tsx, DashboardView.tsx, TxQueue.tsx, package.json |
| 4 (tutorial) | TUTORIAL.md (full rewrite of sections 4-8) |
| 5 (guard demo) | use-transactions.ts (error decoding), possibly DashboardView.tsx |
| 6 (module verify) | ModulePanel.tsx (error decoding), possibly AllowanceModule.sol |
