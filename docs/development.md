# Development Guide

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)
- [Docker](https://docs.docker.com/get-docker/) (optional, for local Safe infrastructure)

## Getting Started

```bash
# Install dependencies
bun install

# Start the web app
bun run dev

# Or start just the web app explicitly
bun run dev:web
```

## Monorepo Structure

This project uses Turborepo with Bun workspaces:

- `apps/web` - TanStack Start web application
- `packages/contracts` - Foundry smart contracts

## Runtime Policy

Runtime behavior for Safe setup/sign/submit paths is defined in:

- `docs/architecture/runtime-policy.md`

This is the source of truth for `AppContext`, `SignerProvider`, and `TxSubmissionPath`.

### Transaction Submission Modes

- **Transaction Service mode**: used on supported hosted chains (Mainnet, Gnosis, Sepolia, Chiado) when using non-local RPC endpoints.
- **Local-only mode**: used automatically on local Anvil/localhost RPCs and unsupported chains.

In local-only mode, pending queue metadata is stored in browser state for that local environment.

## Dev Wallet

In development mode (`import.meta.env.DEV`), a Dev Wallet connector is available that derives accounts from the default Anvil mnemonic and exposes an account index selector in the wallet bar.

- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Alt account (#1)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

This wallet auto-connects without MetaMask, and account switching (`#0`, `#1`, ...) is useful for local multi-owner Safe testing.
To override the mnemonic in development only, set `VITE_DEV_WALLET_MNEMONIC` before starting the app.

## Running with Anvil

Anvil is Foundry's local Ethereum node:

```bash
# Start Anvil (in a separate terminal)
bun run dev:anvil

# Deploy contracts to Anvil
cd packages/contracts
forge script script/SpendingLimitGuard.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
forge script script/AllowanceModule.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

## Smart Contracts

```bash
cd packages/contracts

# Build contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Deploy to local Anvil
bun run deploy:local
```

## Adding New Routes

TanStack Router uses file-based routing. Create a new file in `apps/web/src/routes/`:

```bash
# Creates route at /my-page
touch apps/web/src/routes/my-page.tsx
```

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-page')({
  component: MyPage,
})

function MyPage() {
  return <div>My new page</div>
}
```

## Adding New Components

Place components in `apps/web/src/components/`:

- `components/layout/` - Shell/layout primitives
- `components/ui/` - Shared UI building blocks
- `safe/` and `web3/` - Feature/domain modules

## Testing

```bash
# Run all tests
bun run test

# Run web app tests
cd apps/web && bun run test

# Run contract tests
cd packages/contracts && forge test

# Run deterministic Safe smoke browser validation
cd apps/web && bun run e2e:safe-smoke

# Run deterministic two-signer PRD2 validation
cd apps/web && bun run e2e:safe-multisig
```

Smoke artifacts are written to:

- `apps/web/e2e/artifacts/`
- `apps/web/e2e/artifacts/prd2/`
