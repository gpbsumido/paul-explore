#!/usr/bin/env bash
# One attempt at installing Chromium and the system packages it needs, in CI.
# Runs under scripts/with-retries.mjs, which kills an attempt that stalls and
# says which attempt this is in WITH_RETRIES_ATTEMPT.
set -euo pipefail

if [ "${WITH_RETRIES_ATTEMPT:-1}" -gt 1 ]; then
  # A killed attempt can leave apt-get alive and holding its lock (sudo passes
  # on SIGTERM, not SIGKILL), or dpkg half way through unpacking. Either one
  # makes every later apt run fail on the spot, which is how the 7.24.1 release
  # run went: one stall, then two retries that died in seconds.
  sudo pkill -KILL -x apt-get || true
  sudo pkill -KILL -x dpkg || true
  sudo dpkg --configure -a
fi

# The browser comes from Playwright's own download, or the cache, never apt.
pnpm exec playwright install chromium

# apt only runs when Chromium can't start without it. ubuntu-latest (26.04)
# already has every library Chromium needs; what --with-deps added there was
# about 25 MB of CJK, Thai and Unicode fonts, and on a slow mirror that download
# is what stalled the October 23, 2026 runs. No test compares screenshots, so
# the fonts change nothing they assert.
if node scripts/chromium-launches.mjs; then
  echo "Chromium starts without extra system packages, so apt is skipped."
  exit 0
fi
pnpm exec playwright install-deps chromium
