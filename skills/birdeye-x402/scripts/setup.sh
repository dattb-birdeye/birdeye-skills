#!/usr/bin/env bash
# One-shot setup. Idempotent. Designed for sandboxed agent runtimes (Codex,
# Cursor, Claude Code) where network access may need explicit approval.
#
# Steps are split so the agent can request the right permission for each:
#
#   bash setup.sh deps             # npm install (NEEDS NETWORK to npm registry)
#   bash setup.sh env <base58>     # write .env (no network)
#   bash setup.sh smoke            # 1 paid call (NEEDS NETWORK to Birdeye)
#   bash setup.sh                  # do all 3 if possible; emit exit code below
#
# Exit codes:
#   0 = ready (deps + env + smoke ok, or skipped smoke because env already set)
#   2 = need PRIVATE_KEY — ask user for one base58 key, then re-run
#   3 = deps missing — run `bash setup.sh deps` with network approval, then re-run
#   1 = real failure — show stderr to user
set -euo pipefail

cd "$(dirname "$0")/.."

# @solana/kit upstream declares engines.node = ">=20.18.0". In practice
# Node 20.x runs fine because Web Crypto Ed25519 landed in 20.0. We hard-fail
# only on < 20, and warn on 20.0–20.17 so users aren't blocked but know to
# upgrade for full upstream compliance.
NODE_VER="$(node -p 'process.versions.node' 2>/dev/null || echo 0.0.0)"
NODE_MAJOR="${NODE_VER%%.*}"
NODE_MINOR="$(echo "$NODE_VER" | cut -d. -f2)"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "[setup] ERROR: Node.js >= 20 required (you have v$NODE_VER)." >&2
  echo "[setup] Install via nvm: nvm install 20 && nvm use 20" >&2
  exit 1
fi
if [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 18 ]; then
  echo "[setup] WARN: Node v$NODE_VER works but @solana/kit recommends >=20.18.0." >&2
  echo "[setup] Upgrade with: nvm install 20 && nvm use 20" >&2
fi

CMD="${1:-all}"
KEY_FROM_ARG="${2:-}"
KEY_FROM_ENV="${PRIVATE_KEY:-}"

install_deps() {
  echo "[setup] npm install (this needs network)..."
  # --prefer-offline + --no-audit + --no-fund minimise round-trips and noise.
  # If sandbox blocks network, npm fails fast instead of hanging on metadata.
  npm install --no-audit --no-fund --prefer-offline --progress=false
  echo "[setup] deps ok."
}

write_env() {
  local key="${KEY_FROM_ARG:-$KEY_FROM_ENV}"
  if [ -n "$key" ]; then
    echo "PRIVATE_KEY=${key}" > .env
    chmod 600 .env
    echo "[setup] wrote .env (mode 600)."
  elif [ ! -f .env ]; then
    cp .env.example .env
    chmod 600 .env
  fi
}

run_smoke() {
  echo "[setup] smoke test (1 paid call)..."
  node scripts/smoke-test.mjs
}

has_deps() { [ -d node_modules ] && [ -d node_modules/@x402 ]; }
has_key()  { grep -qE '^PRIVATE_KEY=.+' .env 2>/dev/null; }

case "$CMD" in
  deps)  install_deps; exit 0 ;;
  env)   write_env;    exit 0 ;;
  smoke) run_smoke;    exit 0 ;;
  all|"")
    if ! has_deps; then
      echo "[setup] deps missing. Run with network access:"
      echo "[setup]   bash scripts/setup.sh deps"
      exit 3
    fi
    write_env
    if has_key; then
      # Skip smoke on plain re-runs (no new key) — avoids a USDC charge per call.
      if [ -z "$KEY_FROM_ARG" ] && [ -z "$KEY_FROM_ENV" ] && [ "${SMOKE:-0}" != "1" ]; then
        echo "[setup] .env already set. Skipping smoke (set SMOKE=1 to force)."
        exit 0
      fi
      run_smoke
      exit 0
    else
      echo "[setup] PRIVATE_KEY not set. Ask the user for a base58 Solana key,"
      echo "[setup] then re-run:  bash scripts/setup.sh env <KEY>"
      exit 2
    fi
    ;;
  *)
    echo "Usage: bash setup.sh [deps|env <KEY>|smoke|all]" >&2
    exit 1
    ;;
esac
