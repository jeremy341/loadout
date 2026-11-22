#!/usr/bin/env bash
set -euo pipefail

# Pin PM2 and Bun to the invoking user's environment. A non-interactive SSH
# shell does not read the login profile, so these paths are set explicitly.
export PM2_HOME="${PM2_HOME:-$HOME/.pm2}"
export PATH="/root/.bun/bin:/opt/node24/bin:$PATH"

if [ -z "${RELEASE_SHA:-}" ] || [ -z "${RELEASE_ARCHIVE:-}" ] || [ -z "${APP_ROOT:-}" ]; then
  echo "RELEASE_SHA, RELEASE_ARCHIVE and APP_ROOT are required"
  exit 2
fi

case "$RELEASE_SHA" in
  *[!a-fA-F0-9]*|'') echo "RELEASE_SHA must be a hexadecimal commit"; exit 2 ;;
esac

if [ ! -f "$RELEASE_ARCHIVE" ]; then
  echo "Release archive not found"
  exit 2
fi

RELEASE_DIR="$APP_ROOT/releases/$RELEASE_SHA"
APP_DIR="$RELEASE_DIR/apps/landing"
CURRENT_LINK="$APP_ROOT/current"
PREVIOUS_LINK="$APP_ROOT/previous"
SHARED_ENV="$APP_ROOT/shared/loadout.env"

if [ ! -f "$SHARED_ENV" ]; then
  echo "Missing $SHARED_ENV; the server env file must exist before deploying"
  exit 2
fi

mkdir -p "$APP_ROOT/releases"

if [ ! -f "$RELEASE_DIR/package.json" ]; then
  mkdir -p "$RELEASE_DIR"
  tar -xzf "$RELEASE_ARCHIVE" -C "$RELEASE_DIR"
fi

if [ ! -f "$RELEASE_DIR/package.json" ] || [ ! -f "$APP_DIR/package.json" ] || [ ! -d "$APP_DIR/.next" ]; then
  echo "Release archive is missing the app contract"
  exit 2
fi

# The environment lives outside the release so it survives every deploy.
ln -sfn "$SHARED_ENV" "$APP_DIR/.env.local"

if [ -L "$CURRENT_LINK" ]; then
  ln -sfn "$(readlink "$CURRENT_LINK")" "$PREVIOUS_LINK"
fi
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

set -a
. "$SHARED_ENV"
set +a

# PM2 keeps the working directory it was first started in, and a plain reload keeps it. The current link moves to a new
# release on every deploy, so a reload alone would keep serving the old code. Start from the current release whenever PM2
# points anywhere else; reload only when it already runs from the same directory.
start_from_current() {
  local target running
  target="$(cd "$CURRENT_LINK/apps/landing" && pwd -P)"
  running="$(pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const app=JSON.parse(s).find(p=>p.name==="loadout");process.stdout.write(app?app.pm2_env.pm_cwd:"")}catch{process.stdout.write("")}})' || true)"
  cd "$target"
  if [ "$running" = "$target" ]; then
    pm2 reload ecosystem.config.cjs --update-env
  else
    pm2 delete loadout >/dev/null 2>&1 || true
    pm2 start ecosystem.config.cjs --update-env
  fi
}

(
  cd "$CURRENT_LINK/apps/landing"
  # Use the Prisma CLI pinned in the release. bunx resolves the latest release, which is a different major version.
  ./node_modules/.bin/prisma migrate deploy
  start_from_current
)
pm2 save

HEALTH_URL="http://127.0.0.1:3001/"
healthy=false
for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 5 "$HEALTH_URL" >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [ "$healthy" != true ]; then
  echo "New release failed the health check; rolling back"
  if [ -L "$PREVIOUS_LINK" ]; then
    ln -sfn "$(readlink "$PREVIOUS_LINK")" "$CURRENT_LINK"
    (
      start_from_current
    )
    pm2 save
  fi
  exit 1
fi

echo "Deployed $RELEASE_SHA"
