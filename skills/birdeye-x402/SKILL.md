---
name: birdeye-x402
description: Pay-per-request Birdeye API access via x402 protocol — no API key needed. Agent pays USDC on Solana per call using withPaymentInterceptor. Use when agent has a Solana wallet but no BIRDEYE_API_KEY.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye x402 — Pay-Per-Request

Query Birdeye without an API key. Agent pays USDC on Solana per request via the x402 protocol.

> No `X-API-KEY` required | Base: `https://public-api.birdeye.so/x402` | Currency: **USDC on Solana mainnet** | Facilitator: Coinbase CDP

## When to use this skill

Use x402 **only when `BIRDEYE_API_KEY` is not available** and the agent holds a Solana keypair with USDC.

| Condition | Use |
|---|---|
| `BIRDEYE_API_KEY` is set | Standard API — use other birdeye skills instead |
| No API key, agent has Solana wallet + USDC | **This skill — x402** |
| Need bulk/batch endpoints (POST multi-price, pair overview multiple) | Standard API only — x402 does not support |
| Need wallet endpoints (`/wallet/v2/*`, `/v1/wallet/*`) | Standard API only |
| Need WebSocket streams | Standard API only |

## Routing

| Intent | Reference |
|---|---|
| Which endpoints are available via x402 | `references/operation-map.md` |
| Pick the right endpoint for your intent | `references/endpoint-playbook.md` |
| Copy-paste curl / TypeScript templates | `references/request-templates.md` |
| Gotchas, USDC requirements, error patterns | `references/caveats.md` |

## Setup (one-time)

```bash
npm install @x402/fetch @solana/web3.js
```

```typescript
import { withPaymentInterceptor } from '@x402/fetch';
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY!))
);

// Wrap fetch once — handles 402 → sign USDC → retry automatically
const fetch402 = withPaymentInterceptor(globalThis.fetch, { wallet: keypair });
```

## Path rule

Prepend `/x402` to any supported path. All query params stay identical. Drop `X-API-KEY`.

```
Standard:  GET https://public-api.birdeye.so/defi/price?address=So111...
x402:      GET https://public-api.birdeye.so/x402/defi/price?address=So111...
```

`User-Agent` header is **not required** for x402 — the payment signature authenticates the request.
