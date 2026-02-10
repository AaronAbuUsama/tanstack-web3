# Safe App Integration

## Overview

This boilerplate supports two modes of operation:

- **Safe App (iframe)**: Runs inside the Safe web UI at app.safe.global
- **Standalone dApp**: Runs independently with its own wallet connection

## Safe App Manifest

Your app needs a `manifest.json` in the public directory:

```json
{
  "name": "TanStack Web3 Safe App",
  "description": "A Safe App built with TanStack Start",
  "iconPath": "logo192.png"
}
```

## Testing in Safe Iframe

1. Start your dev server: `bun run dev`
2. Go to [app.safe.global](https://app.safe.global)
3. Open a Safe on any supported network
4. Navigate to Apps > Add custom app
5. Enter your local URL: `http://localhost:3000`
6. Your app loads inside the Safe iframe

For deterministic standalone Safe validation (connect, signer switch, setup, pending status), run:

- `cd apps/web && bun run e2e:safe-smoke`
- See: `apps/web/e2e/README.md`

## How Detection Works

The `detectSafeMode()` function in `apps/web/src/safe/core/detect.ts` checks if `window.parent !== window`. If the app is in an iframe, it assumes Safe App mode and initializes the Safe Apps SDK.

For full runtime behavior (context + signer + submission path), see:

- `docs/architecture/runtime-policy.md`

## Permissions

Safe Apps communicate via postMessage. The Safe Apps SDK handles:
- Reading Safe info (address, owners, threshold)
- Proposing transactions through the Safe UI
- Reading chain information

## Registering Your App

To list your app in the official Safe App directory:
1. Deploy your app to a public URL (HTTPS required)
2. Ensure your manifest.json is accessible
3. Submit a PR to the [safe-apps-list](https://github.com/safe-global/safe-apps-list) repository
