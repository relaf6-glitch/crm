#!/usr/bin/env bash
# Vercel build: run Prisma migrations against the permanent DB, then build Next.js.
#
# Neon (and most poolers) need a DIRECT (non-pooled) connection for migrations.
# If DIRECT_URL is not set in the environment, derive it from DATABASE_URL by
# dropping the "-pooler" host segment and any pgbouncer flag. This keeps the app's
# runtime DATABASE_URL pooled while migrations use a direct connection — with no
# extra env var to configure by hand.
set -euo pipefail

if [ -z "${DIRECT_URL:-}" ]; then
  export DIRECT_URL="$(node -e '
    const u = process.env.DATABASE_URL || "";
    if (!u) { process.stderr.write("DATABASE_URL is not set\n"); process.exit(1); }
    let s = u.replace("-pooler", "");
    s = s.replace(/([?&])pgbouncer=true(&)?/i, (m,p1,p2)=> p2 ? p1 : "").replace(/[?&]$/, "");
    process.stdout.write(s);
  ')"
  echo "Derived DIRECT_URL for migrations from DATABASE_URL (pooler segment stripped)."
fi

echo "Running prisma migrate deploy..."
MIGRATE_ERR="$(mktemp)"
if ! prisma migrate deploy 2> "$MIGRATE_ERR"; then
  cat "$MIGRATE_ERR" >&2
  if grep -q "P3005" "$MIGRATE_ERR"; then
    # Existing (non-empty) schema without Prisma migration history — e.g. created
    # earlier with `prisma db push`. Baseline the init migration as already applied.
    # This only writes to the _prisma_migrations table; it does not alter any data.
    echo "P3005: existing schema detected — baselining 0_init as already applied..."
    prisma migrate resolve --applied 0_init
    prisma migrate deploy
  else
    echo "prisma migrate deploy failed (not P3005)." >&2
    exit 1
  fi
fi

echo "Building Next.js..."
next build
