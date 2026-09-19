#!/usr/bin/env bash
# Deploys one release on the droplet. Two ways to call it:
#
#   deploy.sh <commit-sha> <artifact.tgz>   (GitHub Actions) the release was BUILT on GitHub's runner and
#                                           uploaded; the droplet only unpacks it. A 2 GB droplet does not
#                                           have the memory to run `next build` next to the live site
#                                           (measured peak 1.5-1.9 GB), so this is the normal path.
#   deploy.sh main                          (fallback, by hand) fetch the repo and build ON the droplet.
#                                           Needs the 2 GB swap file from the runbook; slow and tight.
#
# Layout (created by deploy/DEPLOY_DIGITALOCEAN.md, section 4):
#   /srv/mr-polaa/repo        git clone of the private GitHub repo (only used by the fallback mode)
#   /srv/mr-polaa/shared/.env production secrets (never in git)
#   /srv/mr-polaa/releases/   one folder per deploy
#   /srv/mr-polaa/current     symlink to the live release; PM2 runs from here
#
# A release is built/unpacked in its OWN folder while the live site keeps serving the previous one.
# Only when it is complete is the `current` symlink switched, PM2 reloaded and the site health-checked;
# if the check fails the symlink goes straight back to the previous release.
set -euo pipefail

APP=/srv/mr-polaa
REF="${1:-main}"
ARTIFACT="${2:-}"
KEEP_RELEASES=3
HEALTH_URL="http://127.0.0.1:3000/"

PREVIOUS=$(readlink -f "$APP/current" 2>/dev/null || true)
mkdir -p "$APP/releases"

if [ -n "$ARTIFACT" ]; then
  # ── prebuilt release ────────────────────────────────────────────────────────
  [ -f "$ARTIFACT" ] || { echo "artifact $ARTIFACT not found"; exit 1; }
  SHA="$REF"
  REL="$APP/releases/$(date +%Y%m%d-%H%M%S)-${SHA:0:8}"
  echo "==> Unpacking prebuilt release $SHA into $REL"
  mkdir -p "$REL"
  tar -xzf "$ARTIFACT" -C "$REL"
  rm -f "$ARTIFACT"
  ln -s "$APP/shared/.env" "$REL/.env"
  cd "$REL"
else
  # ── build on the droplet (fallback) ─────────────────────────────────────────
  cd "$APP/repo"
  git fetch --prune origin
  SHA=$(git rev-parse --verify "${REF}^{commit}" 2>/dev/null || git rev-parse --verify "origin/${REF}^{commit}")
  REL="$APP/releases/$(date +%Y%m%d-%H%M%S)-${SHA:0:8}"
  echo "==> Building $SHA on the droplet in $REL"
  mkdir -p "$REL"
  git archive "$SHA" | tar -x -C "$REL"
  ln -s "$APP/shared/.env" "$REL/.env"
  cd "$REL"
  export NEXT_TELEMETRY_DISABLED=1
  export NODE_OPTIONS="--max-old-space-size=1024"
  echo "==> Installing dependencies (also runs prisma generate)"
  npm ci --no-audit --no-fund
  echo "==> Building"
  npm run build -- --webpack
fi

echo "==> Applying database schema changes (additive only: refuses anything that would lose data)"
# No --accept-data-loss on purpose: if a change would drop data this step fails and nothing is deployed.
npx prisma db push --skip-generate

echo "==> Switching to the new release"
# Keep the PM2 definition and this script in step with the code being deployed
cp "$REL/deploy/ecosystem.config.cjs" "$APP/shared/ecosystem.config.cjs"
cp "$REL/deploy/deploy.sh" "$APP/deploy.sh.next" && chmod +x "$APP/deploy.sh.next" && mv -f "$APP/deploy.sh.next" "$APP/deploy.sh"
ln -sfn "$REL" "$APP/current"
if pm2 describe mr-polaa >/dev/null 2>&1; then
  pm2 reload "$APP/shared/ecosystem.config.cjs" --update-env
else
  pm2 start "$APP/shared/ecosystem.config.cjs"
  pm2 save
fi

echo "==> Health check"
ok=0
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)
  if [ "$code" = "200" ]; then ok=1; break; fi
  sleep 2
done

if [ "$ok" != "1" ]; then
  echo "!! New release did not answer 200 - rolling back"
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    ln -sfn "$PREVIOUS" "$APP/current"
    pm2 reload "$APP/shared/ecosystem.config.cjs" --update-env || true
  fi
  exit 1
fi

echo "==> Cleaning up old releases (keeping $KEEP_RELEASES)"
ls -1dt "$APP"/releases/*/ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "==> Deployed $SHA"
