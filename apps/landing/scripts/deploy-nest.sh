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

if [ ! -f "$RELEASE_DIR/package.json" ] || [ ! -d "$RELEASE_DIR/.next" ]; then
  echo "Release archive is missing the app contract"
  exit 2
fi

# The environment lives outside the release so it survives every deploy.
ln -sfn "$SHARED_ENV" "$RELEASE_DIR/.env.local"

if [ -L "$CURRENT_LINK" ]; then
  ln -sfn "$(readlink "$CURRENT_LINK")" "$PREVIOUS_LINK"
fi
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

set -a
. "$SHARED_ENV"
set +a

(
  cd "$CURRENT_LINK"
  bunx prisma migrate deploy
  pm2 startOrReload ecosystem.config.cjs --update-env
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
      cd "$CURRENT_LINK"
      pm2 reload ecosystem.config.cjs --update-env
    )
  fi
  exit 1
fi

echo "Deployed $RELEASE_SHA"
