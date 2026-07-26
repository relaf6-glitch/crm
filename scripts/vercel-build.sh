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
prisma migrate deploy

echo "Building Next.js..."
next build
