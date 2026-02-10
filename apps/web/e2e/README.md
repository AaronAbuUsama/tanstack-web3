# Safe Smoke E2E

Deterministic Playwright smoke coverage for the Safe baseline.

## What It Validates

- `/safe` route loads in standalone mode.
- Dev Wallet can connect.
- Dev account selector switches from `#0` to `#1`.
- Setup flow remains usable after signer switch (create/connect panels + Safe deploy).
- A pending transaction remains `Pending` (not `Ready`) before threshold confirmations are met.

## Run

From `apps/web`:

```bash
bun run e2e:storybook-visual
bun run e2e:safe-multisig
bun run e2e:safe-smoke
```

The Playwright config starts:

- web dev server on a dedicated e2e port (`bun run dev -- --port 4173 --strictPort`)

Both scripts ensure an Anvil RPC is available on `127.0.0.1:8545`:

- uses an existing Anvil instance if reachable
- otherwise starts `bun run --cwd ../.. dev:anvil` for the test run

`e2e:storybook-visual` runs against Storybook on a fixed port and captures desktop/mobile snapshots.

## Artifacts

Screenshots are written to:

- `apps/web/e2e/artifacts/`
- `apps/web/e2e/artifacts/prd2/` for multisigner PRD2 captures
- `apps/web/e2e/artifacts/prd3/` for Storybook PRD3 captures

Playwright test output is written to:

- `apps/web/e2e/artifacts/test-results/`
