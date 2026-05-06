---
name: birdeye-x402
description: Pay-per-request Birdeye API via x402 (USDC on Solana, no API key). Ships an end-to-end signer + payment flow as runnable scripts so the agent never wires up keypairs itself.
metadata:
  author: Birdeye Partners
  version: "2.1.0"
---

# Birdeye x402

Use **only when** `BIRDEYE_API_KEY` is missing. Wallet endpoints + WebSocket are not supported via x402 — fall back to standard API.

Base: `https://public-api.birdeye.so` · Path prefix: `/x402` · Pay: USDC on Solana mainnet.

**Requires Node.js ≥ 20**. `@solana/kit` upstream recommends ≥ 20.18 (engines field), but Node 20.0–20.17 works in practice — `setup.sh` warns but proceeds. Hard-fails on Node < 20 because Web Crypto Ed25519 isn't available.

## Setup — ask user once, then automate

Run setup from this skill's directory (`<skill-dir>`). The installer rewrites `<skill-dir>` to the absolute path for your platform.

Setup is split into **3 steps** so the agent can request the right sandbox permission for each — `deps` and `smoke` need network; `env` does not.

```bash
cd <skill-dir>
bash scripts/setup.sh           # try all → returns one of:
# 0 = ready
# 3 = deps missing → run `bash scripts/setup.sh deps` (NEEDS NETWORK to npm registry)
# 2 = need PRIVATE_KEY → ask user ONE question, then `bash scripts/setup.sh env <KEY>`
# 1 = real failure → show stderr
```

Step-by-step (use these when sandbox restricts network):

```bash
bash scripts/setup.sh deps             # npm install — approve network to registry.npmjs.org
bash scripts/setup.sh env <base58>     # write .env (no network)
bash scripts/setup.sh smoke            # 1 paid Birdeye call — approve network to public-api.birdeye.so
```

`npm install` runs with `--prefer-offline --no-audit --no-fund --progress=false` so it fails fast on blocked network instead of hanging.

When exit 2, ask the user **one** question (no multi-choice menus):

> "Paste a base58 Solana private key (Phantom/Solflare export) holding USDC on Solana mainnet. I'll wire it up."

Then re-run with the key inline (never echo it back). Stay in the skill directory:

```bash
PRIVATE_KEY='<paste>' bash scripts/setup.sh
```

`.env` persists (mode 600). Don't ask again on later sessions. Re-runs of `setup.sh` skip the paid smoke test unless `SMOKE=1` is set or a new key is passed — no surprise charges. The client auto-loads `.env`, so agents can `import` it from any cwd.

## Use the client

Headless (default — no human in the loop):

```js
import { createPaidFetch, x402Get, x402Post } from './scripts/x402-client.mjs';
const { paidFetch } = await createPaidFetch();
const data = await x402Get(paidFetch, '/defi/price', { address: 'So11111111111111111111111111111111111111112' });
```

Interactive verify (user confirms each payment in terminal): `npm run cli`

## Routing — load references ONLY when needed

| Need | File | When to read |
|---|---|---|
| Pick endpoint for an intent | `references/endpoint-playbook.md` | User asks something not in the example above |
| Copy-paste templates | `references/request-templates.md` | Need a non-trivial endpoint shape |
| Full path/param list | `references/operation-map.md` | Verifying a specific path or param |
| Errors / Birdeye quirks | `references/caveats.md` | Smoke test fails, or 4xx response |

**Do NOT read** `scripts/x402-client.mjs`, `scripts/x402-cli.mjs`, or `scripts/endpoints.json` unless modifying the client. They are runtime code — import/exec, don't paste into context.
