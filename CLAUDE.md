# TanStack Web3 - Gnosis Safe Boilerplate

## Project Structure

- **Monorepo**: Turborepo with Bun workspaces
  - `apps/web/` — TanStack Start frontend (Vite + React)
  - `packages/contracts/` — Foundry smart contracts
- **Routing**: File-based via TanStack Router (auto-generates `routeTree.gen.ts`)
- **Web3 Stack**: wagmi v2 + viem + @safe-global/protocol-kit
- **Build**: `turbo.json` outputs must include both `dist/**` and `out/**`

## Key Patterns

- Root route uses `shellComponent` (SSR shell) + `component` (client-side with providers)
- Web3Provider wraps WagmiProvider + QueryClientProvider
- SafeProvider wraps children inside Web3Provider for dual-mode detection
- Dev wallet connector only included when `import.meta.env.DEV` is true

## Safe SDK Compatibility

- `@safe-global/protocol-kit` uses Node.js `Buffer` — requires `vite-plugin-node-polyfills`
- `OperationType` enum can't be imported as value from protocol-kit ESM — define locally
- Use dynamic `import()` for protocol-kit to avoid build-time ESM resolution issues
- Type-only imports (`import type`) from protocol-kit work fine (erased at compile time)

## Known Issues

- wagmi v2 `useBalance` returns `{ value, decimals, symbol }` — NO `.formatted`. Use `formatUnits()` from viem
- TanStack Router dot separator (`safe.transactions.tsx`) = child route — parent needs `<Outlet />`
- Dev wallet `createConnector` return type has TS incompatibility with newer wagmi generics (runtime OK)

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Agent Teams Over Subagents (MANDATORY)
- **Every plan MUST use agent teams** via `Teammate.spawnTeam` — never plain subagents alone
- Use `Teammate` tool to create a team, then spawn teammates with `Task` tool using `team_name` parameter
- Create a shared task list with `TaskCreate` so teammates can coordinate
- Assign tasks to teammates via `TaskUpdate` with `owner` parameter
- Use `SendMessage` for inter-agent communication and coordination
- One focused task per teammate for clean execution
- Use teams to parallelize independent work streams (e.g., frontend + contracts, research + implementation)
- Only use standalone `Task` subagents (without teams) for trivial, isolated lookups that need no coordination

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake recurring
- Ruthlessly iterate on lessons until mistake rate drops
- Review lessons at session start for relevant context

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: start over with the elegant solution
- Skip this for simple, obvious fixes — don't over-engineer

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Spin Up Team**: Create agent team matching the plan's work streams
3. **Verify Plan**: Check in with user before starting implementation
4. **Track Progress**: Mark task list items complete as teammates finish
5. **Explain Changes**: High-level summary at each step
6. **Document Results**: Add review section to `tasks/todo.md`
7. **Capture Lessons**: Update `tasks/lessons.md` after corrections
8. **Shutdown Team**: Gracefully shut down teammates when all tasks complete

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Teams by Default**: Coordinate with agent teams for any multi-step plan. Solo subagents are the exception, not the rule.
