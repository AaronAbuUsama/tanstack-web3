# Runtime Policy Architecture

This document defines the runtime decision model for Safe flows. It is the source of truth for deciding how the app signs and submits transactions.

## Concepts

- `AppContext`
: Where the app is running.
  - `standalone`
  - `safe-app-iframe`

- `SignerProvider`
: Who provides signing capability.
  - `dev-mnemonic-account`
  - `injected-eip1193`
  - `none`

- `TxSubmissionPath`
: Which transaction lifecycle path is used.
  - `protocol-kit-direct`
  - `safe-apps-sdk`
  - `transaction-service`
  - `none`

## Ownership Map

- Type definitions:
  - `apps/web/src/safe/runtime/types.ts`
- Policy decision function:
  - `apps/web/src/safe/runtime/resolve-runtime-policy.ts`
- React hook wrapper:
  - `apps/web/src/safe/runtime/use-runtime-policy.ts`
- Unit tests:
  - `apps/web/src/safe/runtime/resolve-runtime-policy.test.ts`

## Decision Table

| AppContext | isConnected | connectorId | txServiceEnabled + supported | SignerProvider | TxSubmissionPath | canSign | canSubmit |
|---|---|---|---|---|---|---|---|
| `safe-app-iframe` | any | any | any | `none` | `safe-apps-sdk` | no | yes |
| `standalone` | false | any | any | `none` | `none` | no | no |
| `standalone` | true | `dev-wallet` | false | `dev-mnemonic-account` | `protocol-kit-direct` | yes | yes |
| `standalone` | true | non-dev | false | `injected-eip1193` | `protocol-kit-direct` | yes | yes |
| `standalone` | true | any non-none signer | true | signer from connector | `transaction-service` | yes | yes |

## Rules

- Runtime policy is derived in memory and should not be persisted.
- In dev-wallet standalone mode, signer resolution uses `dev-mnemonic-account` (mnemonic + active account index).
- Active dev account index is runtime-only state and resets on page reload.
- In dev mode, mnemonic may be overridden via `VITE_DEV_WALLET_MNEMONIC`; production ignores this path.
- In iframe context, Safe host/Safe Apps SDK path is authoritative.
- If no signer provider is available in standalone context, app must remain read-only.
- Any change to policy logic must update this document and `resolve-runtime-policy.test.ts` in the same commit.
