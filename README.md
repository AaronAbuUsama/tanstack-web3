# Gnosis Safe Boilerplate

A full-stack Web3 starter kit built with TanStack Start and Gnosis Safe SDK. Create, manage, and interact with multi-signature wallets.

## Features

- **Safe Creation** -- Deploy new Gnosis Safe multi-sig wallets
- **Safe Dashboard** -- View owners, threshold, modules, and balances
- **Transaction Pipeline** -- Build, sign, and execute transactions (local-first)
- **Dual Mode** -- Works as Safe App (iframe) or standalone dApp
- **Smart Contracts** -- Counter, SimpleStorage, MultiSigAction, SpendingLimitGuard, AllowanceModule
- **Dev Wallet** -- Auto-connect with Anvil's default account in development
- **Full Test Suite** -- Vitest (frontend) + Forge (contracts)
- **Owner Management** -- Add/remove owners and change threshold on-chain
- **Guard Management** -- Deploy and manage spending limit transaction guards
- **Module Management** -- Deploy AllowanceModule with delegated spending budgets
- **ABI Bridge** -- Typed contract ABIs and deployment helpers from Foundry output

## Quick Start

```bash
bun install
bun run dev
# Open http://localhost:3000
```

For smart contract development:

```bash
# Start local blockchain (forks Gnosis Chiado for Safe SDK support)
bun run dev:anvil

# Run contract tests
cd packages/contracts && forge test -v
```

## Project Structure

```
tanstack-web3/
├── apps/web/                    # TanStack Start app
│   └── src/
│       ├── routes/              # File-based routing
│       │   ├── index.tsx        # Homepage
│       │   ├── wallet.tsx       # Wallet connection
│       │   ├── safe.tsx         # Safe dashboard
│       │   └── safe.transactions.tsx  # Transaction builder
│       ├── components/
│       │   ├── safe/            # Safe UI components (GuardPanel, ModulePanel, etc.)
│       │   └── web3/            # Web3 UI components
│       └── lib/
│           ├── wagmi.ts         # Wallet config
│           ├── contracts/       # ABI bridge (abis, bytecodes, deploy)
│           └── safe/            # Safe SDK integration
│               ├── provider.tsx # SafeProvider context
│               ├── hooks.ts     # useSafe context hook
│               ├── standalone.ts # Protocol Kit wrapper
│               ├── transactions.ts # Transaction building
│               └── detect.ts    # Iframe/standalone detection
├── packages/contracts/          # Foundry smart contracts
│   ├── src/                     # Contract source
│   ├── test/                    # Forge tests
│   └── script/                  # Deploy scripts
├── turbo.json
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) |
| Web3 | [wagmi](https://wagmi.sh) + [viem](https://viem.sh) |
| Safe SDK | [Protocol Kit](https://docs.safe.global/sdk/protocol-kit) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Contracts | [Foundry](https://book.getfoundry.sh) |
| Monorepo | [Turborepo](https://turbo.build) |
| Testing | [Vitest](https://vitest.dev) + [Forge](https://book.getfoundry.sh/forge/) |

## Documentation

See [TUTORIAL.md](./TUTORIAL.md) for a comprehensive walkthrough of every feature.

## Development

```bash
bun run dev        # Start dev server (port 3000)
bun run build      # Production build
bun run test       # Run all tests
```

### Contracts

```bash
cd packages/contracts
forge build        # Compile contracts
forge test -v      # Run contract tests
forge script script/Counter.s.sol --rpc-url http://127.0.0.1:8545 --broadcast  # Deploy
```

## License

MIT
