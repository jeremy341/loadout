#!/usr/bin/env bash
set -euo pipefail

# Pin PM2 and Bun to the invoking user's environment. A non-interactive SSH
# shell does not read the login profile, so these paths are set explicitly.
export PM2_HOME="${PM2_HOME:-$HOME/.pm2}"
export PATH="/root/.bun/bin:/opt/node24/bin:$PATH"

# Verified before anything changes: the PM2 state check and the health check need these, and a missing one must not
# look like a failed release.
for tool in node pm2 curl; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "$tool is not on PATH ($PATH); the deploy cannot verify the release"
    exit 2
  fi
done

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
HEALTH_URL="http://127.0.0.1:3001/"

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

# Config guards. Without the proxy flag every /api/v1 caller shares one rate-limit bucket (see lib/platform/client-ip.ts).
if [ "${LOADOUT_TRUST_PROXY:-}" != "true" ]; then
  echo "LOADOUT_TRUST_PROXY must be \"true\" in $SHARED_ENV: the app sits behind the reverse proxy"
  exit 2
fi

# Uploads live outside every release directory so a new deploy never hides existing journal photos and covers.
export LOADOUT_UPLOAD_DIR="${LOADOUT_UPLOAD_DIR:-$APP_ROOT/shared/uploads}"
mkdir -p "$LOADOUT_UPLOAD_DIR"

# The physical path of a release, as PM2 records it. The `current` link is re-pointed on every deploy.
release_path() {
  (cd "$1/apps/landing" && pwd -P)
}

# Print the working directory of the single online `loadout` process. Empty when none is online. A parse failure is an error.
running_cwd() {
  pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const apps = JSON.parse(s).filter((p) => p.name === "loadout" && p.pm2_env.status === "online");
      if (apps.length > 1) { console.error("more than one online loadout process"); process.exit(3); }
      process.stdout.write(apps.length ? apps[0].pm2_env.pm_cwd : "");
    });
  '
}

# PM2 keeps the working directory it was started in, and `pm2 reload` keeps it too. Because `current` moves on every deploy,
# a reload could keep serving the previous release while the health check still passed. So every start deletes the old
# process and starts it from the release directory, then waits until PM2 runs from exactly that directory and the app answers.
start_and_verify() {
  local dir="$1" attempt got=""
  pm2 delete loadout >/dev/null 2>&1 || true
  (cd "$dir" && pm2 start ecosystem.config.cjs --update-env)
  for attempt in $(seq 1 30); do
    got="$(running_cwd)" || got=""
    if [ "$got" = "$dir" ] && curl --fail --silent --show-error --max-time 5 "$HEALTH_URL" >/dev/null; then
      pm2 save
      return 0
    fi
    sleep 1
  done
  echo "Expected PM2 to run from $dir, it runs from '${got:-nothing}', or the health check failed"
  return 1
}

# Use the Prisma CLI pinned in the release. bunx resolves the latest release, which is a different major version.
# A failed migration stops the deploy before the app is replaced.
(
  cd "$CURRENT_LINK/apps/landing"
  ./node_modules/.bin/prisma migrate deploy
)

# The scheduled platform jobs (lib/platform/jobs/registry.ts). Nothing else runs them, so the deploy owns the schedule. Each line
# calls the app's authenticated cron endpoint on this host through scripts/run-cron-job.sh. The file is rewritten on every deploy.
install_cron() {
  local cron_file="/etc/cron.d/loadout" tmp
  if [ -z "${CRON_SECRET:-}" ]; then
    echo "CRON_SECRET is not set in $SHARED_ENV; the scheduled jobs are not installed and the cron endpoint refuses every run"
    return 0
  fi
  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
# Written by apps/landing/scripts/deploy-nest.sh on every deploy. Edit the deploy script, not this file.
*/10 * * * * root bash $CURRENT_LINK/apps/landing/scripts/run-cron-job.sh queue-health $SHARED_ENV >>/var/log/loadout-cron.log 2>&1
17 * * * * root bash $CURRENT_LINK/apps/landing/scripts/run-cron-job.sh session-cleanup $SHARED_ENV >>/var/log/loadout-cron.log 2>&1
23 * * * * root bash $CURRENT_LINK/apps/landing/scripts/run-cron-job.sh rate-limit-cleanup $SHARED_ENV >>/var/log/loadout-cron.log 2>&1
5 */12 * * * root bash $CURRENT_LINK/apps/landing/scripts/run-cron-job.sh stats-snapshot $SHARED_ENV >>/var/log/loadout-cron.log 2>&1
15 3 * * * root bash $CURRENT_LINK/apps/landing/scripts/run-cron-job.sh hackatime-sync $SHARED_ENV >>/var/log/loadout-cron.log 2>&1
30 4 * * * root bash $CURRENT_LINK/apps/landing/scripts/run-cron-job.sh airbridge-preview $SHARED_ENV >>/var/log/loadout-cron.log 2>&1
EOF
  install -m 644 "$tmp" "$cron_file"
  rm -f "$tmp"
  echo "Installed $cron_file"
}

NEW_DIR="$(release_path "$CURRENT_LINK")"
if start_and_verify "$NEW_DIR"; then
  install_cron
  echo "Deployed $RELEASE_SHA from $NEW_DIR"
  exit 0
fi

echo "New release $RELEASE_SHA failed verification; rolling back"
if [ -L "$PREVIOUS_LINK" ]; then
  ln -sfn "$(readlink "$PREVIOUS_LINK")" "$CURRENT_LINK"
  PREVIOUS_DIR="$(release_path "$CURRENT_LINK")"
  if start_and_verify "$PREVIOUS_DIR"; then
    echo "Rolled back to $PREVIOUS_DIR"
  else
    echo "Rollback to $PREVIOUS_DIR also failed verification; the app needs attention"
  fi
else
  echo "No previous release to roll back to"
fi
exit 1
