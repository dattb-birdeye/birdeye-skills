# Market Data — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.

---

## Price

### GET /defi/price
Current price of a single token.

**CU**: 10 | **Docs**: https://docs.birdeye.so/reference/get-defi-price

```bash
curl -sS "https://public-api.birdeye.so/defi/price?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ value, updateUnixTime, liquidity, priceChange24h }`

---

### GET /defi/multi_price
Current prices for multiple tokens (max 100). Cheaper than looping single-price calls.

**CU**: 10/token | **Docs**: https://docs.birdeye.so/reference/get-defi-multi_price

```bash
curl -sS "https://public-api.birdeye.so/defi/multi_price?list_address=<ADDR1>,<ADDR2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data[address].{ value, updateUnixTime, priceChange24h }`

---

### POST /defi/multi_price
Same as GET multi_price but accepts body — use when address list is too long for query string.

**CU**: 10/token | **Docs**: https://docs.birdeye.so/reference/post-defi-multi_price

```bash
curl -sS -X POST "https://public-api.birdeye.so/defi/multi_price" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"list_address": "<ADDR1>,<ADDR2>"}'
```

**Response**: same as GET multi_price

---

### GET /defi/price_volume/single
Combined price and volume in one call. `type` param sets the time window.

**CU**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-price_volume-single

```bash
curl -sS "https://public-api.birdeye.so/defi/price_volume/single?address=<TOKEN>&type=24h" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ price, volume, updateUnixTime }`

---

### POST /defi/price_volume/multi
Batch price + volume for multiple tokens.

**CU**: 15/token | **Docs**: https://docs.birdeye.so/reference/post-defi-price_volume-multi

```bash
curl -sS -X POST "https://public-api.birdeye.so/defi/price_volume/multi" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"list_address": "<ADDR1>,<ADDR2>"}'
```

---

## OHLCV

### GET /defi/v3/ohlcv
Candle data for a token (all pools aggregated). Preferred over legacy endpoint.

**CU**: dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-ohlcv

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/ohlcv?address=<TOKEN>&type=1H&time_from=<TS>&time_to=<TS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { o, h, l, c, v, unixTime, type, address }`

---

### GET /defi/v3/ohlcv/pair
Candle data for a specific DEX pool. Same params as v3/ohlcv but `address` is the pair address.

**CU**: dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-ohlcv-pair

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/ohlcv/pair?address=<PAIR>&type=1H&time_from=<TS>&time_to=<TS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: same shape as v3/ohlcv

---

### GET /defi/ohlcv/base_quote
Candle data by specifying base and quote token addresses separately.

**CU**: 40 | **Docs**: https://docs.birdeye.so/reference/get-defi-ohlcv-base_quote

```bash
curl -sS "https://public-api.birdeye.so/defi/ohlcv/base_quote?base_address=<BASE>&quote_address=<QUOTE>&type=1H&time_from=<TS>&time_to=<TS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { o, h, l, c, v, unixTime }`

---

## Historical Price

### GET /defi/history_price
Price history at intervals over a time range. Expensive — use `historical_price_unix` for single point.

**CU**: 60 | **Docs**: https://docs.birdeye.so/reference/get-defi-history_price

```bash
curl -sS "https://public-api.birdeye.so/defi/history_price?address=<TOKEN>&address_type=token&type=1H&time_from=<TS>&time_to=<TS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { unixTime, value }`

---

### GET /defi/historical_price_unix
Price at a single specific timestamp. Cheap alternative to history_price for point-in-time lookup.

**CU**: 10 | **Docs**: https://docs.birdeye.so/reference/get-defi-historical_price_unix

```bash
curl -sS "https://public-api.birdeye.so/defi/historical_price_unix?address=<TOKEN>&unixtime=<TS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ value, unixTime }`

---

## Stats & Metadata

### GET /defi/token_overview
All-in-one token stats: price, volume, liquidity, market cap, supply, holders, 24h changes.

**CU**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-token_overview

```bash
curl -sS "https://public-api.birdeye.so/defi/token_overview?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ price, priceChange24h, volume24h, liquidity, marketCap, holder, supply, name, symbol, decimals, logoURI, ... }` (30+ fields — verify via docs before parsing)

---

### GET /defi/v3/token/meta-data/single
Token name, symbol, decimals, logo only. 5 CU vs 30 for token_overview.

**CU**: 5 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meta-data-single

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/meta-data/single?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ name, symbol, decimals, logoURI, extensions }`

---

### GET /defi/v3/token/meta-data/multiple
Batch metadata for up to 100 tokens.

**CU**: 5/token | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meta-data-multiple

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/meta-data/multiple?list_address=<ADDR1>,<ADDR2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data[address].{ name, symbol, decimals, logoURI }`

---

### GET /defi/v3/token/market-data
Market cap, FDV, liquidity, supply for one token.

**CU**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-market-data

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/market-data?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ marketCap, fullyDilutedValuation, liquidity, totalSupply, circulatingSupply }`

---

### GET /defi/v3/token/market-data/multiple
Batch market data for up to 100 tokens.

**CU**: 15/token | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-market-data-multiple

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/market-data/multiple?list_address=<ADDR1>,<ADDR2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /defi/v3/token/trade-data/single
Buy/sell counts, volumes, unique traders.

**CU**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-trade-data-single

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/trade-data/single?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ buy24h, sell24h, buyVolume24h, sellVolume24h, uniqueBuyer24h, uniqueSeller24h, tradeCount24h }`

---

### GET /defi/v3/token/trade-data/multiple
Batch trade metrics for up to 100 tokens.

**CU**: 15/token | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-trade-data-multiple

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/trade-data/multiple?list_address=<ADDR1>,<ADDR2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /defi/v3/token/exit-liquidity
Exit liquidity analysis for a token. Base chain only.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-exit-liquidity

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/exit-liquidity?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: base" -H "accept: application/json"
```

---

### GET /defi/v3/pair/overview/single
Full trading pair overview: base/quote tokens, price, volume, liquidity, fee rate, DEX.

**CU**: 20 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-pair-overview-single

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/pair/overview/single?address=<PAIR>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ base, quote, price, volume24h, liquidity, feeRate, dex }`

---

### GET /defi/v3/pair/overview/multiple
Batch pair overviews.

**CU**: 20/pair | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-pair-overview-multiple

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/pair/overview/multiple?list_address=<PAIR1>,<PAIR2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /defi/v3/price/stats/single
Price change statistics across multiple time windows.

**CU**: 20 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-price-stats-single

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/price/stats/single?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### POST /defi/v3/price/stats/multiple
Batch price statistics.

**CU**: 20/token | **Docs**: https://docs.birdeye.so/reference/post-defi-v3-price-stats-multiple

```bash
curl -sS -X POST "https://public-api.birdeye.so/defi/v3/price/stats/multiple" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"list_address": "<ADDR1>,<ADDR2>"}'
```

---

## Alltime & History

### GET /defi/v3/all-time/trades/single
Aggregate trading summary over a time window.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-all-time-trades-single

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/all-time/trades/single?address=<TOKEN>&time_frame=24h" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ allTimeBuyVolume, allTimeSellVolume, allTimeTradeCount, allTimeUniqueBuyers, firstTradeUnixTime, lastTradeUnixTime }`

---

### POST /defi/v3/all-time/trades/multiple
Batch alltime trade data.

**Docs**: https://docs.birdeye.so/reference/post-defi-v3-all-time-trades-multiple

```bash
curl -sS -X POST "https://public-api.birdeye.so/defi/v3/all-time/trades/multiple" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"list_address": "<ADDR1>,<ADDR2>"}'
```
