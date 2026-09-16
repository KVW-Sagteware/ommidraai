# Ommidraai
verken saam

## Overview
lorem ipsum

## Setup
1. Set up docker on your system
2. Create the environment variables (Start Docker Desktop on Windows):
```bash
cp backend/.env.example backend/.env
```
4. (Optional) Change any values in .env
5. Set up the container
```bash
docker compose build
```
6. Start container (See Development or Production)
7. Set up database:
```bash
docker compose exec backend alembic upgrade head
```

## Development
Run from project root:
### Linux
Build First
```bash
docker compose -f docker-compose.yml -f docker-compose.linux.dev.yml up --build
```
Without rebuilding
```bash
docker compose -f docker-compose.yml -f docker-compose.linux.dev.yml up
```
Run in the background
```bash
docker compose -f docker-compose.yml -f docker-compose.linux.dev.yml up -d
```
Rebuild backend
```bash
docker compose build backend
```
Rebuild frontend
```bash
docker compose build frontend
```
Stop containers
```bash
docker compose down
```
### Windows
Build First
```bash
docker compose -f docker-compose.yml -f docker-compose.windows.dev.yml up --build --watch
```
Without rebuilding
```bash
docker compose -f docker-compose.yml -f docker-compose.windows.dev.yml up --watch
```
Run in the background
```bash
docker compose -f docker-compose.yml -f docker-compose.windows.dev.yml up -d
```
then enable watch (Optional)
```bash
docker compose -f docker-compose.yml -f docker-compose.windows.dev.yml watch
```
Rebuild backend
```bash
docker compose build backend
```
Rebuild frontend
```bash
docker compose build frontend
```
Stop containers
```bash
docker compose down
```

## Production
Start production stack
```bash
docker compose up -d
```
Stop the production stack
```bash
docker compose down
```

## Database (Alembic)
Create a new migration
```bash
docker compose exec backend alembic revision --autogenerate -m "<migration-description>"
```
Apply all pending migrations
```bash
docker compose exec backend alembic upgrade head
```
Rollback the latest migration
```bash
docker compose exec backend alembic downgrade -1
```
Show the current migration
```bash
docker compose exec backend alembic current
```
Show migration history
```bash
docker compose exec backend alembic history
```

# OSRM

## Map data

Map coverage is configured in `osrm/maps.txt`: one Geofabrik `.osm.pbf` URL per line (`#` for comments).

On `docker compose up`,the `osrm` container automatically:

1. downloads each missing extract into `osrm/data` (files already present are reused),
2. merges all listed extracts into a single `merged.osm.pbf` using `osmium`,
3. builds the routing graph once (`osrm-extract` -> `osrm-partition` -> `osrm-customize`),
4. starts `osrm-routed --algorithm mld osrm/processed/merged`.

To change coverage, edit `osrm/maps.txt` and re-run `docker compose up -d --build`.
To force a rebuild of the merged graph, delete `osrm/processed/merged.osrm*` first.

> Note: current OSRM cannot merge already-processed `.osrm` datasets (the old
> `osrm-merge` tool only supported CH,and has been removed), so extracts are merged
> *before* extraction into a single dataset.

The old manual scripts (`scripts/setup-osrm.sh` / `scripts/setup-osrm.ps1`)are still
available for one-off processing of single extracts, but are no longer required.
