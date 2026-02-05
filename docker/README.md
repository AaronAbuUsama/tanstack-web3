# Docker Infrastructure

Local Safe development infrastructure using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

## Services

- **anvil** - Local Ethereum node (Foundry) on port 8545, with 5-second block time
- **postgres** - PostgreSQL 16 database for Safe services
- **redis** - Redis 7 cache for Safe Transaction Service
- **safe-transaction-service** - Safe Transaction Service API on port 8000
- **safe-config-service** - Safe Config Service (chain config and Safe App registry) on port 8001

## Usage

```bash
cd docker
docker compose up -d
```

To stop all services:

```bash
docker compose down
```

To stop and remove persisted data:

```bash
docker compose down -v
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | `insecure-dev-key-change-in-production` | Django secret key for Safe services |

## Ports

| Service | Port |
|---|---|
| Anvil (RPC) | 8545 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Safe Transaction Service | 8000 |
| Safe Config Service | 8001 |
