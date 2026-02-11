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
bun run e2e:safe-screen-matrix
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
- `apps/web/e2e/artifacts/prd4/` for screen-by-screen PRD4 matrix captures
- `apps/web/e2e/artifacts/prd5/` for core-flow browser audit captures
- `apps/web/e2e/artifacts/prd6/` for scenario remediation captures

Playwright test output is written to:

- `apps/web/e2e/artifacts/test-results/`

## Manual Browser Harness (agent-browser)

Use this when a PRD requires real browser evidence at each deliverable.

### 1) Environment preflight

From repo root:

```bash
# Anvil health check
curl -sS -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  http://127.0.0.1:8545

# If RPC is down
bun run dev:anvil
```

### 2) Dedicated app server (fixed port)

Use a dedicated port to avoid conflicts with your daily dev session:

```bash
bun run --cwd apps/web dev -- --port 3002 --strictPort
```

### 3) agent-browser session lifecycle

```bash
# open app in isolated session
agent-browser --session prd6 open http://localhost:3002/safe

# inspect interactables
agent-browser --session prd6 snapshot -i

# interact
agent-browser --session prd6 click @e1
agent-browser --session prd6 fill @e2 "value"
agent-browser --session prd6 select @e3 "Anvil (Chiado Fork)"

# capture evidence
agent-browser --session prd6 screenshot \
  /absolute/path/to/apps/web/e2e/artifacts/prd6/<name>.png
agent-browser --session prd6 snapshot -c \
  > /absolute/path/to/apps/web/e2e/artifacts/prd6/<name>.txt

# close session
agent-browser --session prd6 close
```

### 4) Required evidence per verification checkpoint

- one screenshot (`.png`) before/after critical action
- one compact semantic snapshot (`.txt`) for state proof
- optional console dump when diagnosing:

```bash
agent-browser --session prd6 console > apps/web/e2e/artifacts/prd6/<name>-console.txt
```
