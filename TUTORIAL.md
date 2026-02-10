# Gnosis Safe Boilerplate Tutorial

A comprehensive guide to building multi-signature dApps with Gnosis Safe, TanStack Start, and Foundry.

**Target audience**: Web3 developers who know React but are new to Gnosis Safe.

**Runtime policy reference**: `docs/architecture/runtime-policy.md` (source of truth for context, signer provider, and transaction submission path decisions).

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Connecting a Wallet](#2-connecting-a-wallet)
3. [Creating a Safe](#3-creating-a-safe)
4. [Safe Command Center](#4-safe-command-center)
5. [Transactions](#5-transactions)
   - [Owner & Threshold Management](#owner--threshold-management)
   - [Guard Management](#guard-management)
   - [Module Management](#module-management)
   - [ABI Bridge](#abi-bridge)
6. [Smart Contracts](#6-smart-contracts)
7. [Architecture Deep Dive](#7-architecture-deep-dive)
8. [Extending the Boilerplate](#8-extending-the-boilerplate)
9. [Deployment](#9-deployment)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### Prerequisites

Before you begin, make sure you have the following tools installed:

- **Node.js** (v18+)
- **Bun** (v1.3+) -- used as the package manager and workspace runner
- **Foundry** (forge, anvil, cast) -- Solidity toolchain for contracts

Install Foundry if you have not already:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Clone and Install

```bash
git clone <repo-url> tanstack-web3
cd tanstack-web3
bun install
```

Bun workspaces will hoist all dependencies to the root `node_modules/` directory. The monorepo has two packages:

- `apps/web/` -- TanStack Start frontend application
- `packages/contracts/` -- Foundry smart contracts

### Start Everything

The quickest way to get the full stack running is:

```bash
bun run dev
```

This starts both Anvil and the TanStack dev server via Turborepo. Anvil forks Gnosis Chiado, giving you a local blockchain with all Safe infrastructure contracts pre-deployed.

Alternatively, you can run them separately in two terminals:

```bash
# Terminal 1: start the local blockchain (Chiado fork)
bun run dev:anvil

# Terminal 2: start the web app
bun run dev:web
```

### Dev Wallet

In development mode (`import.meta.env.DEV === true`), a **Dev Wallet** connector is automatically included. It derives accounts from the default Anvil mnemonic and starts on account index `#0`.

- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account #1**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

Use the **Dev Account** selector in the wallet bar to switch between indices (`#0`, `#1`, ...). Accounts are pre-funded on the local Anvil fork, so you can test without MetaMask or real funds. Select **Anvil (Chiado Fork)** in the chain switcher to connect to your local Anvil fork.
If you need a custom mnemonic in development, set `VITE_DEV_WALLET_MNEMONIC` before running the web app.

Navigate to **http://localhost:3000** to see the application.

---

## 2. Connecting a Wallet

### The /wallet Page

Navigate to `/wallet` to see the wallet connection page. This page demonstrates:

- Connecting and disconnecting wallets
- Displaying your address and ETH balance
- Switching between configured chains

### Connectors: MetaMask vs Dev Wallet

The wagmi config (`apps/web/src/web3/config.ts`) registers two connectors:

1. **Injected** -- connects to browser wallets like MetaMask, Rabby, or Coinbase Wallet
2. **Dev Wallet** -- only available in dev mode; uses mnemonic-derived local accounts with index switching

When you click "Connect Wallet", wagmi's `useConnect` hook lists all available connectors. In production builds, only the injected connector is shown.

### Chain Switching

The boilerplate supports four chains:

| Chain          | Chain ID | Environment |
|----------------|----------|-------------|
| Ethereum       | 1        | All         |
| Sepolia        | 11155111 | All         |
| Gnosis         | 100      | All         |
| Gnosis Chiado  | 10200    | All         |

In development mode, the Gnosis Chiado transport is routed to `http://127.0.0.1:8545` (your local Anvil fork). This means selecting "Anvil (Chiado Fork)" in the chain switcher connects to your local chain with funded local accounts.

### How ConnectWallet Works

The `ConnectWallet` component (`apps/web/src/web3/ConnectWallet.tsx`) uses these wagmi hooks:

- `useAccount()` -- returns `address`, `isConnected`, and `chain`
- `useConnect()` -- provides `connect()` function and list of `connectors`
- `useDisconnect()` -- provides the `disconnect()` function
- `useBalance({ address })` -- fetches the native token balance
- `useSwitchChain()` -- provides `switchChain()` and list of `chains`

Balance formatting uses `formatUnits(balance.value, balance.decimals)` from viem, because wagmi v2's `useBalance` does not include a `.formatted` property.

---

## 3. Creating a Safe

### Navigate to /safe

The `/safe` route is your entry point for multi-sig management. If you are connected to a wallet but have no Safe loaded, you will see two panels:

1. **Create New Safe** -- deploy a fresh Safe proxy contract
2. **Connect to Existing Safe** -- load a previously deployed Safe by address

### Owner Addresses

When creating a Safe, you specify one or more **owner** addresses. These are the Ethereum addresses that will be authorized to approve transactions. Your currently connected wallet address is pre-filled as the first owner.

Click **"+ Add Owner"** to add additional owners. Each owner needs to be a valid Ethereum address (0x...).

### M-of-N Threshold

The **threshold** determines how many owner signatures are required to execute a transaction. For example:

- **1-of-1**: Only one owner, transactions execute immediately after one signature
- **2-of-3**: Three owners, but any two must approve before execution
- **3-of-5**: Five owners, three approvals required

The threshold buttons dynamically adjust based on the number of owners you have configured.

### What Happens When You Click "Deploy Safe"

Here is the sequence of events when you deploy:

1. The `handleDeploy` function calls `safe.deploySafe()` from the SafeProvider context
2. Inside `deploySafe()`, the provider calls `deploySafeLib()` from `standalone.ts`
3. `standalone.ts` dynamically imports Protocol Kit: `await import('@safe-global/protocol-kit')`
4. Protocol Kit's `Safe.init()` is called with a `predictedSafe` configuration containing your owners and threshold
5. The SDK deploys a Safe proxy contract on-chain via the connected signer
6. After deployment, `connectSafe()` is called automatically to load the new Safe into the provider context
7. The command-center overview replaces the setup view

The deployed Safe is a minimal proxy contract that delegates all logic to a shared Safe singleton. This pattern keeps deployment costs low.

---

## 4. Safe Command Center

### After Creating or Connecting a Safe

Once a Safe is loaded, `/safe` renders the command-center shell with a persistent top status bar and sidebar navigation.

The active screen is URL-driven:

- `/safe` or `/safe?screen=overview`
- `/safe?screen=transactions`
- `/safe?screen=owners`
- `/safe?screen=guard`
- `/safe?screen=modules`

The setup/runtime flow also has a dedicated URL state:

- `/safe?screen=setup-runtime`

This URL contract is important for deterministic E2E validation and deep-linking specific screen states.

### How SafeProvider Works

The `SafeProvider` (`apps/web/src/safe/core/provider.tsx`) is still the source of runtime Safe state. On mount, it runs `detectSafeMode()`:

- If the app is running inside an iframe (e.g., embedded in the Safe web app at app.safe.global), it sets mode to `"iframe"` and loads Safe info via the Safe Apps SDK.
- If running as a standalone page, it sets mode to `"standalone"` and waits for the user to deploy or connect.

The provider exposes three key functions:

| Function | Purpose |
| --- | --- |
| `connectSafe()` | Load an existing Safe by address via Protocol Kit |
| `deploySafe()` | Deploy a new Safe and auto-connect to it |
| `disconnectSafe()` | Clear Safe state and return to setup |

### Screen Composition Architecture

Runtime business logic lives in `apps/web/src/safe/**`, while command-center UI lives in `apps/web/src/design-system/compositions/command-center/**`.

Adapters in `apps/web/src/safe/screens/mappers/**` convert live runtime state into composition props.
This keeps transaction/signer behavior independent from presentation.

---

## 5. Transactions

### Transactions Screen On /safe

The transaction workflow is rendered on `/safe?screen=transactions` through `CommandCenterTransactions`.

If no Safe is connected, setup/runtime content is shown instead of command-center transaction controls.

### Building Transactions

The transactions form includes:

- **Recipient Address**
- **Value (ETH)**
- **Operation**
- **Data (hex, optional)**

When you click **Build Transaction**, the flow is:

1. `buildTransaction()` (`apps/web/src/safe/transactions/transactions.ts`) converts input to Safe transaction data.
2. `createTransaction()` (`apps/web/src/safe/core/standalone.ts`) creates a Safe transaction with Protocol Kit.
3. The transaction is proposed into the active pending source (service or local fallback).

### Dual-Mode Flow (Transaction Service vs Local-only)

`apps/web/src/safe/transactions/use-transactions.ts` resolves mode at runtime:

- **Transaction Service mode** (`txSourceMode = transaction-service`)
  - Supported hosted chains and non-local RPCs
  - Proposals/confirmations synchronized via Safe Transaction Service
- **Local-only mode** (`txSourceMode = local`)
  - Localhost/Anvil and unsupported chains
  - Pending metadata stored locally for deterministic local testing

Both modes still create/sign/execute through Protocol Kit.

### Multi-Sig Confirmation States

Pending rows in `CommandCenterTransactions` follow a state machine:

- `pending` -> action label `Sign`
- `ready` -> action label `Execute`
- `executed` -> status badge

For threshold > 1, owners sign until confirmations reach threshold, then execute on-chain.

### Owner & Threshold Management

Owners are managed on `/safe?screen=owners` via `CommandCenterOwners` with runtime actions wired from `DashboardView`.

- Add owner
- Remove owner
- Change threshold

Each action is created/sign/executed as a Safe transaction and then Safe state is refreshed from chain.

### Guard Management

Guard controls live on `/safe?screen=guard` via `CommandCenterGuard`:

- Deploy `SpendingLimitGuard`
- Enable guard
- Disable guard
- View active guard status/limit context

Runtime mapping is handled by `apps/web/src/safe/screens/mappers/guard.ts`.

### Module Management

Module controls live on `/safe?screen=modules` via `CommandCenterModules`:

- Deploy AllowanceModule
- Enable/disable module
- Configure delegate allowance
- Execute delegate spend path

Runtime mapping is handled by `apps/web/src/safe/screens/mappers/modules.ts`.

### ABI Bridge

The `apps/web/src/lib/contracts/` directory provides a bridge between Foundry's compiled contract output and the frontend:

| File           | Purpose                                                |
|---------------|--------------------------------------------------------|
| `abis.ts`     | Typed ABI arrays (`as const`) for active contracts      |
| `bytecodes.ts`| Deployment bytecode hex strings                        |
| `deploy.ts`   | `deployContract` helpers with chain-agnostic setup     |
| `index.ts`    | Barrel re-export                                       |

The deployment helpers detect the chain ID from the RPC endpoint and use viem's `defineChain()` to create a compatible chain config. This means the same deploy function works against Anvil, Chiado, or any other EVM chain.

---

## 6. Smart Contracts

The `packages/contracts/src/` directory contains production Solidity contracts for Safe integration.

### SpendingLimitGuard

**File**: `packages/contracts/src/SpendingLimitGuard.sol`

**What are Transaction Guards?** Guards are pre/post execution hooks that the Safe calls before and after every transaction. They implement the `ITransactionGuard` interface with two key methods:

- `checkTransaction()` -- called before execution; can revert to block the transaction
- `checkAfterExecution()` -- called after execution; can revert to roll back

The `SpendingLimitGuard` checks the ETH value of each transaction against a configurable `spendingLimit`. If a transaction tries to send more ETH than the limit, it reverts with `ExceedsSpendingLimit(value, limit)`.

This guard also checks module transactions via `checkModuleTransaction()`, so the limit applies regardless of whether the transaction goes through the normal multi-sig flow or through a module.

**Use case**: Prevent any single transaction from transferring more than a certain amount of ETH, adding a safety net even if the threshold is met.

### AllowanceModule

**File**: `packages/contracts/src/AllowanceModule.sol`

**What are Safe Modules?** Modules are smart contracts that can execute transactions on behalf of the Safe, bypassing the normal multi-sig approval flow. They call `ISafe.execTransactionFromModule()` to send transactions from the Safe.

The `AllowanceModule` enables delegated spending:

1. The Safe (via multi-sig) calls `setAllowance(delegate, amount, resetPeriod)` to grant a spending budget to a delegate address
2. The delegate can then call `executeAllowance(to, value)` to send ETH from the Safe up to their remaining allowance
3. If a `resetPeriod` is set (in seconds), the spent amount resets to zero after each period elapses

**Key functions**:

| Function              | Who calls it | What it does                                          |
|-----------------------|-------------|-------------------------------------------------------|
| `setAllowance()`     | Safe only   | Grant or update a delegate's spending allowance        |
| `executeAllowance()` | Delegate    | Spend from allowance without multi-sig approval        |
| `getAvailableAllowance()` | Anyone  | Check remaining budget for a delegate                  |

**Use case**: Give team members a weekly or monthly ETH budget they can spend without waiting for multi-sig approval each time.

### Running Contract Tests

```bash
cd packages/contracts
forge test -v
```

This runs all Foundry tests with verbose output showing individual test results and gas usage.

---

## 7. Architecture Deep Dive

### File Tree Overview

```text
tanstack-web3/
  apps/web/
    src/
      design-system/
        compositions/
          command-center/          # Production shell + screen compositions
        domains/
          safe/                    # Domain rows/widgets used by compositions
        fixtures/                  # Storybook/reference fixtures only
      safe/
        contracts/                 # ABI + bytecode bridge for frontend deploy/read
        core/                      # Safe provider + protocol/api/iframe adapters
        runtime/                   # Runtime policy resolver and hook
        screens/
          screen-state.ts          # URL search-state parser/serializer
          screen-layout.tsx        # Shared shell wiring
          mappers/                 # Runtime -> composition prop adapters
        governance/
          SetupView.tsx            # Safe create/connect view
        transactions/
          DashboardView.tsx        # Screen router + runtime action wiring
          transactions.ts          # buildTransaction helper
          use-transactions.ts      # dual-mode tx flow (service/local fallback)
      web3/
        config.ts                  # Wagmi config (chains/connectors/transports)
        dev-wallet.ts              # Dev-only mnemonic wallet connector
      routes/
        safe.tsx                   # /safe route with URL screen state
  packages/contracts/
    src/
      SpendingLimitGuard.sol
      AllowanceModule.sol
```

### SafeProvider Detection Flow

When the app loads, `SafeProvider` runs this detection sequence:

```
Mount -> detectSafeMode()
  |
  +-- window.parent !== window?
        |
        YES -> mode = "iframe"
        |      -> Safe Apps SDK: getSafeInfo()
        |      -> populate owners, threshold, chainId
        |
        NO  -> mode = "standalone"
               -> wait for user to deploy/connect
```

In iframe mode, the Safe web app (app.safe.global) provides all Safe information through the Safe Apps SDK. In standalone mode, the user must explicitly deploy or connect to a Safe.

### Protocol Kit Dynamic Import

The Protocol Kit (`@safe-global/protocol-kit`) has Node.js dependencies including `Buffer`. Instead of importing it statically at the top of a file (which would break Vite's ESM bundling), we use a dynamic import:

```typescript
async function getProtocolKit() {
  const mod = await import('@safe-global/protocol-kit')
  return mod.default ?? mod
}
```

This ensures the import only happens at runtime when needed, after the `vite-plugin-node-polyfills` plugin has set up the necessary polyfills.

### OperationType Local Definition

The `OperationType` enum from `@safe-global/protocol-kit` cannot be imported as a value in the ESM bundle (it gets erased or is unavailable). The boilerplate defines it locally in `transactions.ts`:

```typescript
export const OperationType = {
  Call: 0,
  DelegateCall: 1,
} as const
```

Type-only imports (`import type { ... }`) from protocol-kit work fine since they are erased at compile time.

### Safe SDK Layers

The Safe SDK is organized into three layers, each used for a different purpose:

| Layer            | Package                        | Purpose                                    |
|-----------------|--------------------------------|--------------------------------------------|
| **Protocol Kit** | `@safe-global/protocol-kit`   | Core: create, sign, execute transactions    |
| **API Kit**      | `@safe-global/api-kit`        | Transaction Service: propose, confirm, query |
| **Safe Apps SDK**| `@safe-global/safe-apps-sdk`  | Iframe: communicate with Safe web app       |

This boilerplate primarily uses Protocol Kit for standalone operation. API Kit is integrated via `apps/web/src/safe/core/api.ts` for Safe Transaction Service mode. Safe Apps SDK is used in `apps/web/src/safe/core/iframe.ts` for iframe mode.
Current file ownership:

- API adapter: `apps/web/src/safe/core/api.ts`
- Runtime policy resolver: `apps/web/src/safe/runtime/resolve-runtime-policy.ts`
- Transaction orchestration: `apps/web/src/safe/transactions/use-transactions.ts`
- Safe Apps iframe integration: `apps/web/src/safe/core/iframe.ts`

### Buffer Polyfill

Protocol Kit internally uses Node.js `Buffer`. Since Vite targets the browser, you need `vite-plugin-node-polyfills` in the Vite config to provide a browser-compatible Buffer implementation.

---

## 8. Extending the Boilerplate

### Adding New Routes

TanStack Router uses file-based routing. To add a new page:

1. Create a file in `apps/web/src/routes/`, e.g., `governance.tsx`
2. Export a `Route` using `createFileRoute`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/governance')({
  component: GovernancePage,
})

function GovernancePage() {
  return <div>Governance</div>
}
```

3. TanStack Router automatically regenerates `routeTree.gen.ts` on save

This project currently keeps Safe management and transaction UX together in `apps/web/src/routes/safe.tsx`.

### Adding Smart Contracts

1. Create your Solidity file in `packages/contracts/src/`
2. Write a test in `packages/contracts/test/`
3. Optionally add a deployment script in `packages/contracts/script/`
4. Run tests: `cd packages/contracts && forge test`

### Connecting Contracts to the Safe UI

Use `buildTransaction()` from `apps/web/src/safe/transactions/transactions.ts` to encode a Safe meta-transaction:

```typescript
import { buildTransaction } from '../safe/transactions/transactions'

const txData = buildTransaction({
  to: '0xYourContractAddress' as `0x${string}`,
  value: '0',
  data: '0x',
})

// Then create and execute via the Safe:
const safeTx = await createTransaction(safeInstance, [txData])
const signed = await signTransaction(safeInstance, safeTx)
await executeTransaction(safeInstance, signed)
```

### Transaction Service Configuration

The app automatically chooses Transaction Service mode when:

1. the chain ID is supported by `apps/web/src/safe/core/api.ts`
2. runtime is standalone
3. RPC endpoint is not local (`localhost`/`127.0.0.1`)

On local Anvil/forked development RPCs, the app intentionally falls back to Local-only mode.

### Enabling Gelato Relay (Gasless Transactions)

1. Get a Gelato API key from relay.gelato.digital
2. Set the environment variable: `VITE_GELATO_API_KEY=your_key_here`
3. The `relay.ts` file provides `relayTransaction()` which sends sponsored transactions through Gelato
4. `isRelayAvailable()` checks if the API key is configured

### ERC-4337 Next Steps

Safe can serve as a smart account in the ERC-4337 (Account Abstraction) flow. To add this integration, create an `account-abstraction.ts` module in `apps/web/src/safe/core/` that implements:

- Gasless transactions via paymasters
- Bundled operations
- Social recovery
- Session keys

---

## 9. Deployment

### Build the Project

```bash
bun run build
```

Turbo will build both the web app and compile the contracts in the correct order.

### Deploy Contracts to a Testnet

```bash
cd packages/contracts
forge script script/SpendingLimitGuard.s.sol --rpc-url <sepolia_rpc_url> --broadcast --verify
forge script script/AllowanceModule.s.sol --rpc-url <sepolia_rpc_url> --broadcast --verify
```

Replace `<sepolia_rpc_url>` with your RPC endpoint (e.g., from Alchemy or Infura). Add `--private-key <key>` or use `--ledger` for signing.

### Deploy the Web App

The TanStack Start app can be deployed to any Node.js hosting platform:

- **Vercel**: Supports TanStack Start out of the box
- **Railway**: Point to the `apps/web/` directory
- **Fly.io**: Use a Dockerfile with `bun run build && bun run start`

Make sure to set any required environment variables (e.g., `VITE_GELATO_API_KEY`) on your hosting platform.

### Register as a Safe App

To run your dApp inside the Safe web interface (app.safe.global):

1. Create a `manifest.json` in your public directory with the Safe App metadata
2. Deploy your app to a public URL
3. In the Safe web app, go to Apps > Add Custom App and enter your URL
4. Your app will load in an iframe and automatically detect it via `detectSafeMode()`

---

## 10. Troubleshooting

### wagmi v2 useBalance

wagmi v2's `useBalance` hook returns `{ value, decimals, symbol }` -- there is no `.formatted` property. Use viem's `formatUnits()` instead:

```typescript
import { formatUnits } from 'viem'

const displayBalance = balance?.value !== undefined
  ? formatUnits(balance.value, balance.decimals)
  : '0'
```

### Buffer Polyfill Errors

If you see errors about `Buffer is not defined`, make sure `vite-plugin-node-polyfills` is installed and configured in your Vite config. This is required because `@safe-global/protocol-kit` uses Node.js `Buffer` internally.

### Safe Route Structure

`apps/web/src/routes/safe.tsx` uses URL-driven screen state for command-center navigation.

Use `screen` search params to deep-link screens:

- `/safe?screen=overview`
- `/safe?screen=transactions`
- `/safe?screen=owners`
- `/safe?screen=guard`
- `/safe?screen=modules`
- `/safe?screen=setup-runtime`

### Protocol Kit Import Errors

Never use a static import for `@safe-global/protocol-kit`:

```typescript
// This will fail at build time:
import Safe from '@safe-global/protocol-kit'

// Use dynamic import instead:
const Safe = await import('@safe-global/protocol-kit')
```

Type-only imports are fine since they are erased at compile time:

```typescript
import type { SafeTransactionDataPartial } from '@safe-global/protocol-kit'
```

### "Safe not deployed" or "Invalid multiSend" Errors

This means either Anvil is not running, or Anvil is not forking Chiado. The Safe SDK requires Safe infrastructure contracts (SafeProxyFactory, MultiSend, etc.) to be deployed on the chain. Start Anvil with the Chiado fork:

```bash
bun run dev:anvil
# or directly:
anvil --fork-url https://rpc.chiadochain.net --host 0.0.0.0
```

Make sure port 8545 is available. Select **Gnosis Chiado** in the chain switcher (not Localhost) — in dev mode, this routes to your local Anvil fork.

### Dev Wallet Not Showing

The Dev Wallet connector is only included when `import.meta.env.DEV` is `true`. This means:

- It shows up with `bun run dev` (development mode)
- It does **not** show up with `bun run build && bun run start` (production mode)

This is intentional to prevent exposing deterministic test-wallet signing paths in production bundles.

### Transaction Fails Immediately After Signing

If you are using a multi-sig Safe (threshold > 1), you need multiple owners to sign before execution. Check the **Pending Signatures** panel on `/safe?screen=transactions`. The action switches to **Execute** only when confirmations reach the threshold.

### Large Bundle Size Warning

The Safe SDK adds approximately 100KB gzipped to your bundle. This is expected and comes primarily from Protocol Kit's cryptographic dependencies. The warning in your build output can be safely ignored.
