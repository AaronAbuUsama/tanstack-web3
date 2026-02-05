# TanStack Web3 - Gnosis Safe Boilerplate: Implementation Plan

## Current State

All Phase 1 work was lost due to a destructive `git checkout`. The codebase is back to the initial TanStack Start starter with demo routes. Phase 1 needs to be recreated.

## Architecture

The boilerplate supports two modes:
- **Safe App (iframe)** — Runs inside app.safe.global, communicates via Safe Apps SDK postMessage
- **Standalone dApp** — Full custom UI using Safe Protocol Kit as smart account backend

```
┌─────────────────────────────────────────────┐
│              Your dApp UI                   │
│    (works in iframe AND standalone)         │
├─────────────────────────────────────────────┤
│          Unified Safe Context               │
│   useSafe() / useProposeTx() / useTxQueue() │
├───────────────────┬─────────────────────────┤
│   Safe Apps SDK   │   Protocol Kit +        │
│   (iframe mode)   │   API Kit + Relay Kit   │
├───────────────────┴─────────────────────────┤
│            wagmi + viem                     │
├─────────────────────────────────────────────┤
│          Foundry (contracts)                │
└─────────────────────────────────────────────┘
```

## Monorepo Structure (Target)

```
tanstack-web3/
├── apps/
│   └── web/                      # TanStack Start app
│       ├── src/
│       │   ├── routes/
│       │   ├── components/
│       │   ├── lib/
│       │   │   ├── wagmi.ts
│       │   │   ├── dev-wallet.ts
│       │   │   └── safe/
│       │   └── styles/
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── packages/
│   └── contracts/                # Foundry project
│       ├── src/
│       ├── test/
│       ├── script/
│       └── foundry.toml
├── turbo.json
├── package.json                  # Root workspace
├── biome.json
└── README.md
```

---

## Agent Team Strategy

Each phase uses an Agent Team where independent tasks can be parallelized. The team lead (this session) acts as coordinator in **delegate mode** — it creates tasks, spawns teammates, reviews results, and runs browser tests. Teammates do the implementation.

### Team Pattern Per Phase

1. **Lead** creates the team and task list for the phase
2. **Lead** spawns teammates with detailed prompts (each teammate owns distinct files)
3. **Teammates** implement their tasks in parallel (no file conflicts)
4. **Lead** waits for all teammates to complete
5. **Lead** runs the build to verify integration
6. **Lead** runs browser tests using Chrome MCP tools to verify the phase works
7. **Lead** shuts down teammates and cleans up the team
8. **Lead** commits the phase

### File Ownership Rules (No Conflicts)

Each teammate gets exclusive ownership of specific files. Two teammates never edit the same file.

---

## Phase 1: Core Web3 Infrastructure + README

**Goal:** Recreate the Web3 foundation (lost to git reset) plus update README with new roadmap.

### Agent Team: `phase-1-web3`

| Teammate | Role | Files Owned |
|----------|------|-------------|
| `web3-config` | wagmi config, Web3Provider, chain setup | `src/lib/wagmi.ts`, `src/components/Web3Provider.tsx` |
| `wallet-ui` | ConnectWallet component, Web3 demo route | `src/components/ConnectWallet.tsx`, `src/routes/demo/web3.tsx` |
| `integration` | Root layout integration, Header update, README | `src/routes/__root.tsx`, `src/components/Header.tsx`, `README.md` |

### Task Dependency Graph

```
[install wagmi+viem+react-query]  (lead does this first, before spawning team)
         │
         ├── Task 1: wagmi config + Web3Provider        (web3-config)
         ├── Task 2: ConnectWallet + Web3 demo route     (wallet-ui)
         └── Task 3: Root layout + Header + README       (integration)
                     │
              [all 3 complete]
                     │
              Task 4: Browser test                        (lead)
```

### Task Details

**Task 1 — wagmi config + Web3Provider** (`web3-config`)
- Create `src/lib/wagmi.ts`: createConfig with mainnet, sepolia, gnosis, gnosisChiado chains. injected() connector. HTTP transports. `ssr: true`. Module augmentation for type inference.
- Create `src/components/Web3Provider.tsx`: WagmiProvider + QueryClientProvider wrapper. useState for SSR-safe QueryClient.

**Task 2 — ConnectWallet + Web3 demo route** (`wallet-ui`)
- Create `src/components/ConnectWallet.tsx`: useAccount, useConnect, useDisconnect, useSwitchChain. Shows connect button when disconnected (multi-connector dropdown if >1). Shows chain badge (clickable dropdown switcher) + truncated address + disconnect when connected. Dark theme matching existing UI.
- Create `src/routes/demo/web3.tsx`: Demo page with account info, balance (with NaN guard on parseFloat), network info, and clickable chain switcher grid using useSwitchChain.

**Task 3 — Root layout + Header + README** (`integration`)
- Modify `src/routes/__root.tsx`: Add RootComponent with Web3Provider wrapping Header + Outlet. Move Header from shellComponent to component. Import Web3Provider.
- Modify `src/components/Header.tsx`: Add ConnectWallet to header bar (right-aligned, `ml-auto`). Add "Web3 - Wallet" nav link to sidebar for /demo/web3. Import Wallet icon from lucide-react.
- Rewrite `README.md`: New 6-phase roadmap, architecture diagram, monorepo structure, two modes explained, dev wallet docs, updated tech stack (add Turborepo, Foundry, wagmi, viem, Safe SDK).

### Browser Test (Lead performs after teammates complete)

1. Run `bun run dev`
2. Open browser to `http://localhost:3000`
3. Verify app loads (screenshot)
4. Navigate to `/demo/web3`
5. Verify "Connect Wallet" button appears
6. Verify page shows "Connect Your Wallet" prompt
7. Take screenshot for verification
8. Stop dev server

### Commit

After browser test passes: commit all Phase 1 changes with descriptive message.

---

## Phase 2: Dev Infrastructure & Monorepo

**Goal:** Convert to Turborepo monorepo, add dev wallet connector, scaffold Foundry contracts, add Anvil integration.

### Agent Team: `phase-2-infra`

**Sequential first:** Lead performs the monorepo conversion (structural, touches every file path). This MUST complete before spawning teammates.

**Then parallel:**

| Teammate | Role | Files Owned |
|----------|------|-------------|
| `dev-wallet` | Dev wallet connector + wagmi config update | `apps/web/src/lib/dev-wallet.ts`, `apps/web/src/lib/wagmi.ts` |
| `foundry` | Foundry contracts scaffold | `packages/contracts/**` |
| `anvil-scripts` | Anvil integration + root dev scripts | Root `package.json` scripts, `turbo.json` updates |

### Task Dependency Graph

```
Task 1: Monorepo conversion                              (lead)
         │
         ├── Task 2: Dev wallet connector                 (dev-wallet)
         ├── Task 3: Foundry contracts scaffold           (foundry)
         └── Task 4: Anvil integration + dev scripts      (anvil-scripts)
                     │
              [all 4 complete]
                     │
              Task 5: Browser test                        (lead)
```

### Task Details

**Task 1 — Monorepo conversion** (lead does this sequentially)
- Create root `package.json` with `workspaces: ["apps/*", "packages/*"]`, add turbo + biome as root devDeps
- Add `packageManager` field for Turborepo
- Create `turbo.json` with build/dev/test/lint pipelines
- Move `src/`, `public/`, `vite.config.ts`, `tsconfig.json`, `.tanstack/` into `apps/web/`
- Create `apps/web/package.json` with app-specific deps and scripts
- Keep `biome.json` at root (globs already use `**/src/**`)
- Update `.gitignore` for Turborepo (.turbo) and Foundry (out/, cache/)
- Clean install (`rm -rf node_modules bun.lock && bun install`)
- Verify `bun run build` works from root

**Task 2 — Dev wallet connector** (`dev-wallet`)
- Create `apps/web/src/lib/dev-wallet.ts`: Custom wagmi connector via `createConnector`. Uses `privateKeyToAccount` with Hardhat account #0 (`0xac0974...`). Implements full connector interface (connect, disconnect, getAccounts, getChainId, getProvider, isAuthorized, onChange handlers). Returns EIP-1193 provider via `createWalletClient`.
- Update `apps/web/src/lib/wagmi.ts`: Conditionally include devWallet() connector when `import.meta.env.DEV`.

**Task 3 — Foundry contracts scaffold** (`foundry`)
- Create `packages/contracts/package.json` with name `@tanstack-web3/contracts`, scripts wrapping forge commands
- Create `packages/contracts/foundry.toml`
- Create `packages/contracts/src/Counter.sol` (example)
- Create `packages/contracts/test/Counter.t.sol` (example)
- Create `packages/contracts/script/Counter.s.sol` (example)
- Create `packages/contracts/.gitignore` for out/, cache/

**Task 4 — Anvil integration** (`anvil-scripts`)
- Add `dev:anvil` script to root: `anvil --fork-url https://rpc.sepolia.org --port 8545`
- Add `dev:all` script that runs anvil + web app concurrently
- Add localhost/anvil chain definition to wagmi config (dev-only, coordinate with dev-wallet teammate on wagmi.ts ownership — dev-wallet owns wagmi.ts, so anvil-scripts creates a separate `apps/web/src/lib/chains.ts` with the local chain definition that dev-wallet imports)

### Browser Test (Lead performs after teammates complete)

1. Run `bun run dev` from monorepo root
2. Open browser to `http://localhost:3000`
3. Verify app loads from monorepo structure
4. Navigate to `/demo/web3`
5. Verify "Dev Wallet" appears as a connector option (dev mode only)
6. Click "Dev Wallet" to connect
7. Verify address shows `0xf39F...2266`
8. Verify network switcher works
9. Run `bun run build` from root to verify production build
10. Verify `forge build` works in packages/contracts
11. Take screenshots for verification

### Commit

After browser test passes: commit all Phase 2 changes.

---

## Phase 3: Safe Foundation

**Goal:** Install Safe SDK packages, implement environment detection, integrate Protocol Kit + Safe Apps SDK + API Kit, build unified SafeProvider.

### Agent Team: `phase-3-safe`

| Teammate | Role | Files Owned |
|----------|------|-------------|
| `protocol-kit` | Protocol Kit integration for standalone mode | `apps/web/src/lib/safe/standalone.ts` |
| `safe-apps` | Safe Apps SDK integration for iframe mode | `apps/web/src/lib/safe/iframe.ts`, `apps/web/src/lib/safe/detect.ts` |
| `api-kit` | API Kit integration (Transaction Service) | `apps/web/src/lib/safe/api.ts` |
| `safe-provider` | Unified SafeProvider + hooks + demo route | `apps/web/src/lib/safe/provider.tsx`, `apps/web/src/lib/safe/hooks.ts`, `apps/web/src/routes/demo/safe.tsx` |

### Task Dependency Graph

```
Task 1: Install Safe SDK packages                        (lead)
         │
         ├── Task 2: Environment detection + Safe Apps SDK (safe-apps)
         ├── Task 3: Protocol Kit integration              (protocol-kit)
         └── Task 4: API Kit integration                   (api-kit)
                     │
              [Tasks 2-4 complete]
                     │
              Task 5: Unified SafeProvider + hooks + demo  (safe-provider)
                     │
              Task 6: Browser test                         (lead)
```

### Task Details

**Task 1 — Install packages** (lead)
- `bun add @safe-global/protocol-kit @safe-global/api-kit @safe-global/safe-apps-sdk @safe-global/safe-apps-react-sdk` in apps/web

**Task 2 — Environment detection + Safe Apps SDK** (`safe-apps`)
- Create `apps/web/src/lib/safe/detect.ts`: Function to detect if running inside Safe iframe (check `window.parent !== window` + SDK handshake)
- Create `apps/web/src/lib/safe/iframe.ts`: Wrapper around Safe Apps SDK for reading Safe info (address, owners, threshold, chain) and proposing transactions via postMessage

**Task 3 — Protocol Kit integration** (`protocol-kit`)
- Create `apps/web/src/lib/safe/standalone.ts`: Functions to create a Safe programmatically, get Safe info, build transactions, sign transactions, execute transactions. Uses Protocol Kit with viem/wagmi transport.

**Task 4 — API Kit integration** (`api-kit`)
- Create `apps/web/src/lib/safe/api.ts`: Functions to interact with Safe Transaction Service — get pending transactions, get transaction history, propose transactions, confirm transactions.

**Task 5 — Unified SafeProvider + hooks** (`safe-provider`) — BLOCKED by Tasks 2-4
- Create `apps/web/src/lib/safe/provider.tsx`: SafeProvider that detects mode and provides unified context
- Create `apps/web/src/lib/safe/hooks.ts`: `useSafe()` returning Safe info regardless of mode, `useSafeSDK()` for raw SDK access
- Create `apps/web/src/routes/demo/safe.tsx`: Demo page showing Safe info, mode detection, create Safe button (standalone mode)

### Browser Test (Lead performs after teammates complete)

1. Run `bun run dev`
2. Open browser to `http://localhost:3000`
3. Navigate to `/demo/safe`
4. Verify standalone mode is detected (not in iframe)
5. Connect dev wallet
6. Verify "Create Safe" functionality works (against Anvil fork if running, or shows appropriate state)
7. Verify Safe info displays correctly
8. Run `bun run build` to verify no SSR issues
9. Take screenshots

### Commit

After browser test passes: commit all Phase 3 changes.

---

## Phase 4: Transaction Layer

**Goal:** Build transaction construction helpers, multi-sig flow, unified tx hooks, Relay Kit.

### Agent Team: `phase-4-tx`

| Teammate | Role | Files Owned |
|----------|------|-------------|
| `tx-builder` | Transaction building + signing helpers | `apps/web/src/lib/safe/transactions.ts` |
| `multisig-flow` | Multi-sig propose/confirm/execute flow | `apps/web/src/lib/safe/multisig.ts`, `apps/web/src/components/safe/TransactionFlow.tsx` |
| `tx-hooks` | Unified useProposeTx / useTxQueue hooks + demo | `apps/web/src/lib/safe/tx-hooks.ts`, `apps/web/src/routes/demo/safe.transactions.tsx` |
| `relay` | Relay Kit gasless transactions | `apps/web/src/lib/safe/relay.ts` |

### Task Dependency Graph

```
Task 1: Transaction building helpers                      (tx-builder)
         │
         ├── Task 2: Multi-sig flow components             (multisig-flow)
         ├── Task 3: Unified tx hooks + demo route         (tx-hooks)
         └── Task 4: Relay Kit integration                 (relay)
                     │
              [all complete]
                     │
              Task 5: Browser test                         (lead)
```

### Browser Test

1. Run `bun run dev` (+ `bun run dev:anvil` for local chain)
2. Open browser, navigate to transactions demo
3. Connect dev wallet
4. Build a test transaction (e.g., ETH transfer)
5. Verify transaction proposal flow works
6. Verify transaction appears in queue
7. Verify transaction execution (on local Anvil)
8. Take screenshots

### Commit

After browser test passes: commit all Phase 4 changes.

---

## Phase 5: UI Components & Examples

**Goal:** Build reusable Safe/Web3 UI components, example contracts, responsive layouts.

### Agent Team: `phase-5-ui`

| Teammate | Role | Files Owned |
|----------|------|-------------|
| `safe-mgmt` | Safe management components | `apps/web/src/components/safe/Owners.tsx`, `apps/web/src/components/safe/Threshold.tsx`, `apps/web/src/components/safe/Modules.tsx` |
| `tx-components` | Transaction UI components | `apps/web/src/components/safe/TxBuilder.tsx`, `apps/web/src/components/safe/TxQueue.tsx`, `apps/web/src/components/safe/TxHistory.tsx` |
| `account-components` | Account display components | `apps/web/src/components/web3/AddressDisplay.tsx`, `apps/web/src/components/web3/TokenBalances.tsx`, `apps/web/src/components/web3/ChainBadge.tsx` |
| `example-contracts` | Example Foundry contracts + tests | `packages/contracts/src/**`, `packages/contracts/test/**`, `packages/contracts/script/**` |

### Browser Test

1. Run `bun run dev`
2. Navigate through all component demo pages
3. Verify each component renders correctly
4. Test responsive behavior (resize browser)
5. Verify Foundry contracts build and tests pass (`forge test`)
6. Take screenshots of each component

### Commit

After browser test passes: commit all Phase 5 changes.

---

## Phase 6: DX, Docs & Advanced

**Goal:** Docker setup for local Safe infra, testing utilities, deployment guides, ERC-4337.

### Agent Team: `phase-6-dx`

| Teammate | Role | Files Owned |
|----------|------|-------------|
| `docker` | Docker Compose for local Safe infrastructure | `docker/docker-compose.yml`, `docker/README.md` |
| `testing` | Testing utilities for both modes | `apps/web/src/test-utils/**` |
| `docs` | Deployment guides, manifest config docs | `docs/**` |
| `erc4337` | ERC-4337 Account Abstraction via Safe 4337 module | `apps/web/src/lib/safe/account-abstraction.ts` |

### Browser Test

1. Verify `docker compose up` starts local Safe infrastructure (if Docker available)
2. Run full test suite: `bun run test`
3. Verify all documentation is accurate
4. Run `bun run build` for final production verification
5. Take screenshots of the complete app

### Final Commit

Commit all Phase 6 changes. Project complete.

---

## Summary

| Phase | What | Agent Team | Teammates | Browser Test |
|-------|------|------------|-----------|--------------|
| 1 | Web3 foundation + README | `phase-1-web3` | 3 | Connect wallet, view demo page |
| 2 | Monorepo + dev wallet + Foundry + Anvil | `phase-2-infra` | 3 (after lead does monorepo) | Dev wallet connects, build works |
| 3 | Safe SDK foundation | `phase-3-safe` | 4 | Safe demo page, create Safe |
| 4 | Transaction layer | `phase-4-tx` | 4 | Full tx lifecycle on Anvil |
| 5 | UI components + example contracts | `phase-5-ui` | 4 | Visual review all components |
| 6 | DX, docs, advanced | `phase-6-dx` | 4 | Full stack test, test suite |
