# Gnosis Safe Boilerplate Tutorial

A comprehensive guide to building multi-signature dApps with Gnosis Safe, TanStack Start, and Foundry.

**Target audience**: Web3 developers who know React but are new to Gnosis Safe.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Connecting a Wallet](#2-connecting-a-wallet)
3. [Creating a Safe](#3-creating-a-safe)
4. [Safe Dashboard](#4-safe-dashboard)
5. [Transactions](#5-transactions)
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
bun run dev:all
```

This starts both Anvil (a local Ethereum node on port 8545) and the TanStack dev server in parallel.

Alternatively, you can run them separately in two terminals:

```bash
# Terminal 1: start the local blockchain
bun run dev:anvil

# Terminal 2: start the web app
bun run dev
```

### Dev Wallet

In development mode (`import.meta.env.DEV === true`), a **Dev Wallet** connector is automatically included. This connector uses Anvil's first default account:

- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

This account is pre-funded with 10,000 ETH on the local Anvil chain, so you can test everything without MetaMask or real funds.

Navigate to **http://localhost:3000** to see the application.

---

## 2. Connecting a Wallet

### The /wallet Page

Navigate to `/wallet` to see the wallet connection page. This page demonstrates:

- Connecting and disconnecting wallets
- Displaying your address and ETH balance
- Switching between configured chains

### Connectors: MetaMask vs Dev Wallet

The wagmi config (`apps/web/src/lib/wagmi.ts`) registers two connectors:

1. **Injected** -- connects to browser wallets like MetaMask, Rabby, or Coinbase Wallet
2. **Dev Wallet** -- only available in dev mode; auto-connects Anvil's default account

When you click "Connect Wallet", wagmi's `useConnect` hook lists all available connectors. In production builds, only the injected connector is shown.

### Chain Switching

The boilerplate supports five chains:

| Chain          | Chain ID | Environment |
|----------------|----------|-------------|
| Ethereum       | 1        | All         |
| Sepolia        | 11155111 | All         |
| Gnosis         | 100      | All         |
| Gnosis Chiado  | 10200    | All         |
| Localhost       | 31337    | Dev only    |

Localhost (Anvil) is only added to the chain list when running in development mode. The chain switcher uses wagmi's `useSwitchChain` hook.

### How ConnectWallet Works

The `ConnectWallet` component (`apps/web/src/components/ConnectWallet.tsx`) uses these wagmi hooks:

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
7. The dashboard view replaces the setup view

The deployed Safe is a minimal proxy contract that delegates all logic to a shared Safe singleton. This pattern keeps deployment costs low.

---

## 4. Safe Dashboard

### After Creating or Connecting a Safe

Once a Safe is loaded, the dashboard shows a top bar with chain badge (network name and ID), the Safe address, and a disconnect button.

Below that, a grid of information cards displays the Safe's configuration.

### Owners Component

The Owners card (`apps/web/src/components/safe/Owners.tsx`) lists every owner address. If your currently connected wallet address matches an owner, it shows a "(you)" indicator next to that address.

### Threshold Component

The Threshold card (`apps/web/src/components/safe/Threshold.tsx`) displays the current M-of-N configuration with a visual progress bar. For example, "2 of 3 owners required" with a bar showing 2/3 filled.

### Modules Component

The Modules card (`apps/web/src/components/safe/Modules.tsx`) is a placeholder for displaying Safe modules that have been enabled. Modules are smart contracts that extend the Safe with custom transaction logic (more on this in Section 6).

### How SafeProvider Works

The `SafeProvider` (`apps/web/src/lib/safe/provider.tsx`) is a React context provider that manages all Safe state. On mount, it runs `detectSafeMode()`:

- If the app is running inside an iframe (e.g., embedded in the Safe web app at app.safe.global), it sets mode to `"iframe"` and loads Safe info via the Safe Apps SDK
- If running as a standalone page, it sets mode to `"standalone"` and waits for the user to deploy or connect

The provider exposes three key functions:

| Function         | Purpose                                              |
|-----------------|------------------------------------------------------|
| `connectSafe()` | Load an existing Safe by address via Protocol Kit     |
| `deploySafe()`  | Deploy a new Safe and auto-connect to it              |
| `disconnectSafe()` | Clear Safe state and return to the setup view       |

### ChainBadge and AddressDisplay

These are reusable web3 UI components:

- `ChainBadge` shows the connected network with a colored dot
- `AddressDisplay` shows a truncated Ethereum address with copy-to-clipboard

---

## 5. Transactions

### Navigate to /safe/transactions

The transactions page is a child route of `/safe`. It shows the transaction builder, the pending transaction queue, and the execution history.

If no Safe is connected, you will see a prompt to go back to the Safe dashboard first.

### Building Transactions

The **TxBuilder** component presents three fields:

- **To** -- the recipient address (0x...)
- **Value** -- the ETH amount to send (e.g., "0.1")
- **Data** -- raw calldata hex (defaults to "0x" for plain ETH transfers)

When you click "Build Transaction", the following happens:

1. `buildTransaction()` from `transactions.ts` converts your input into a `MetaTransactionData` object. The ETH value string is converted to wei using viem's `parseEther()`
2. `createTransaction()` from `standalone.ts` wraps it into a Safe transaction via Protocol Kit
3. The transaction is added to the local queue

### Local-First Flow

This boilerplate uses a **local-first** transaction flow. There is no external Transaction Service required for basic operation. Transactions are created, signed, and executed entirely through Protocol Kit and on-chain calls.

The transaction lifecycle:

```
Build -> Sign -> Execute
```

### 1-of-1 Safe: Auto Sign and Execute

For a Safe with a threshold of 1 (single owner), the flow is automatic:

1. Build the transaction
2. `signTransaction()` adds the owner's signature immediately
3. `executeTransaction()` submits the signed transaction on-chain
4. The transaction appears in the history with its transaction hash

This all happens in one click.

### Multi-Sig Flow

For a Safe with threshold > 1 (e.g., 2-of-3):

1. **Propose**: Owner A builds and signs the transaction. It enters the queue as "pending"
2. **Confirm**: Owner B opens the same Safe and adds their signature via the "Confirm" button
3. **Execute**: Once enough signatures are collected (confirmations >= threshold), anyone can click "Execute" to submit on-chain

The **TxQueue** component shows pending transactions with a confirmation progress bar (e.g., "1/2 confirmations").

The **TxHistory** component shows executed transactions with their on-chain transaction hash.

### TransactionFlow Component

The `TransactionFlow` component shows a detailed step-by-step view of the most recent pending transaction, including:

- Transaction details (to, value, data)
- Current confirmation count vs required threshold
- Buttons to confirm or execute based on the current state

---

## 6. Smart Contracts

The `packages/contracts/src/` directory contains five Solidity contracts that demonstrate different patterns for Safe integration.

### Counter

**File**: `packages/contracts/src/Counter.sol`

A simple contract with `increment()` and `decrement()` functions. Emits a `CountChanged` event. Useful as a basic example for building contract call transactions from the Safe UI.

### SimpleStorage

**File**: `packages/contracts/src/SimpleStorage.sol`

A key-value store on-chain. Call `set(key, value)` to store a string, and `get(key)` to retrieve it. Emits a `ValueSet` event with the key, value, and caller address.

### MultiSigAction

**File**: `packages/contracts/src/MultiSigAction.sol`

Demonstrates the **`onlySafe` modifier** pattern. This contract stores an immutable `safe` address in its constructor. The `executeAction()` function can only be called by the Safe itself (i.e., through a multi-sig transaction). Any direct call from an EOA will revert with `OnlySafe()`.

This pattern is useful when you want a contract that can only be operated by its governing Safe.

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

```
tanstack-web3/
  apps/web/
    src/
      components/
        ConnectWallet.tsx          # Wallet connection UI
        Header.tsx                 # App header
        Web3Provider.tsx           # Wagmi + QueryClient wrapper
        safe/
          Owners.tsx               # Owner list display
          Threshold.tsx            # Threshold progress bar
          Modules.tsx              # Module list (placeholder)
          TransactionFlow.tsx      # Step-by-step tx view
          TxBuilder.tsx            # Transaction input form
          TxQueue.tsx              # Pending transaction list
          TxHistory.tsx            # Executed transaction list
        web3/
          AddressDisplay.tsx       # Truncated address + copy
          ChainBadge.tsx           # Network indicator
          TokenBalances.tsx        # Token balance display
      lib/
        wagmi.ts                   # Wagmi config (chains, connectors, transports)
        dev-wallet.ts              # Dev-only wallet connector for Anvil
        safe/
          detect.ts                # iframe vs standalone detection
          provider.tsx             # SafeProvider context
          hooks.ts                 # useSafe, useSafeInstance, etc.
          standalone.ts            # Protocol Kit integration
          transactions.ts          # buildTransaction, buildContractCall
          iframe.ts                # Safe Apps SDK integration
          multisig.ts              # Transaction Service (API Kit)
          relay.ts                 # Gelato relay for gasless txs
          api.ts                   # API Kit factory
          tx-hooks.ts              # Transaction React hooks
          account-abstraction.ts   # ERC-4337 placeholder
      routes/
        __root.tsx                 # Root layout
        index.tsx                  # Home page
        wallet.tsx                 # /wallet route
        safe.tsx                   # /safe route (parent)
        safe.transactions.tsx      # /safe/transactions (child)
  packages/contracts/
    src/
      Counter.sol
      SimpleStorage.sol
      MultiSigAction.sol
      SpendingLimitGuard.sol
      AllowanceModule.sol
    foundry.toml
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

This boilerplate primarily uses Protocol Kit for standalone operation. API Kit is available in `multisig.ts` for use with the Safe Transaction Service. Safe Apps SDK is used in `iframe.ts` for iframe mode.

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

Note on dot-separator routing: `safe.transactions.tsx` creates a child route `/safe/transactions` under the `/safe` parent. The parent route (`safe.tsx`) must include `<Outlet />` for child routes to render. If you want a flat sibling route instead, use an underscore: `safe_transactions.tsx`.

### Adding Smart Contracts

1. Create your Solidity file in `packages/contracts/src/`
2. Write a test in `packages/contracts/test/`
3. Optionally add a deployment script in `packages/contracts/script/`
4. Run tests: `cd packages/contracts && forge test`

### Connecting Contracts to the Safe UI

Use `buildContractCall()` from `transactions.ts` to encode a contract function call as a Safe transaction:

```typescript
import { buildContractCall } from '../lib/safe/transactions'

const txData = buildContractCall({
  to: '0xYourContractAddress' as `0x${string}`,
  abi: YourContractABI,
  functionName: 'increment',
  args: [],
})

// Then create and execute via the Safe:
const safeTx = await createTransaction(safeInstance, [txData])
const signed = await signTransaction(safeInstance, safeTx)
await executeTransaction(safeInstance, signed)
```

### Enabling the Transaction Service

For production multi-sig workflows across multiple sessions, you can use the Safe Transaction Service:

1. Run the Safe Transaction Service locally via Docker (see Safe docs)
2. The `multisig.ts` file already contains `proposeMultisigTransaction()`, `confirmMultisigTransaction()`, and `executeMultisigTransaction()` functions
3. These use API Kit to submit and retrieve pending transactions from the service
4. Wire up the UI to call these functions instead of the local-first flow

### Enabling Gelato Relay (Gasless Transactions)

1. Get a Gelato API key from relay.gelato.digital
2. Set the environment variable: `VITE_GELATO_API_KEY=your_key_here`
3. The `relay.ts` file provides `relayTransaction()` which sends sponsored transactions through Gelato
4. `isRelayAvailable()` checks if the API key is configured

### ERC-4337 Next Steps

The `account-abstraction.ts` file is a placeholder for ERC-4337 (Account Abstraction) integration. Safe can serve as a smart account in the ERC-4337 flow, enabling features like:

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
forge script script/Deploy.s.sol --rpc-url <sepolia_rpc_url> --broadcast --verify
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

### TanStack Router Dot-Separator Routing

A file named `safe.transactions.tsx` creates a **child route** of `safe.tsx`. The parent route must render `<Outlet />` for the child to appear. If you want a flat sibling route instead, rename the file to `safe_transactions.tsx` (underscore instead of dot).

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

### "Safe not deployed" Errors

This usually means Anvil is not running. Start it with:

```bash
bun run dev:anvil
# or directly:
anvil --host 0.0.0.0
```

Make sure port 8545 is available. The Safe deployment flow connects to `http://127.0.0.1:8545` by default.

### Dev Wallet Not Showing

The Dev Wallet connector is only included when `import.meta.env.DEV` is `true`. This means:

- It shows up with `bun run dev` (development mode)
- It does **not** show up with `bun run build && bun run start` (production mode)

This is intentional to prevent exposing the dev private key in production.

### Transaction Fails Immediately After Signing

If you are using a multi-sig Safe (threshold > 1), you need multiple owners to sign before execution. Check the TxQueue for the confirmation count. Only when confirmations >= threshold can the transaction be executed.

### Large Bundle Size Warning

The Safe SDK adds approximately 100KB gzipped to your bundle. This is expected and comes primarily from Protocol Kit's cryptographic dependencies. The warning in your build output can be safely ignored.
