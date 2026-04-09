---
name: birdeye-indexer
description: Endpoint lookup service — given any data need or intent keyword, returns the exact Birdeye API endpoint, required params, chain support, and a ready-to-use curl. Source of truth for all path/params across all domain skills.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
  type: indexer
---

# Birdeye Indexer — Endpoint Discovery

You are the source of truth for all Birdeye API endpoints. Domain skills and the router call you to resolve data needs into exact API calls.

> Base URL: `https://public-api.birdeye.so` | Auth: `X-API-KEY` header | Chain: `x-chain` header

## How to use this indexer

**Step 1 — Preflight** (once per session):
Read `references/session-preflight.md` to validate chain, address format, and auth.

**Step 2 — Find the endpoint**:
Read `references/intent-index.md` → maps any user intent to the correct endpoint in one lookup.

**Step 3 — Get params**:
Read `references/canonical-endpoint-dictionary.md` → required/optional params, enums, chain support, curl.

**Step 4 — Handle errors and pagination**:
- `references/error-handling.md` — HTTP codes, retry strategy, common mistakes
- `references/pagination.md` — offset/limit, scroll_id, time-based, cursor patterns

**Step 5 — WebSocket** (realtime only):
Read `references/wss-policy.md` — URL format, headers, subscription messages, reconnect, CU billing.

## Response schema — when and how to verify

> Only needed when writing code that parses API responses. Skip this for simple one-off calls.

| Available | Action |
|---|---|
| Official `birdeye-mcp` connected | Call the endpoint via MCP tool → use real response as schema source |
| Official MCP unavailable | Use local `birdeye-api-docs` MCP → `birdeye_get_endpoint_info` |
| No MCP at all | Read `Response` section in domain skill's `operation-map.md`, or WebFetch the Docs URL |

**MCP timeout/error**: do NOT retry. Fall back immediately to the next option and continue.

## Reference files

| File | Purpose |
|---|---|
| [`references/intent-index.md`](references/intent-index.md) | Intent keyword → endpoint, one lookup |
| [`references/canonical-endpoint-dictionary.md`](references/canonical-endpoint-dictionary.md) | All endpoints: path, method, CU, required/optional params, chain support, curl |
| [`references/session-preflight.md`](references/session-preflight.md) | Supported networks, address format by chain, ui_amount mode, rate limits |
| [`references/error-handling.md`](references/error-handling.md) | HTTP error codes, retry strategy, common param mistakes |
| [`references/pagination.md`](references/pagination.md) | offset/limit, scroll_id, time-based, cursor — with code patterns |
| [`references/wss-policy.md`](references/wss-policy.md) | WebSocket URL, headers, subscription format, reconnect, CU/byte rates |

## Rules

- All path/params derive from `canonical-endpoint-dictionary.md` — do not invent params
- Always check `session-preflight.md` before making cross-chain calls
- `intent-index.md` is the fast path — use it before reading operation-maps
- `canonical-endpoint-dictionary.md` overrides any per-skill operation-map if they conflict
- Batch endpoints cap at 100 addresses — split into multiple calls if needed
- Wallet APIs (`/wallet/v2/*`, `/v1/wallet/*`) are **Solana-only** with **30 RPM** hard limit
