---
name: birdeye-market-data
description: Query token prices, OHLCV candles, historical data, volume, liquidity, market cap, pair overviews, trade data, and price statistics via Birdeye API. Covers Price, OHLCV, Stats, and Alltime/History endpoint groups.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Market Data — Prices, Charts & Stats

You are an expert at querying and composing Birdeye market data APIs. This skill covers all price, OHLCV, statistics, and historical data endpoints.

## Prerequisites

### API Key
All requests require `X-API-KEY` header. If not configured, direct user to https://bds.birdeye.so to generate one.

### Chain Selection
Set `x-chain` header per request. Default: `solana`.

### Base URL
```
https://public-api.birdeye.so
```

## Routing

Read the relevant reference file before implementing:

| Intent | Reference |
|---|---|
| Current token price, multi-token prices | `references/operation-map.md` → Price endpoints |
| OHLCV candles, chart data | `references/operation-map.md` → OHLCV endpoints |
| Token overview, metadata, market data | `references/operation-map.md` → Stats endpoints |
| Historical prices, alltime trades | `references/operation-map.md` → History endpoints |
| Price volume combined data | `references/operation-map.md` → Price Volume endpoints |
| Pair overview, pair stats | `references/operation-map.md` → Pair endpoints |
| Trade data, liquidity analysis | `references/operation-map.md` → Trade/Liquidity endpoints |
| Common issues and edge cases | `references/caveats.md` |

## Response Discovery

Each endpoint in the operation map includes a **Docs** URL. Before writing code that parses API responses:

1. **If birdeye-mcp is connected** → call the endpoint directly via MCP tool, inspect the real response
2. **Otherwise** → WebFetch the Docs URL to get the full response schema from docs.birdeye.so
3. **CRITICAL**: Key fields listed in the operation map are approximate hints only and may contain wrong field names. **NEVER use key field names in code without first verifying them via docs**. Agents that skip verification will generate broken code with non-existent fields.

## Rules

### Endpoint Selection
- Use `GET /defi/price` for single token current price (10 CU)
- Use `GET /defi/multi_price` for up to 100 tokens at once (batch)
- Use V3 OHLCV (`/defi/v3-ohlcv`) over legacy (`/defi/ohlcv`) — better performance and data quality
- Use `GET /defi/token_overview` for comprehensive single-token stats (30 CU)
- Use V3 batch endpoints (`*-multiple`) when querying multiple tokens

### OHLCV Best Practices
- Maximum 1000 records per request
- Available intervals: `1m`, `3m`, `5m`, `15m`, `30m`, `1H`, `2H`, `4H`, `6H`, `8H`, `12H`, `1D`, `3D`, `1W`, `1M`
- Always specify `time_from` and `time_to` as Unix timestamps
- For pair-specific candles, use `/defi/v3-ohlcv-pair` with the pair address
- For base/quote candles, use `/defi/ohlcv/base_quote` with base and quote addresses

### Price Data
- `GET /defi/price` returns real-time price with 24h change
- `GET /defi/history_price` returns historical prices at intervals (60 CU — expensive)
- `GET /defi/historical_price_unix` returns price at a specific Unix timestamp (10 CU — cheap)
- Use `price_volume-single` when you need both price and volume in one call

### Stats & Metadata
- `token_overview` gives comprehensive stats (price, volume, liquidity, market cap, supply, 24h/1h changes)
- V3 endpoints split data into focused responses:
  - `v3-token-meta-data-single` — name, symbol, decimals, logo (5 CU)
  - `v3-token-market-data` — market cap, FDV, liquidity, supply (15 CU)
  - `v3-token-trade-data-single` — buy/sell counts, unique traders (15 CU)
  - `v3-token-exit-liquidity` — exit liquidity analysis (CU varies)
- Use the focused V3 endpoint when you only need specific data — cheaper than `token_overview`

### Compute Unit Awareness
- Price: 10 CU | OHLCV: 40 CU | History Price: 60 CU
- Token Overview: 30 CU | Token Meta: 5 CU | Market Data: 15 CU
- Always prefer cheaper endpoints when full data isn't needed
