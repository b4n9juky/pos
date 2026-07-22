#!/bin/sh
set -e

echo "=== POS App Entrypoint ==="
echo "DB_MIGRATE=${DB_MIGRATE:-true}"
echo "DB_SEED=${DB_SEED:-false}"

if [ "${DB_MIGRATE:-true}" = "true" ]; then
  echo "Running database migrations..."
  node scripts/migrate.mjs
  echo "Migrations done."
fi

if [ "${DB_SEED}" = "true" ]; then
  echo "Seeding database..."
  node scripts/seed.mjs
  echo "Seed done."
fi

echo "Starting Next.js server..."
exec "$@"
