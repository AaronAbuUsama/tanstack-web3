# TanStack Web3 - Gnosis Safe App Boilerplate

A modern Web3 boilerplate for building [Gnosis Safe](https://safe.global/) (Safe) applications using the TanStack ecosystem.

## Overview

This boilerplate provides a solid foundation for developing Safe Apps - decentralized applications that run inside the Safe wallet interface. It combines the power of TanStack's modern React tooling with Web3 capabilities.

### Tech Stack

- **[TanStack Router](https://tanstack.com/router)** - Type-safe file-based routing
- **[TanStack Query](https://tanstack.com/query)** - Async state management for Web3 data
- **[TanStack Store](https://tanstack.com/store)** - Lightweight state management
- **[Vite](https://vitejs.dev/)** - Fast build tooling
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first styling
- **[Biome](https://biomejs.dev/)** - Fast linting and formatting
- **[Vitest](https://vitest.dev/)** - Unit testing
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager

## Roadmap

### Phase 1: Core Web3 Infrastructure
- [ ] Add wagmi for React hooks for Ethereum
- [ ] Add viem for TypeScript Ethereum utilities
- [ ] Configure chain providers (mainnet, testnets)
- [ ] Set up wallet connection components

### Phase 2: Safe Integration
- [ ] Integrate `@safe-global/safe-apps-sdk` for Safe wallet communication
- [ ] Integrate `@safe-global/safe-apps-react-sdk` for React hooks
- [ ] Add Safe context provider to detect Safe environment
- [ ] Implement Safe transaction service integration
- [ ] Create Safe-aware transaction components

### Phase 3: UI Components
- [ ] Build reusable Web3 UI components (address display, token balances, etc.)
- [ ] Create Safe-specific components (transaction queue, signers list, etc.)
- [ ] Add loading states and error boundaries for async Web3 operations
- [ ] Implement responsive layouts for Safe App iframe

### Phase 4: Developer Experience
- [ ] Add Safe Apps testing utilities
- [ ] Create example Safe App demonstrating all features
- [ ] Document Safe App manifest configuration
- [ ] Add deployment guides for Safe App hosting

### Phase 5: Advanced Features
- [ ] Multi-chain Safe support
- [ ] Safe modules integration
- [ ] Transaction batching utilities
- [ ] Gas estimation helpers

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine
- A Web3 wallet (MetaMask, etc.) for development testing

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Linting & Formatting

```bash
bun run lint    # Run linter
bun run format  # Format code
bun run check   # Run all checks
```

## Project Structure

```
src/
├── routes/          # File-based routes (TanStack Router)
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
├── styles/          # Global styles
└── main.tsx         # Application entry point
```

## Safe App Development

### What is a Safe App?

Safe Apps are web applications that run inside the Safe wallet interface. They can:
- Read the connected Safe's address and chain
- Propose transactions to the Safe
- Access Safe owner and threshold information
- Batch multiple transactions together

### Testing Your Safe App

1. Run your app locally with `bun run dev`
2. Go to the [Safe Wallet](https://app.safe.global/)
3. Navigate to Apps > My Custom Apps
4. Add your local URL: `http://localhost:3000`

### Safe App Manifest

Your Safe App needs a `manifest.json` in the public folder. Example:

```json
{
  "name": "My Safe App",
  "description": "Description of your Safe App",
  "iconPath": "logo.svg"
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Resources

- [Safe Developer Docs](https://docs.safe.global/)
- [Safe Apps SDK](https://github.com/safe-global/safe-apps-sdk)
- [TanStack Documentation](https://tanstack.com/)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
