# Market Data — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Price snapshots

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Current price of one token | `GET /defi/price` | 10 | Cheapest single-price call |
| Current prices for up to 100 tokens | `GET /defi/multi_price` | 10/token | Batch via `list_address` (comma-separated) |
| Price + volume in one call | `GET /defi/price_volume/single` | 15 | Avoids two calls |
| Price + volume for many tokens | `POST /defi/price_volume/multi` | 15/token | Body: `{ "list_address": "a,b" }` |
| Price at a specific past timestamp | `GET /defi/historical_price_unix` | 10 | Cheapest historical option; returns nearest match |

## Charts (OHLCV)

| Intent | Endpoint | Notes |
|---|---|---|
| Candles for a token (across all pools) | `GET /defi/v3/ohlcv` | Preferred. Dynamic CU based on range |
| Candles for a specific DEX pool | `GET /defi/v3/ohlcv/pair` | Use pair address, not token address |
| Candles by base/quote pair | `GET /defi/ohlcv/base_quote` | Legacy — 40 CU flat, max 1000 records |

## Token stats and metadata

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Everything about a token (price, volume, liquidity, supply, holders) | `GET /defi/token_overview` | 30 | All-in-one; cheaper than calling V3 endpoints separately for all fields |
| Name, symbol, decimals, logo only | `GET /defi/v3/token/meta-data/single` | 5 | Cheapest metadata fetch |
| Market cap, FDV, liquidity, supply | `GET /defi/v3/token/market-data` | 15 | Skip if already using `token_overview` |
| Buy/sell counts, unique traders | `GET /defi/v3/token/trade-data/single` | 15 | Activity metrics |
| Exit liquidity analysis | `GET /defi/v3/token/exit-liquidity` | Variable | How much liquidity is actually available to exit |
| Price statistics (change across windows) | `GET /defi/v3/price/stats/single` | 20 | Multi-window price change stats |
| All-time trade history summary | `GET /defi/v3/all-time/trades/single` | — | Lifetime volume, first/last trade time |
| Pair overview (single DEX pool) | `GET /defi/v3/pair/overview/single` | 20 | Base/quote, DEX, price, volume, liquidity |

## Batch operations

| Intent | Endpoint | CU |
|---|---|---|
| Metadata for N tokens | `GET /defi/v3/token/meta-data/multiple` | 5/token |
| Market data for N tokens | `GET /defi/v3/token/market-data/multiple` | 15/token |
| Trade data for N tokens | `GET /defi/v3/token/trade-data/multiple` | 15/token |
| Exit liquidity for N tokens | `GET /defi/v3/token/exit-liquidity/multiple` | Variable |
| Price stats for N tokens | `POST /defi/v3/price/stats/multiple` | 20/token |
| All-time trades for N tokens | `POST /defi/v3/all-time/trades/multiple` | — |
| Pair overview for N pairs | `GET /defi/v3/pair/overview/multiple` | 20/pair |

## Historical price range

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Price series over a time range | `GET /defi/history_price` | 60 | Expensive — use only when OHLCV isn't enough |

## Selection heuristics

- **Single token current price** → `/defi/price` (10 CU, not `token_overview`)
- **N tokens current price** → `/defi/multi_price` (max 100; batch into multiple calls if needed)
- **Need price + volume + liquidity + supply in one shot** → `/defi/token_overview` (30 CU total, cheaper than 3 V3 calls = 35 CU)
- **Only need name/symbol** → `/defi/v3/token/meta-data/single` (5 CU, not `token_overview`)
- **Building a candle chart** → `/defi/v3/ohlcv` for tokens, `/defi/v3/ohlcv/pair` for pool-specific
- **Price at a moment in the past** → `/defi/historical_price_unix` (10 CU), not `/defi/history_price` (60 CU)
- **Batching N tokens** → Use `*-multiple` endpoints; all cap at 100 addresses per call
