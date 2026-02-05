# Deployment Guide

## Building for Production

```bash
# From monorepo root
bun run build
```

This builds all packages via Turborepo. The web app output is in `apps/web/dist/`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GELATO_API_KEY` | Gelato API key for gasless transactions | No |

## Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Build command: `cd ../.. && bun run build`
4. Output directory: `dist`
5. Set environment variables in Vercel dashboard

## Deploying to Netlify

1. Connect your GitHub repository to Netlify
2. Base directory: `apps/web`
3. Build command: `cd ../.. && bun run build`
4. Publish directory: `apps/web/dist`

## Safe App Manifest

For Safe App deployment, ensure `apps/web/public/manifest.json` contains:

```json
{
  "name": "Your App Name",
  "description": "Your app description",
  "iconPath": "logo192.png"
}
```

The manifest is required for your app to be listed in the Safe App directory.
