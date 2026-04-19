# x402 — Operation Map

All paths below use base `https://public-api.birdeye.so/x402`.
No `X-API-KEY` header. Pass `x-chain` and `accept: application/json` as usual.
Payment is handled automatically by `withPaymentInterceptor`.

---

## Price & OHLCV

### GET /x402/defi/price
Current token price.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/price?address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```
**Response**: `data.{ value, updateUnixTime, updateHumanTime, priceChange24h }`

---

### GET /x402/defi/multi_price
Prices for multiple tokens (GET only — POST bulk not supported via x402).

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/multi_price?list_address=So111...,EPjF..." \
  -H "x-chain: solana" -H "accept: application/json"
```
**Response**: `data.{ <address>: { value, updateUnixTime } }`

---

### GET /x402/defi/v3/ohlcv
OHLCV candles. `time_from` and `time_to` required.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/ohlcv?address=<TOKEN>&type=1H&time_from=<unix>&time_to=<unix>" \
  -H "x-chain: solana" -H "accept: application/json"
```
**Response**: `data.items[] → { o, h, l, c, v, unixTime }`

---

### GET /x402/defi/history_price
Historical price series over a time range. `address_type`, `type`, `time_from`, `time_to` required.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/history_price?address=<TOKEN>&address_type=token&type=1H&time_from=<unix>&time_to=<unix>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/historical_price_unix
Price at a single unix timestamp. Param is `unixtime` (not `time_from`).

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/historical_price_unix?address=<TOKEN>&unixtime=<unix>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v3/price/stats/single
Price stats (% change, high/low).

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/price/stats/single?address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Token Data

### GET /x402/defi/token_overview
Full token fundamentals: price, MC, FDV, liquidity, volume, holders, priceChange*.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/token_overview?address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```
**Response**: `data.{ price, marketCap, fdv, liquidity, volume24h, holder, priceChange24hPercent, ... }`

---

### GET /x402/defi/token_security
Rug/honeypot check: mint authority, creator %, top holder concentration.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/token_security?address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```
**Response**: `data.{ mintable, freezeable, creatorPercentage, top10HolderPercent, isTrueToken }`

---

### GET /x402/defi/v3/token/meta-data/single
Token metadata: name, symbol, decimals, logo, extensions.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/token/meta-data/single?address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v3/token/market-data
Market data: price, MC, FDV.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/token/market-data?address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v3/token/list
Paginated token list. `sort_by` and `sort_type` required. Valid `sort_by`: `liquidity` · `fdv` · `market_cap` · `holder`.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/token/list?sort_by=liquidity&sort_type=desc&offset=0&limit=50" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Market Discovery

### GET /x402/defi/token_trending
Trending tokens. `sort_by` and `sort_type` required. Valid `sort_by`: `rank` · `volumeUSD` · `liquidity`.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/token_trending?sort_by=rank&sort_type=asc&limit=20" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v2/tokens/new_listing
Newly listed tokens.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v2/tokens/new_listing?limit=20" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v3/token/meme/list
Meme token leaderboard. Do NOT pass `sort_by` — causes 400.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/token/meme/list?limit=20" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v3/search
Search tokens or pairs by keyword. `sort_by` and `sort_type` required.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/search?keyword=BONK&chain=solana&target=token&sort_by=liquidity&sort_type=desc" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Pair & Markets

### GET /x402/defi/v2/markets
All liquidity pools for a token. `time_frame`, `sort_by`, `sort_type` all required.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v2/markets?address=<TOKEN>&time_frame=24h&sort_by=liquidity&sort_type=desc" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/defi/v3/pair/overview/single
Stats for a specific pair address.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/pair/overview/single?address=<PAIR>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Trades

### GET /x402/defi/v3/token/txs
Token trade history. `tx_type`: `swap` · `buy` · `sell` · `all`.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/token/txs?address=<TOKEN>&tx_type=swap&limit=50" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Trader Intelligence

### GET /x402/defi/v2/tokens/top_traders
Top traders for a token. `address`, `time_frame`, `sort_by`, `sort_type` all required.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v2/tokens/top_traders?address=<TOKEN>&time_frame=24h&sort_by=volume&sort_type=desc&limit=10" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/trader/gainers-losers
Top on-chain traders by PnL. `type`, `sort_by`, `sort_type` all required. Valid `type`: `today` · `yesterday` · `1W`.

```bash
curl -sS "https://public-api.birdeye.so/x402/trader/gainers-losers?type=today&sort_by=PnL&sort_type=desc&limit=10" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Holder Data (Solana only)

### GET /x402/defi/v3/token/holder
Paginated holder list.

```bash
curl -sS "https://public-api.birdeye.so/x402/defi/v3/token/holder?address=<TOKEN>&limit=100" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /x402/holder/v1/distribution
Holder concentration. Param is `token_address` (not `address`).

```bash
curl -sS "https://public-api.birdeye.so/x402/holder/v1/distribution?token_address=<TOKEN>" \
  -H "x-chain: solana" -H "accept: application/json"
```

---

## Smart Money (Solana only, PRO tier)

### GET /x402/smart-money/v1/token/list
Smart money token signals.

```bash
curl -sS "https://public-api.birdeye.so/x402/smart-money/v1/token/list?interval=1d&sort_by=smart_traders_no&sort_type=desc&limit=20" \
  -H "x-chain: solana" -H "accept: application/json"
```
