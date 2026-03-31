---
name: birdeye-token-discovery
description: Discover tokens via Birdeye API — search by name/symbol, browse token lists, find trending tokens, new listings, meme tokens, and market lists. Covers Token/Market List, Creation & Trending, Meme, and Search & Utils endpoint groups.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Token Discovery — Find & Search Tokens

You are an expert at discovering and searching tokens using Birdeye APIs. This skill covers token lists, search, trending, new listings, and meme token discovery.

## Prerequisites

### API Key
All requests require `X-API-KEY` header. Get one at https://bds.birdeye.so.

### Chain Selection
Set `x-chain` header. Default: `solana`.

### Base URL
```
https://public-api.birdeye.so
```

## Routing

| Intent | Reference |
|---|---|
| Search token by name/symbol/address | `references/operation-map.md` → Search |
| Browse token list with filters | `references/operation-map.md` → Token List |
| Browse market/pair list | `references/operation-map.md` → Market List |
| Find newly listed tokens | `references/operation-map.md` → New Listing |
| Find trending tokens | `references/operation-map.md` → Trending |
| Get token creation info | `references/operation-map.md` → Creation Info |
| Browse meme tokens | `references/operation-map.md` → Meme |
| Check API credit usage | `references/operation-map.md` → Utils |
| Common issues | `references/caveats.md` |

## Response Discovery

Each endpoint in the operation map includes a **Docs** URL. Before writing code that parses API responses:

1. **If birdeye-mcp is connected** → call the endpoint directly via MCP tool, inspect the real response
2. **Otherwise** → WebFetch the Docs URL to get the full response schema from docs.birdeye.so
3. **CRITICAL**: Key fields listed in the operation map are approximate hints only and may contain wrong field names. **NEVER use key field names in code without first verifying them via docs**. Agents that skip verification will generate broken code with non-existent fields.

## Rules

### Search Strategy
- Use `GET /defi/v3-search` for text-based search — supports token name, symbol, and address
- Use `GET /defi/v3-token-list` for filtered browsing with sorting (by volume, liquidity, market cap, etc.)
- Use `GET /defi/v3-token-list-scroll` for paginated browsing of large datasets (500 CU per call — expensive)

### Token Lists
- V3 token list supports sorting by: `volume24h`, `liquidity`, `marketCap`, `price`, `priceChange24h`, `holder`, `trade24h`
- Sort direction: `asc` or `desc`
- Use `offset` and `limit` for pagination (max limit: 50)
- Filter by `min_liquidity`, `min_volume_24h`, `min_market_cap` to reduce noise

### New Listings & Trending
- `GET /defi/v2-tokens-new_listing` — recently added tokens (80 CU)
- `GET /defi-token_trending` — currently trending tokens
- `GET /defi-token_creation_info` — creation details for a specific token (80 CU)

### Meme Tokens
- `GET /defi/v3-token-meme-list` — browse meme tokens with filtering
- `GET /defi/v3-token-meme-detail-single` — detailed meme metrics for a single token (30 CU)

### CU Optimization
- Search (`v3-search`): Low CU — use freely
- Token List V3: 100 CU per call
- Token List V3 Scroll: 500 CU — avoid unless needed for large datasets
- New Listing: 80 CU
- Token Creation Info: 80 CU
- Meme Detail: 30 CU
