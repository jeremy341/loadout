#!/usr/bin/env bash
# Runs one platform job through the app's own cron endpoint on this host. Called by /etc/cron.d/loadout, which the deploy
# script writes (scripts/deploy-nest.sh). The endpoint checks CRON_SECRET, so the bearer comes from the shared env file.
#
# Usage: run-cron-job.sh <job-name> <shared-env-file>
set -euo pipefail

job="${1:?job name is required}"
env_file="${2:?shared env file is required}"

case "$job" in
  hackatime-sync|stats-snapshot|queue-health|airbridge-preview|rate-limit-cleanup|session-cleanup) ;;
  *) echo "unknown job: $job"; exit 2 ;;
esac

set -a
. "$env_file"
set +a

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET is not set in $env_file; the cron endpoint refuses every request"
  exit 2
fi

# --fail makes a 409 (the job is still running) or a 500 show up in the cron log.
exec curl --fail --silent --show-error --max-time 290 -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3001/api/cron/$job"
