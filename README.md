# TanStack Web3 - Gnosis Safe Boilerplate

A full-stack Web3 starter kit built with TanStack Start and Gnosis Safe SDK. Supports both **Safe App (iframe)** mode and **Standalone dApp** mode with a unified developer experience.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) — Full-stack React with SSR, file-based routing, server functions
- **Web3:** [wagmi](https://wagmi.sh) + [viem](https://viem.sh) — Type-safe Ethereum interactions
- **Safe:** [Safe SDK](https://docs.safe.global/sdk) — Gnosis Safe smart account integration
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) — Utility-first CSS
- **Build:** [Vite](https://vite.dev) — Fast development and optimized builds
- **Monorepo:** [Turborepo](https://turbo.build) — Incremental builds and task orchestration

## Architecture

### Dual-Mode Safe Integration

| Mode | When | How |
|------|------|-----|
| **Safe App** | Running inside app.safe.global iframe | Safe Apps SDK via postMessage |
| **Standalone** | Direct browser access with custom UI | Safe Protocol Kit as smart account backend |

A unified `useSafe()` hook abstracts both modes — your components work identically regardless of context.

### Project Structure

```
tanstack-web3/
├── apps/web/                 # TanStack Start app
│   └── src/
│       ├── lib/wagmi.ts      # Chain & wallet configuration
│       ├── lib/safe/         # Safe SDK abstractions
│       ├── components/       # UI components
│       └── routes/           # File-based routes
├── packages/contracts/       # Foundry smart contracts
├── turbo.json
└── package.json
```

## Roadmap

- [x] **Phase 1:** Core Web3 infrastructure (wagmi, viem, wallet connection)
- [x] **Phase 2:** Dev infrastructure & monorepo (Turborepo, dev wallet, Foundry, Anvil)
- [x] **Phase 3:** Safe foundation (environment detection, Protocol Kit, API Kit, unified provider)
- [x] **Phase 4:** Transaction layer (tx builder, multi-sig flow, relay)
- [x] **Phase 5:** UI components & examples (Safe management, tx components, example contracts)
- [x] **Phase 6:** DX, docs & advanced (Docker, testing utils, deployment guides, ERC-4337)

## Development

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run test       # Run tests
bun run lint       # Lint code
bun run format     # Format code
```

## License

MIT
