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

pnpm exec playwright install chromium --with-deps
