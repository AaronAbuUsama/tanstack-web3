# Production Cleanup & Feature-Based Restructure

## Goal
Full Option C cleanup: delete dead code, restructure into feature-based folders with Safe sub-domains, extract the 842-line `safe.tsx` god-file, remove stale assets, and make the codebase tutorial-ready.

---

## Phase 1: Delete Dead Code

### 1a. Delete dead Safe library files
- **DELETE** `apps/web/src/lib/safe/api.ts` — 6 functions, zero production usage
- **DELETE** `apps/web/src/lib/safe/multisig.ts` — 4 functions unused; only `TransactionStatus` type imported (move to types.ts first)
- **DELETE** `apps/web/src/lib/safe/relay.ts` — 4 functions, zero production usage
- **DELETE** `apps/web/src/lib/safe/relay.test.ts` — tests for deleted code

### 1b. Move `TransactionStatus` type before deleting multisig.ts
- **EDIT** `apps/web/src/lib/safe/types.ts` — add `TransactionStatus` interface (currently in multisig.ts lines 14-20):
  ```ts
  export interface TransactionStatus {
    safeTxHash: string
    confirmations: number
    threshold: number
    isReady: boolean
    isExecuted: boolean
  }
  ```
- **EDIT** `apps/web/src/components/safe/TransactionFlow.tsx` — change import from `../../lib/safe/multisig` → `../../lib/safe/types`

### 1c. Remove dead exports from active files
- **EDIT** `apps/web/src/lib/safe/transactions.ts` — delete `buildContractCall()`, `buildBatchTransactions()`, `encodeContractCall()` and their interfaces (`ContractCallParams`, `BatchTransactionParams`)
- **EDIT** `apps/web/src/lib/safe/iframe.ts` — delete `getChainInfo()`, `getSafeAppsSDK()`
- **EDIT** `apps/web/src/lib/safe/detect.ts` — delete `isSafeApp()`

### 1d. Remove dead contract artifacts from frontend
- **EDIT** `apps/web/src/lib/contracts/abis.ts` — delete `CounterABI`, `SimpleStorageABI`, `MultiSigActionABI`
- **EDIT** `apps/web/src/lib/contracts/bytecodes.ts` — delete `CounterBytecode`, `SimpleStorageBytecode`, `MultiSigActionBytecode`
- **EDIT** `apps/web/src/lib/contracts/deploy.ts` — delete `deployCounter()`, `deploySimpleStorage()`, `deployMultiSigAction()` and their ABI/bytecode imports

### 1e. Archive example Solidity contracts
- **MOVE** `packages/contracts/src/Counter.sol` → `packages/contracts/examples/Counter.sol`
- **MOVE** `packages/contracts/src/SimpleStorage.sol` → `packages/contracts/examples/SimpleStorage.sol`
- **MOVE** `packages/contracts/src/MultiSigAction.sol` → `packages/contracts/examples/MultiSigAction.sol`
- **MOVE** corresponding test files → `packages/contracts/examples/`
- **MOVE** corresponding script files → `packages/contracts/examples/`

---

## Phase 2: Extract `safe.tsx` God-File

The 842-line route file contains 5 embedded components and ~200 lines of transaction state management. Extract into focused pieces.

### 2a. Extract `useTransactions` hook
**CREATE** `apps/web/src/lib/safe/use-transactions.ts`

Extract from `safe.tsx`:
- `LocalTx` / `PersistedTx` interfaces (collapse into one type using `Omit`)
- `getTxStorageKey()`, `loadPersistedTxs()`, `persistTxs()` helpers
- Transaction state: `transactions`, `txError`, `txBusy`
- All handlers: `handleBuild`, `handleConfirm`, `handleExecute`
- Computed: `pendingTxs`, `executedTxs`
- Returns: `{ transactions, pendingTxs, executedTxs, txError, txBusy, handleBuild, handleConfirm, handleExecute }`

### 2b. Extract `SetupView` component
**CREATE** `apps/web/src/components/safe/SetupView.tsx`

Extract `SetupView` function (lines 163-316) from `safe.tsx` as its own component file. Same props interface. No logic changes.

### 2c. Extract `FundSafe` component
**CREATE** `apps/web/src/components/safe/FundSafe.tsx`

Extract `FundSafe` function (lines 318-386) from `safe.tsx`. Dev-only utility component.

### 2d. Extract `DashboardView` component
**CREATE** `apps/web/src/components/safe/DashboardView.tsx`

Extract `DashboardView` function (lines 388-832). It imports `useTransactions` hook instead of inline state management. This file will still be the largest component (~300 lines) but is now focused on layout/composition rather than business logic.

### 2e. Slim down route file
**EDIT** `apps/web/src/routes/safe.tsx`

After extraction, the route becomes ~60 lines:
- Route definition
- `SafeDashboard` component (connects wallet state + Safe state)
- Imports `SetupView`, `DashboardView`, `ConnectWallet`
- `getRpcUrl()` helper stays here (it's route-level config)
- `DEV_SIGNER` constant stays here

---

## Phase 3: Feature-Based Folder Restructure

### Target structure
```
apps/web/src/
├── safe/                               ← THE domain
│   ├── core/                           ← SDK integration, provider, types
│   │   ├── provider.tsx                (from lib/safe/provider.tsx)
│   │   ├── use-safe.ts                 (from lib/safe/hooks.ts)
│   │   ├── standalone.ts               (from lib/safe/standalone.ts)
│   │   ├── iframe.ts                   (from lib/safe/iframe.ts)
│   │   ├── detect.ts                   (from lib/safe/detect.ts)
│   │   ├── detect.test.ts              (from lib/safe/detect.test.ts)
│   │   ├── types.ts                    (from lib/safe/types.ts, + TransactionStatus)
│   │   └── index.ts                    (barrel)
│   ├── governance/                     ← owners, threshold, setup
│   │   ├── Owners.tsx                  (from components/safe/Owners.tsx)
│   │   ├── Owners.test.tsx
│   │   ├── Threshold.tsx               (from components/safe/Threshold.tsx)
│   │   ├── Threshold.test.tsx
│   │   ├── SafeOverview.tsx            (from components/safe/SafeOverview.tsx)
│   │   ├── SetupView.tsx               (extracted from routes/safe.tsx)
│   │   └── index.ts
│   ├── guard/                          ← SpendingLimitGuard
│   │   ├── GuardPanel.tsx              (from components/safe/GuardPanel.tsx)
│   │   └── index.ts
│   ├── module/                         ← AllowanceModule
│   │   ├── ModulePanel.tsx             (from components/safe/ModulePanel.tsx)
│   │   └── index.ts
│   ├── transactions/                   ← tx lifecycle
│   │   ├── TxBuilder.tsx               (from components/safe/TxBuilder.tsx)
│   │   ├── TxBuilder.test.tsx
│   │   ├── TxQueue.tsx                 (from components/safe/TxQueue.tsx)
│   │   ├── TxQueue.test.tsx
│   │   ├── TxHistory.tsx               (from components/safe/TxHistory.tsx)
│   │   ├── TransactionFlow.tsx         (from components/safe/TransactionFlow.tsx)
│   │   ├── DashboardView.tsx           (extracted from routes/safe.tsx)
│   │   ├── FundSafe.tsx                (extracted from routes/safe.tsx)
│   │   ├── use-transactions.ts         (extracted from routes/safe.tsx)
│   │   ├── transactions.ts             (from lib/safe/transactions.ts)
│   │   ├── transactions.test.ts
│   │   └── index.ts
│   ├── contracts/                      ← on-chain artifacts
│   │   ├── abis.ts                     (from lib/contracts/abis.ts, trimmed)
│   │   ├── bytecodes.ts                (from lib/contracts/bytecodes.ts, trimmed)
│   │   ├── deploy.ts                   (from lib/contracts/deploy.ts, trimmed)
│   │   └── index.ts
│   └── index.ts                        (top-level barrel)
│
├── web3/                               ← wallet infrastructure
│   ├── ConnectWallet.tsx               (from components/ConnectWallet.tsx)
│   ├── AddressDisplay.tsx              (from components/web3/AddressDisplay.tsx)
│   ├── AddressDisplay.test.tsx
│   ├── ChainBadge.tsx                  (from components/web3/ChainBadge.tsx)
│   ├── ChainBadge.test.tsx
│   ├── TokenBalances.tsx               (from components/web3/TokenBalances.tsx)
│   ├── Web3Provider.tsx                (from components/Web3Provider.tsx)
│   ├── config.ts                       (from lib/wagmi.ts)
│   ├── dev-wallet.ts                   (from lib/dev-wallet.ts)
│   └── index.ts
│
├── components/                         ← shared UI (non-feature-specific)
│   ├── ui/
│   │   └── InfoSection.tsx             (stays)
│   └── layout/
│       └── Header.tsx                  (from components/Header.tsx)
│
├── routes/                             ← thin composition
│   ├── __root.tsx                      (update imports)
│   ├── index.tsx                       (stays, no import changes needed)
│   ├── safe.tsx                        (slimmed to ~60 lines)
│   └── wallet.tsx                      (update imports)
│
├── test-utils/                         ← stays, update imports
│   ├── safe-mock.ts
│   ├── web3-mock.ts
│   ├── iframe-mock.ts
│   └── index.ts
│
├── router.tsx                          (stays)
├── routeTree.gen.ts                    (stays, auto-generated)
├── styles.css                          (stays)
└── test-setup.ts                       (stays)
```

### 3a. Create new directories
```
mkdir -p apps/web/src/safe/core
mkdir -p apps/web/src/safe/governance
mkdir -p apps/web/src/safe/guard
mkdir -p apps/web/src/safe/module
mkdir -p apps/web/src/safe/transactions
mkdir -p apps/web/src/safe/contracts
mkdir -p apps/web/src/web3
mkdir -p apps/web/src/components/layout
```

### 3b. Move files (git mv to preserve history)

**safe/core/**
- `git mv apps/web/src/lib/safe/provider.tsx apps/web/src/safe/core/provider.tsx`
- `git mv apps/web/src/lib/safe/hooks.ts apps/web/src/safe/core/use-safe.ts`
- `git mv apps/web/src/lib/safe/standalone.ts apps/web/src/safe/core/standalone.ts`
- `git mv apps/web/src/lib/safe/iframe.ts apps/web/src/safe/core/iframe.ts`
- `git mv apps/web/src/lib/safe/detect.ts apps/web/src/safe/core/detect.ts`
- `git mv apps/web/src/lib/safe/detect.test.ts apps/web/src/safe/core/detect.test.ts`
- `git mv apps/web/src/lib/safe/types.ts apps/web/src/safe/core/types.ts`

**safe/governance/**
- `git mv apps/web/src/components/safe/Owners.tsx apps/web/src/safe/governance/Owners.tsx`
- `git mv apps/web/src/components/safe/Owners.test.tsx apps/web/src/safe/governance/Owners.test.tsx`
- `git mv apps/web/src/components/safe/Threshold.tsx apps/web/src/safe/governance/Threshold.tsx`
- `git mv apps/web/src/components/safe/Threshold.test.tsx apps/web/src/safe/governance/Threshold.test.tsx`
- `git mv apps/web/src/components/safe/SafeOverview.tsx apps/web/src/safe/governance/SafeOverview.tsx`

**safe/guard/**
- `git mv apps/web/src/components/safe/GuardPanel.tsx apps/web/src/safe/guard/GuardPanel.tsx`

**safe/module/**
- `git mv apps/web/src/components/safe/ModulePanel.tsx apps/web/src/safe/module/ModulePanel.tsx`

**safe/transactions/**
- `git mv apps/web/src/components/safe/TxBuilder.tsx apps/web/src/safe/transactions/TxBuilder.tsx`
- `git mv apps/web/src/components/safe/TxBuilder.test.tsx apps/web/src/safe/transactions/TxBuilder.test.tsx`
- `git mv apps/web/src/components/safe/TxQueue.tsx apps/web/src/safe/transactions/TxQueue.tsx`
- `git mv apps/web/src/components/safe/TxQueue.test.tsx apps/web/src/safe/transactions/TxQueue.test.tsx`
- `git mv apps/web/src/components/safe/TxHistory.tsx apps/web/src/safe/transactions/TxHistory.tsx`
- `git mv apps/web/src/components/safe/TransactionFlow.tsx apps/web/src/safe/transactions/TransactionFlow.tsx`
- `git mv apps/web/src/lib/safe/transactions.ts apps/web/src/safe/transactions/transactions.ts`
- `git mv apps/web/src/lib/safe/transactions.test.ts apps/web/src/safe/transactions/transactions.test.ts`

**safe/contracts/**
- `git mv apps/web/src/lib/contracts/abis.ts apps/web/src/safe/contracts/abis.ts`
- `git mv apps/web/src/lib/contracts/bytecodes.ts apps/web/src/safe/contracts/bytecodes.ts`
- `git mv apps/web/src/lib/contracts/deploy.ts apps/web/src/safe/contracts/deploy.ts`

**web3/**
- `git mv apps/web/src/components/ConnectWallet.tsx apps/web/src/web3/ConnectWallet.tsx`
- `git mv apps/web/src/components/web3/AddressDisplay.tsx apps/web/src/web3/AddressDisplay.tsx`
- `git mv apps/web/src/components/web3/AddressDisplay.test.tsx apps/web/src/web3/AddressDisplay.test.tsx`
- `git mv apps/web/src/components/web3/ChainBadge.tsx apps/web/src/web3/ChainBadge.tsx`
- `git mv apps/web/src/components/web3/ChainBadge.test.tsx apps/web/src/web3/ChainBadge.test.tsx`
- `git mv apps/web/src/components/web3/TokenBalances.tsx apps/web/src/web3/TokenBalances.tsx`
- `git mv apps/web/src/components/Web3Provider.tsx apps/web/src/web3/Web3Provider.tsx`
- `git mv apps/web/src/lib/wagmi.ts apps/web/src/web3/config.ts`
- `git mv apps/web/src/lib/dev-wallet.ts apps/web/src/web3/dev-wallet.ts`

**components/layout/**
- `git mv apps/web/src/components/Header.tsx apps/web/src/components/layout/Header.tsx`

### 3c. Delete emptied directories
- `rm -rf apps/web/src/lib/safe/` (all files moved or deleted)
- `rm -rf apps/web/src/lib/contracts/` (all files moved)
- `rm -rf apps/web/src/lib/` (should be empty — wagmi.ts and dev-wallet.ts moved)
- `rm -rf apps/web/src/components/safe/` (all files moved)
- `rm -rf apps/web/src/components/web3/` (all files moved)

---

## Phase 4: Rewire All Imports

Every moved file needs its import paths updated. This is the critical phase.

### 4a. Route files
**`routes/__root.tsx`** — 2 changes:
- `../components/Header` → `../components/layout/Header`
- `../components/Web3Provider` → `../web3/Web3Provider`
- `../lib/safe/provider` → `../safe/core/provider`

**`routes/safe.tsx`** — all imports rewritten:
- `../components/ConnectWallet` → `../web3/ConnectWallet`
- `../lib/safe/hooks` → `../safe/core/use-safe`
- `../lib/safe/standalone` → `../safe/core/standalone`
- `../components/safe/Owners` → `../safe/governance/Owners`
- `../components/safe/Threshold` → `../safe/governance/Threshold`
- `../components/safe/GuardPanel` → `../safe/guard/GuardPanel`
- `../components/safe/ModulePanel` → `../safe/module/ModulePanel`
- `../components/web3/AddressDisplay` → `../web3/AddressDisplay`
- `../components/web3/ChainBadge` → `../web3/ChainBadge`
- `../components/web3/TokenBalances` → `../web3/TokenBalances`
- `../components/safe/TxBuilder` → `../safe/transactions/TxBuilder`
- `../components/safe/TxQueue` → `../safe/transactions/TxQueue`
- `../components/safe/TxHistory` → `../safe/transactions/TxHistory`
- `../components/safe/TransactionFlow` → `../safe/transactions/TransactionFlow`
- `../components/safe/SafeOverview` → `../safe/governance/SafeOverview`
- `../lib/safe/transactions` → `../safe/transactions/transactions`
- `../lib/safe/iframe` → `../safe/core/iframe`
- `../lib/safe/types` → `../safe/core/types`
- After extraction: add imports for `SetupView`, `DashboardView`, `FundSafe`, `useTransactions`

**`routes/wallet.tsx`** — 1 change:
- `../components/ConnectWallet` → `../web3/ConnectWallet`

**`routes/index.tsx`** — no import changes (only imports from `@tanstack` and `lucide-react`)

### 4b. Safe domain files (internal imports)

**`safe/core/provider.tsx`** — already uses `./detect`, `./iframe`, `./standalone`, `./types` (relative within same dir — no changes needed!)

**`safe/core/use-safe.ts`** — imports from `./provider` → no change needed (same dir)

**`safe/core/standalone.ts`** — imports from `./types` → no change needed

**`safe/guard/GuardPanel.tsx`** — 4 changes:
- `../../lib/contracts/deploy` → `../contracts/deploy`
- `../../lib/contracts/abis` → `../contracts/abis`
- `../../lib/safe/standalone` → `../core/standalone`
- `../../lib/safe/types` → `../core/types`
- `../ui/InfoSection` → `../../components/ui/InfoSection`

**`safe/module/ModulePanel.tsx`** — 4 changes:
- `../../lib/contracts/deploy` → `../contracts/deploy`
- `../../lib/contracts/abis` → `../contracts/abis`
- `../../lib/safe/standalone` → `../core/standalone`
- `../../lib/safe/types` → `../core/types`
- `../ui/InfoSection` → `../../components/ui/InfoSection`

**`safe/transactions/TransactionFlow.tsx`** — 1 change:
- `../../lib/safe/multisig` → `../core/types` (after type move)

**`safe/governance/SafeOverview.tsx`** — 1 change:
- `../../lib/contracts/abis` → `../contracts/abis`

### 4c. Web3 files
**`web3/Web3Provider.tsx`** — 1 change:
- `../lib/wagmi` → `./config`

**`web3/config.ts`** (was wagmi.ts) — 1 change:
- `./dev-wallet` → stays `./dev-wallet` (same relative path in new location)

**`components/layout/Header.tsx`** — 1 change:
- `./ConnectWallet` → `../../web3/ConnectWallet`

### 4d. Test utils
**`test-utils/safe-mock.ts`** — 2 changes:
- `../lib/safe/provider` → `../safe/core/provider`
- `../lib/safe/types` → `../safe/core/types`

**`test-utils/web3-mock.ts`** — no changes (only imports from packages)

**`test-utils/iframe-mock.ts`** — no changes (no imports from src)

### 4e. Test files (colocated)
All test files move with their source and use relative imports to sibling files. Verify:
- `safe/governance/Owners.test.tsx` — check if it imports from `../lib/safe/` or just local
- `safe/transactions/TxBuilder.test.tsx` — same check
- `safe/transactions/TxQueue.test.tsx` — same check
- `web3/AddressDisplay.test.tsx` — same check
- `web3/ChainBadge.test.tsx` — same check

### 4f. Create barrel index.ts files
Each sub-domain gets an `index.ts` that re-exports its public API:

**`safe/core/index.ts`**: export provider, use-safe, standalone functions, types
**`safe/governance/index.ts`**: export components
**`safe/guard/index.ts`**: export GuardPanel
**`safe/module/index.ts`**: export ModulePanel
**`safe/transactions/index.ts`**: export components, hook, lib
**`safe/contracts/index.ts`**: export abis, bytecodes, deploy (trimmed)
**`safe/index.ts`**: re-export sub-domains
**`web3/index.ts`**: export all web3 components + config

---

## Phase 5: Cleanup Stale Assets & Metadata

### 5a. Delete stale public assets
- **DELETE** `apps/web/public/logo192.png`
- **DELETE** `apps/web/public/logo512.png`
- **DELETE** `apps/web/public/tanstack-circle-logo.png`
- **DELETE** `apps/web/public/tanstack-word-logo-white.svg`
- **KEEP** `apps/web/public/robots.txt`
- **KEEP** `apps/web/public/favicon.ico`

### 5b. Update manifest.json
```json
{
  "short_name": "Safe Boilerplate",
  "name": "Gnosis Safe Web3 Boilerplate",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0f172a",
  "background_color": "#0f172a"
}
```

### 5c. Delete stale root files
- **DELETE** `PLAN.md` — historical roadmap, served its purpose (preserved in git history)
- **DELETE** `apps/web/.cta.json` — generator metadata, no runtime use

---

## Phase 6: Verification

### Build
```bash
bun run build    # expect 0 errors
```

### Tests
```bash
bunx vitest run  # all 35 tests pass (minus relay.test.ts = 33 tests, 8 files)
```

### Manual checks
- All import paths resolve (no "module not found" in build)
- `safe/` folder structure matches target tree
- `web3/` folder is self-contained
- No files left in `lib/` or `components/safe/` or `components/web3/`
- `routes/safe.tsx` is under 100 lines
- `index.tsx` homepage still references correct paths (lucide only — no changes needed)

### Contract tests
```bash
cd packages/contracts && forge test  # all pass (examples still compile)
```

---

## Execution Strategy

This should be done as an agent team with 3 parallel work streams:

1. **Dead code + extraction** — Delete dead files, extract safe.tsx, move TransactionStatus type
2. **Folder restructure** — Create dirs, git mv files, create barrel exports
3. **Import rewiring + cleanup** — Fix all import paths, delete stale assets, update manifest

Streams 1 and 2 can start in parallel. Stream 3 depends on both completing.

---

## Files Affected (complete list)

| Action | Count |
|--------|-------|
| DELETE  | 10 files (3 dead libs, 1 dead test, 3 dead contracts ABIs/bytecodes, PLAN.md, .cta.json, stale logos) |
| CREATE  | ~14 files (extracted components, hooks, barrel exports) |
| MOVE    | ~30 files (restructure) |
| EDIT    | ~15 files (import path rewiring) |
