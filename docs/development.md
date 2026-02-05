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

## Dev Wallet

In development mode (`import.meta.env.DEV`), a Dev Wallet connector is available that uses Hardhat's account #0:

- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

This wallet auto-connects without MetaMask, perfect for local development.

## Running with Anvil

Anvil is Foundry's local Ethereum node:

```bash
# Start Anvil (in a separate terminal)
bun run dev:anvil

# Deploy contracts to Anvil
cd packages/contracts
forge script script/Counter.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
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

- `components/safe/` - Safe-specific components
- `components/web3/` - General Web3 components
- `components/` - Shared UI components

## Testing

```bash
# Run all tests
bun run test

# Run web app tests
cd apps/web && bun run test

# Run contract tests
cd packages/contracts && forge test
```
