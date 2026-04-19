# x402 — Endpoint Playbook

Use this guide to pick the right endpoint. All paths prefixed with `/x402`.

## Price & Charts

| Intent | Endpoint | Notes |
|---|---|---|
| Current price of one token | `GET /x402/defi/price` | Fastest, cheapest |
| Current price of multiple tokens | `GET /x402/defi/multi_price?list_address=a,b,c` | GET only — POST bulk not supported |
| OHLCV candles | `GET /x402/defi/v3/ohlcv` | `time_from` + `time_to` required |
| Price history series | `GET /x402/defi/history_price` | `address_type`, `type`, `time_from`, `time_to` required |
| Price at one specific timestamp | `GET /x402/defi/historical_price_unix` | Param: `unixtime` (not `time_from`) |
| % change / 24h high-low | `GET /x402/defi/v3/price/stats/single` | — |

## Token Research

| Intent | Endpoint | Notes |
|---|---|---|
| Full fundamentals (MC, vol, holders, priceChange) | `GET /x402/defi/token_overview` | Best single-call overview |
| Metadata (name, symbol, logo) | `GET /x402/defi/v3/token/meta-data/single` | — |
| Market data (price, MC, FDV) | `GET /x402/defi/v3/token/market-data` | — |
| Rug / honeypot check | `GET /x402/defi/token_security` | Check `mintable`, `creatorPercentage`, `top10HolderPercent` |
| Browse token leaderboard | `GET /x402/defi/v3/token/list` | `sort_by`: `liquidity`·`fdv`·`market_cap`·`holder` only |

## Market Discovery

| Intent | Endpoint | Notes |
|---|---|---|
| Trending tokens | `GET /x402/defi/token_trending` | `sort_by=rank` recommended |
| New listings | `GET /x402/defi/v2/tokens/new_listing` | — |
| Meme tokens | `GET /x402/defi/v3/token/meme/list` | Do NOT pass `sort_by` — causes 400 |
| Search by keyword / address | `GET /x402/defi/v3/search` | `sort_by` + `sort_type` required |

## Pair & Liquidity

| Intent | Endpoint | Notes |
|---|---|---|
| All pools for a token | `GET /x402/defi/v2/markets` | `time_frame`, `sort_by`, `sort_type` all required |
| Stats for a specific pair | `GET /x402/defi/v3/pair/overview/single` | Pass pair address, not token address |

## Trades & Traders

| Intent | Endpoint | Notes |
|---|---|---|
| Recent trades for a token | `GET /x402/defi/v3/token/txs` | `tx_type`: `swap`·`buy`·`sell`·`all` |
| Top traders for a token | `GET /x402/defi/v2/tokens/top_traders` | All 4 params required |
| Top PnL gainers today / this week | `GET /x402/trader/gainers-losers` | `type`: `today`·`yesterday`·`1W`; `sort_by=PnL` |

## Holder Analysis (Solana only)

| Intent | Endpoint | Notes |
|---|---|---|
| Holder list | `GET /x402/defi/v3/token/holder` | — |
| Holder concentration | `GET /x402/holder/v1/distribution` | Param: `token_address` (not `address`) |

## Selection heuristics

- **"What's the price?"** → `/x402/defi/price` (single) or `/x402/defi/multi_price` (batch GET)
- **"Full token research"** → `/x402/defi/token_overview` first, then `/x402/defi/token_security` for risk
- **"Is this token safe?"** → `/x402/defi/token_security` — check `mintable`, `creatorPercentage > 0.2`, `top10HolderPercent > 0.5`
- **"What's trending?"** → `/x402/defi/token_trending?sort_by=rank&sort_type=asc`
- **"Who's buying this token?"** → `/x402/defi/v2/tokens/top_traders`
- **"Who made the most profit?"** → `/x402/trader/gainers-losers?type=today`
- **"I need wallet data"** → x402 does NOT support wallet endpoints — use standard API key

## Not available via x402 — fall back to standard API

- All `/wallet/v2/*` and `/v1/wallet/*` endpoints
- POST bulk endpoints (`/defi/v3/token/meta-data/multiple`, `/defi/v3/pair/overview/multiple`, etc.)
- WebSocket streams
- Non-Solana chains for holder/smart-money endpoints
