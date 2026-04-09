# Canonical Endpoint Dictionary

**Ground truth for all Birdeye REST endpoints.**  
All operation maps and skill templates derive path, params, and chain support from this file.

Base URL: `https://public-api.birdeye.so`  
Auth: `X-API-KEY: <key>` (all endpoints) + `x-chain: <chain>` (chain-specific)  
Format: `accept: application/json`

> ✓ = required | - = optional | [all] = multi-chain | [SOL] = Solana only

---

## Price & OHLCV

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/price` | 10 | `address` | `include_liquidity` | [all] |
| GET | `/defi/multi_price` | 10/token | `list_address` | `include_liquidity`, `check_liquidity` | [all] |
| POST | `/defi/multi_price` | 10/token | body: `list_address` | `include_liquidity` | [all] |
| GET | `/defi/price_volume/single` | 15 | `address`, `type`¹ | `ui_amount_mode` | [all] |
| POST | `/defi/price_volume/multi` | 15/token | body: `list_address` | — | [all] |
| GET | `/defi/historical_price_unix` | 10 | `address`, `unixtime` | — | [all] |
| GET | `/defi/history_price` | 60 | `address`, `address_type`², `type`, `time_from`, `time_to` | `ui_amount_mode` | [all] |
| GET | `/defi/v3/ohlcv` | dynamic | `address`, `type`, `time_from`, `time_to` | `currency`, `mode`, `count_limit`, `outlier` | [all] |
| GET | `/defi/v3/ohlcv/pair` | dynamic | `address`, `type`, `time_from`, `time_to` | `currency`, `mode`, `count_limit`, `outlier` | [all] |
| GET | `/defi/ohlcv` | 40 | `address`, `type`, `time_from`, `time_to` | — | [all] |
| GET | `/defi/ohlcv/pair` | 40 | `address`, `type`, `time_from`, `time_to` | — | [all] |
| GET | `/defi/ohlcv/base_quote` | 40 | `base_address`, `quote_address`, `type`, `time_from`, `time_to` | — | [all] |

**¹** `type` enum for `price_volume/single`: `1h`, `2h`, `4h`, `8h`, `24h`  
**²** `address_type` enum: `token`, `pair`  
**OHLCV `type`** (v3): `1m`,`3m`,`5m`,`15m`,`30m`,`1H`,`2H`,`4H`,`6H`,`8H`,`12H`,`1D`,`3D`,`1W`,`1M` — case-sensitive

```bash
# Single price
curl -sS "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# Batch prices
curl -sS "https://public-api.birdeye.so/defi/multi_price?list_address=ADDR1,ADDR2" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# OHLCV (last 24h, 1H candles)
NOW=$(date +%s); FROM=$((NOW-86400))
curl -sS "https://public-api.birdeye.so/defi/v3/ohlcv?address=ADDR&type=1H&time_from=$FROM&time_to=$NOW" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Stats

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/token_overview` | 30 | `address` | — | [all] |
| GET | `/defi/v3/token/meta-data/single` | 5 | `address` | — | [all] |
| GET | `/defi/v3/token/meta-data/multiple` | 5/token | `list_address` | — | [all] |
| GET | `/defi/v3/token/market-data` | 15 | `address` | — | [all] |
| GET | `/defi/v3/token/market-data/multiple` | 15/token | `list_address` | — | [all] |
| GET | `/defi/v3/token/trade-data/single` | 15 | `address` | — | [all] |
| GET | `/defi/v3/token/trade-data/multiple` | 15/token | `list_address` | — | [all] |
| GET | `/defi/v3/token/exit-liquidity` | var | `address` | — | **[base]** |
| GET | `/defi/v3/token/exit-liquidity/multiple` | var | `list_address` | — | **[base]** |
| GET | `/defi/v3/pair/overview/single` | 20 | `address` | — | **[SOL]** |
| GET | `/defi/v3/pair/overview/multiple` | 20/pair | `list_address` | — | **[SOL]** |
| GET | `/defi/v3/price/stats/single` | 20 | `address` | — | [all] |
| POST | `/defi/v3/price/stats/multiple` | 20/token | body: `list_address` | — | [all] |

```bash
# Full token stats (all-in-one)
curl -sS "https://public-api.birdeye.so/defi/token_overview?address=ADDR" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# Metadata only (cheapest)
curl -sS "https://public-api.birdeye.so/defi/v3/token/meta-data/single?address=ADDR" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Alltime & History

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/all-time/trades/single` | var | `address`, `time_frame`³ | `ui_amount_mode` | [all] |
| POST | `/defi/v3/all-time/trades/multiple` | var | body: `list_address`, `time_frame`³ | — | [all] |

**³** `time_frame` enum: `1m`,`5m`,`30m`,`1h`,`2h`,`4h`,`8h`,`24h`,`3d`,`7d`,`14d`,`30d`,`90d`,`180d`,`1y`,`alltime`

---

## Token / Market List

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/token/list` | 100 | `sort_by`, `sort_type` | `offset`, `limit`, `min_liquidity`, `min_volume_24h`, `min_market_cap`, `min_holder`, `min_trade_24h` | SOL,base,bsc,eth... |
| GET | `/defi/v3/token/list/scroll` | 500 | `sort_by`, `sort_type` | `scroll_id`, + list filters | SOL,base,bsc,eth... |
| GET | `/defi/tokenlist` | 30 | `sort_by`, `sort_type` | `offset`, `limit` | [all] |
| GET | `/defi/v2/markets` | var | `address`, `time_frame`⁴, `sort_type`, `sort_by`⁵ | `offset`, `limit` | [all] |
| GET | `/defi/v2/tokens/new_listing` | 80 | — | `time_to`, `limit`, `meme_platform_enabled` | [all] |

**⁴** `time_frame` enum: `30m`,`1h`,`2h`,`4h`,`6h`,`8h`,`12h`,`24h`  
**⁵** `sort_by` enum for markets: `liquidity`, `volume24h`

```bash
# Token list top by volume
curl -sS "https://public-api.birdeye.so/defi/v3/token/list?sort_by=volume24h&sort_type=desc&limit=50&min_liquidity=10000" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# New listings
curl -sS "https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=50&meme_platform_enabled=true" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Creation & Trending

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/token_trending` | var | `sort_by`⁶, `sort_type` | `interval`⁷, `offset`, `limit`, `ui_amount_mode` | [all] |
| GET | `/defi/token_creation_info` | 80 | `address` | — | **[SOL]** |

**⁶** `sort_by` enum: `rank`, `volumeUSD`, `liquidity`  
**⁷** `interval` enum: `1h`, `4h`, `24h`

```bash
# Trending tokens
curl -sS "https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&interval=24h&limit=20" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Meme

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/token/meme/list` | var | `sort_by`, `sort_type` | `offset`, `limit` | SOL, bsc, monad |
| GET | `/defi/v3/token/meme/detail/single` | 30 | `address` | — | SOL, bsc, monad |

---

## Search & Utils

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/search` | low | `sort_by`⁸, `sort_type` | `keyword`, `target`⁹, `search_mode`¹⁰, `search_by`¹¹, `chain`, `verify_token`, `markets`, `offset`, `limit`, `ui_amount_mode` | **[SOL]** |
| GET | `/utils/v1/credits` | — | — | — | — |

**⁸** `sort_by` enum: `fdv`,`marketcap`,`liquidity`,`price`,`price_change_24h_percent`,`trade_24h`,`volume_24h_usd` (and more)  
**⁹** `target` enum: `all`, `token`, `market`  
**¹⁰** `search_mode` enum: `exact`, `fuzzy`  
**¹¹** `search_by` enum: `combination`, `address`, `name`, `symbol`

```bash
# Search by keyword
curl -sS "https://public-api.birdeye.so/defi/v3/search?keyword=bonk&target=token&sort_by=liquidity&sort_type=desc&limit=5" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Security

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/token_security` | 50 | `address` | — | [all] |

```bash
curl -sS "https://public-api.birdeye.so/defi/token_security?address=ADDR" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Holder

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/token/holder` | var | `address` | `offset`, `limit` | **[SOL]** |
| GET | `/holder/v1/distribution` | var | `token_address` | `address_type`¹², `mode`¹³, `top_n`, `min_percent`, `max_percent`, `include_list`, `offset`, `limit` | **[SOL]** |
| POST | `/token/v1/holder/batch` | var/token | body: `list_address` | — | **[SOL]** |

**¹²** `address_type` enum: `wallet`, `token_account`  
**¹³** `mode` enum: `percent`, `top`

```bash
# Top 20 holders
curl -sS "https://public-api.birdeye.so/defi/v3/token/holder?address=ADDR&limit=20" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# Distribution
curl -sS "https://public-api.birdeye.so/holder/v1/distribution?token_address=ADDR&mode=percent" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Smart Money

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/smart-money/v1/token/list` | var | — | `interval`¹⁴, `trader_style`¹⁵, `sort_by`¹⁶, `sort_type`, `offset`, `limit` | **[SOL]** |

**¹⁴** `interval` enum: `1d`, `7d`, `30d`  
**¹⁵** `trader_style` enum: `all`, `risk_averse`, `risk_balancers`, `trenchers`  
**¹⁶** `sort_by` enum: `net_flow`, `smart_traders_no`, `market_cap`

```bash
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?sort_by=net_flow&sort_type=desc&interval=1d&limit=20" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Transactions

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/token/txs` | 20 | `address` | `tx_type`¹⁷, `sort_by`¹⁸, `sort_type`, `source`¹⁹, `owner`, `pool_id`, `before_time`, `after_time`, `before_block_number`, `after_block_number`, `offset`, `limit`, `ui_amount_mode` | [all] |
| GET | `/defi/v3/token/txs-by-volume` | dynamic | `token_address`, `volume_type`²⁰, `sort_type` | `min_volume`, `max_volume`, `sort_by`, `tx_type`, `source`, `owner`, `before_time`, `after_time`, `offset`, `limit`, `ui_amount_mode` | **[SOL]** |
| GET | `/defi/v3/token/mint-burn-txs` | var | `address`, `sort_by`²¹, `sort_type`, `type`²² | `after_time`, `before_time`, `offset`, `limit` | **[SOL]** |
| GET | `/defi/txs/token` | 10 | `address`, `sort_type` | `tx_type`, `offset`, `limit` | [all] |
| GET | `/defi/txs/token/seek_by_time` | 15 | `address` | `before_time`, `after_time`, `tx_type`, `sort_type`, `offset`, `limit` | [all] |
| GET | `/defi/txs/pair` | 10 | `address`, `sort_type` | `tx_type`, `offset`, `limit` | [all] |
| GET | `/defi/txs/pair/seek_by_time` | 15 | `address` | `before_time`, `after_time`, `tx_type`, `sort_type`, `offset`, `limit` | [all] |
| GET | `/defi/v3/txs` | 25 | — | `tx_type`, `sort_type`, `offset`, `limit` | [all] |
| GET | `/defi/v3/txs/recent` | dynamic | — | `limit` | [all] |
| GET | `/trader/txs/seek_by_time` | var | `address` | `before_time`, `after_time`, `tx_type`, `offset`, `limit` | [all] |

**¹⁷** `tx_type` enum: `swap`, `buy`, `sell`, `add`, `remove`, `all`  
**¹⁸** `sort_by` enum: `block_unix_time`, `block_number`  
**¹⁹** `source` enum: `raydium`, `raydium_clamm`, `raydium_cp`, `orca`, `lifinity`, `fluxbeam`, `saber`, `phoenix`, `bonkswap`, `pump_dot_fun`, `meteora_dlmm`  
**²⁰** `volume_type` enum: `usd`, `amount`  
**²¹** `sort_by` for mint-burn: `block_time`  
**²²** `type` for mint-burn enum: `all`, `mint`, `burn`

```bash
# Recent buys for a token
curl -sS "https://public-api.birdeye.so/defi/v3/token/txs?address=ADDR&tx_type=buy&limit=20" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# Whale trades (by volume)
curl -sS "https://public-api.birdeye.so/defi/v3/token/txs-by-volume?token_address=ADDR&volume_type=usd&sort_type=desc&min_volume=10000" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Balance & Transfer

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/wallet/v2/balance-change` | 20 | `address` | `token_address`, `time_from`, `time_to`, `type` (`SOL`\|`SPL`), `change_type` (`increase`\|`decrease`), `offset`, `limit`, `ui_amount_mode` | **[SOL]** |
| POST | `/wallet/v2/token-balance` | var | body: `wallet`, `token_list` | — | **[SOL]** |
| POST | `/token/v1/transfer` | var | body: `address` | `offset`, `limit` | **[SOL]** |
| POST | `/token/v1/transfer/total` | var | body: `address` | — | **[SOL]** |
| POST | `/wallet/v2/transfer` | var | body: `wallet` | `offset`, `limit` | **[SOL]** |
| POST | `/wallet/v2/transfer/total` | var | body: `wallet` | — | **[SOL]** |
| GET | `/v1/wallet/token_balance` (β) | var | `wallet`, `token_address` | — | **[SOL]** |

---

## Wallet, Networth & PnL

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/wallet/v2/current-net-worth` | 60 | `wallet`, `sort_type` | `filter_value`, `sort_by`, `limit`, `offset` | **[SOL]** |
| GET | `/wallet/v2/net-worth` | 60 | `wallet`, `sort_type` | `count`, `direction`²³, `time`, `type`²⁴ | **[SOL]** |
| GET | `/wallet/v2/net-worth-details` | var | `wallet`, `sort_type` | `time`, `type`²⁴, `limit`, `offset` | **[SOL]** |
| POST | `/wallet/v2/net-worth-summary/multiple` | var | body: `wallets` | — | **[SOL]** |
| GET | `/wallet/v2/pnl/summary` | var | `wallet` | — | **[SOL]** |
| POST | `/wallet/v2/pnl/details` | var | body: `wallet` | — | **[SOL]** |
| GET | `/wallet/v2/pnl` | var | `wallet`, `token_addresses` | — | **[SOL]** |
| GET | `/wallet/v2/pnl/multiple` | var | `token_address`, `wallets` | — | **[SOL]** |
| POST | `/wallet/v2/tx/first-funded` | var | body: `wallet` | — | **[SOL]** |
| GET | `/defi/v2/tokens/top_traders` | 30 | `address`, `time_frame`²⁵, `sort_type`, `sort_by`²⁶ | `offset`, `limit`, `ui_amount_mode` | [all] |
| GET | `/trader/gainers-losers` | var | `type`²⁷, `sort_by`²⁸, `sort_type` | `offset`, `limit` | [all] |
| GET | `/v1/wallet/tx_list` (β) | 150 | `wallet` | `before_time`, `after_time`, `limit` | **[SOL]** |
| GET | `/v1/wallet/token_list` (β) | 100 | `wallet` | — | **[SOL]** |
| GET | `/v1/wallet/list_supported_chain` | var | — | — | — |

**²³** `direction` enum: `back`, `forward`  
**²⁴** `type` enum: `1h`, `1d`  
**²⁵** `time_frame` enum: `30m`,`1h`,`2h`,`4h`,`6h`,`8h`,`12h`,`24h`  
**²⁶** `sort_by` for top_traders enum: `volume`, `trade`  
**²⁷** `type` for gainers-losers enum: `yesterday`, `today`, `1W`  
**²⁸** `sort_by` for gainers-losers enum: `PnL`

```bash
# Net worth
curl -sS "https://public-api.birdeye.so/wallet/v2/current-net-worth?wallet=WALLET&sort_type=desc" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# PnL summary
curl -sS "https://public-api.birdeye.so/wallet/v2/pnl/summary?wallet=WALLET" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"

# Gainers today
curl -sS "https://public-api.birdeye.so/trader/gainers-losers?type=today&sort_by=PnL&sort_type=desc&limit=20" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Blockchain

| Method | Path | CU | Required | Optional | Chains |
|---|---|---|---|---|---|
| GET | `/defi/v3/txs/latest-block` | 5 | — | — | [all] |
| GET | `/defi/networks` | 1 | — | — | — |

```bash
# Session preflight: get supported chains
curl -sS "https://public-api.birdeye.so/defi/networks" \
  -H "X-API-KEY: $KEY" -H "accept: application/json"
```

---

## WebSocket Channels

| Channel | CU/byte | Solana-only |
|---|---|---|
| `SUBSCRIBE_PRICE` | 0.003 | No |
| `SUBSCRIBE_TXS` | 0.0004 | No |
| `SUBSCRIBE_BASE_QUOTE_PRICE` | 0.003 | No |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | 0.08 | Yes |
| `SUBSCRIBE_NEW_PAIR` | 0.05 | Yes |
| `SUBSCRIBE_LARGE_TRADE_TXS` | 0.006 | No |
| `SUBSCRIBE_WALLET_TXS` | 0.004 | No |
| `SUBSCRIBE_TOKEN_STATS` | 0.005 | No |
| `SUBSCRIBE_MEME` | var | Yes |

WSS URL: `wss://public-api.birdeye.so/socket/{chain}?x-api-key=KEY`  
See `wss-policy.md` for full connection requirements.
