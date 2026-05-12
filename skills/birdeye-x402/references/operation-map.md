# x402 — Operation Map

Authoritative endpoint list. Machine-readable version at `scripts/endpoints.json`.

- Base URL: `https://public-api.birdeye.so`
- All paths prefixed with `/x402`
- Headers: `x-chain: solana`, `accept: application/json` — no `X-API-KEY`
- `PAYMENT-SIGNATURE` is added by `scripts/x402-client.mjs`

---

## Price & OHLCV

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/price` | `address` |
| GET | `/x402/defi/history_price` | `address`, `address_type`, `type`, `time_from`, `time_to` |
| GET | `/x402/defi/historical_price_unix` | `address` (also `unixtime`) |
| GET | `/x402/defi/ohlcv` | `address`, `type`, `time_from`, `time_to` |
| GET | `/x402/defi/ohlcv/pair` | `address`, `type`, `time_from`, `time_to` |
| GET | `/x402/defi/ohlcv/base_quote` | `base_address`, `quote_address`, `type`, `time_from`, `time_to` |
| GET | `/x402/defi/v3/ohlcv` | `address`, `type`, `time_from`, `time_to` |
| GET | `/x402/defi/v3/ohlcv/pair` | `address`, `type`, `time_from`, `time_to` |
| GET | `/x402/defi/v3/price/stats/single` | `address` |
| GET | `/x402/defi/price_volume/single` | `address`, `type` |

## Token Data

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/token_overview` | `address` |
| GET | `/x402/defi/token_security` | `address` |
| GET | `/x402/defi/token_creation_info` | `address` |
| GET | `/x402/defi/v3/token/meta-data/single` | `address` |
| GET | `/x402/defi/v3/token/market-data` | `address` |
| GET | `/x402/defi/v3/token/trade-data/single` | `address` |
| GET | `/x402/defi/v3/token/exit-liquidity` | `address` |
| GET | `/x402/defi/tokenlist` | — |
| GET | `/x402/defi/v3/token/list` | — (`sort_by`: `liquidity`·`fdv`·`market_cap`·`holder`) |

## Market Discovery

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/token_trending` | — |
| GET | `/x402/defi/v2/tokens/new_listing` | — |
| GET | `/x402/defi/v3/token/meme/list` | — (do NOT pass `sort_by`) |
| GET | `/x402/defi/v3/token/meme/detail/single` | `address` |
| GET | `/x402/defi/v3/search` | — |

## Pair & Markets

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/v2/markets` | `address`, `time_frame` |
| GET | `/x402/defi/v3/pair/overview/single` | `address` |

## Transactions

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/txs/token` | `address` |
| GET | `/x402/defi/txs/pair` | `address` |
| GET | `/x402/defi/txs/token/seek_by_time` | `address` |
| GET | `/x402/defi/txs/pair/seek_by_time` | `address` |
| GET | `/x402/defi/v3/token/txs` | `address` |
| GET | `/x402/defi/v3/token/txs-by-volume` | `token_address`, `volume_type` |
| GET | `/x402/defi/v3/token/mint-burn-txs` | `address`, `type` |
| GET | `/x402/defi/v3/txs` | — |
| GET | `/x402/defi/v3/txs/recent` | — |
| GET | `/x402/defi/v3/txs/latest-block` | — |
| GET | `/x402/defi/v3/all-time/trades/single` | `time_frame`, `address` |

## Trader Intelligence

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/v2/tokens/top_traders` | `address`, `time_frame` |
| GET | `/x402/trader/gainers-losers` | `type` (`today`·`yesterday`·`1W`) |
| GET | `/x402/trader/txs/seek_by_time` | `address` |

## Holder Data (Solana only)

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/defi/v3/token/holder` | `address` |
| GET | `/x402/holder/v1/distribution` | `token_address` (NOT `address`) |
| POST | `/x402/token/v1/holder/batch` | body |

## Token Transfer (POST)

| Method | Path | Required params |
|---|---|---|
| POST | `/x402/token/v1/transfer` | body |
| POST | `/x402/token/v1/transfer/total` | body |

## Smart Money (Solana only)

| Method | Path | Required params |
|---|---|---|
| GET | `/x402/smart-money/v1/token/list` | — |
