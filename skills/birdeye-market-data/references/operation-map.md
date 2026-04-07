# Market Data — Operation Map

## Price Endpoints

### GET /defi/price
Get current price of a single token.

**CU Cost**: 10 | **Docs**: https://docs.birdeye.so/reference/get-defi-price

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token contract address |
| `include_liquidity` | boolean | No | Include liquidity info |

**Key fields**: `data.value` (price USD), `data.updateUnixTime`, `data.liquidity`, `data.priceChange24h`

### GET /defi/multi_price
Get current prices for multiple tokens (max 100).

**CU Cost**: 10 per token | **Docs**: https://docs.birdeye.so/reference/get-defi-multi_price

| Param | Type | Required | Description |
|---|---|---|---|
| `list_address` | string | Yes | Comma-separated token addresses (max 100) |
| `include_liquidity` | boolean | No | Include liquidity info |

**Key fields**: `data[address].value`, `data[address].updateUnixTime`, `data[address].priceChange24h`

### POST /defi/multi_price
Same as GET but accepts addresses in request body for larger payloads.

**Docs**: https://docs.birdeye.so/reference/post-defi-multi_price

**Body**: `{ "list_address": "addr1,addr2,addr3" }`

### GET /defi/price_volume/single
Combined price and volume data for a single token.

**CU Cost**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-price_volume-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

### POST /defi/price_volume/multi
Combined price and volume for multiple tokens.

**CU Cost**: 15 per token | **Docs**: https://docs.birdeye.so/reference/post-defi-price_volume-multi

**Body**: `{ "list_address": "addr1,addr2" }`

---

## OHLCV Endpoints

### GET /defi/v3/ohlcv (Recommended)
V3 OHLCV candles for a token. Preferred over legacy endpoint.

**CU Cost**: Dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-ohlcv

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `type` | string | Yes | Interval: `1m`,`3m`,`5m`,`15m`,`30m`,`1H`,`2H`,`4H`,`6H`,`8H`,`12H`,`1D`,`3D`,`1W`,`1M` |
| `time_from` | number | Yes | Start Unix timestamp |
| `time_to` | number | Yes | End Unix timestamp |

**Key fields**: `data.items[]` → `{ o, h, l, c, v, unixTime, type, address }`

### GET /defi/v3/ohlcv-pair
V3 OHLCV for a specific trading pair.

**CU Cost**: Dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-ohlcv-pair

Same params as v3-ohlcv but `address` is the pair address.

### GET /defi/ohlcv (Legacy)
Legacy OHLCV endpoint. Max 1000 records.

**CU Cost**: 40 | **Docs**: https://docs.birdeye.so/reference/get-defi-ohlcv

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `type` | string | Yes | Interval |
| `time_from` | number | Yes | Start Unix timestamp |
| `time_to` | number | Yes | End Unix timestamp |

### GET /defi/ohlcv/pair (Legacy)
Legacy pair OHLCV. Max 1000 records.

**CU Cost**: 40 | **Docs**: https://docs.birdeye.so/reference/get-defi-ohlcv-pair

Same params as legacy ohlcv but `address` is pair address.

### GET /defi/ohlcv/base_quote
OHLCV for a base/quote pair by individual token addresses.

**CU Cost**: 40 | **Docs**: https://docs.birdeye.so/reference/get-defi-ohlcv-base_quote

| Param | Type | Required | Description |
|---|---|---|---|
| `base_address` | string | Yes | Base token address |
| `quote_address` | string | Yes | Quote token address |
| `type` | string | Yes | Interval |
| `time_from` | number | Yes | Start Unix timestamp |
| `time_to` | number | Yes | End Unix timestamp |

---

## Historical Price Endpoints

### GET /defi/history_price
Historical price data at intervals.

**CU Cost**: 60 (expensive) | **Docs**: https://docs.birdeye.so/reference/get-defi-history_price

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `address_type` | string | No | `token` or `pair` |
| `type` | string | Yes | Interval (`1m`, `5m`, `15m`, `30m`, `1H`, `4H`, `1D`, `1W`) |
| `time_from` | number | Yes | Start Unix timestamp |
| `time_to` | number | Yes | End Unix timestamp |

**Key fields**: `data.items[]` → `{ unixTime, value }`

### GET /defi/historical_price_unix
Price at a specific Unix timestamp.

**CU Cost**: 10 (cheap) | **Docs**: https://docs.birdeye.so/reference/get-defi-historical_price_unix

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `unixtime` | number | Yes | Target Unix timestamp |

**Key fields**: `data.value` (price USD), `data.unixTime`

---

## Stats Endpoints

### GET /defi/token_overview
Comprehensive token statistics.

**CU Cost**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-token_overview

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ price, priceChange24h, volume24h, liquidity, marketCap, holder, supply, name, symbol, decimals, logoURI, extensions, ... }` — 30+ fields, see docs for full list.

### GET /defi/v3/token/meta-data/single
Token metadata only.

**CU Cost**: 5 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meta-data-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ name, symbol, decimals, logoURI, extensions }`

### GET /defi/v3/token/meta-data/multiple
Batch token metadata.

**CU Cost**: 5 per token | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meta-data-multiple

| Param | Type | Required | Description |
|---|---|---|---|
| `list_address` | string | Yes | Comma-separated addresses (max 100) |

### GET /defi/v3/token/market-data
Market data for a single token.

**CU Cost**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-market-data

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ marketCap, fullyDilutedValuation, liquidity, totalSupply, circulatingSupply }`

### GET /defi/v3/token/market-data-multiple
Batch market data.

**CU Cost**: 15 per token | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-market-data-multiple

| Param | Type | Required | Description |
|---|---|---|---|
| `list_address` | string | Yes | Comma-separated addresses |

### GET /defi/v3/token/trade-data/single
Trading metrics for a single token.

**CU Cost**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-trade-data-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ buy24h, sell24h, buyVolume24h, sellVolume24h, uniqueBuyer24h, uniqueSeller24h, tradeCount24h }`

### GET /defi/v3/token/trade-data/multiple
Batch trade data.

**CU Cost**: 15 per token | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-trade-data-multiple

| Param | Type | Required | Description |
|---|---|---|---|
| `list_address` | string | Yes | Comma-separated addresses |

### GET /defi/v3/token/exit-liquidity
Exit liquidity analysis.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-exit-liquidity

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

### GET /defi/v3/token/exit-liquidity-multiple
Batch exit liquidity.

**Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-exit-liquidity-multiple

| Param | Type | Required | Description |
|---|---|---|---|
| `list_address` | string | Yes | Comma-separated addresses |

### GET /defi/v3/pair/overview/single
Single trading pair overview.

**CU Cost**: 20 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-pair-overview-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Pair address |

**Key fields**: `data.{ base, quote, price, volume24h, liquidity, feeRate, dex }`

### GET /defi/v3/pair/overview/multiple
Batch pair overviews.

**CU Cost**: 20 per pair | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-pair-overview-multiple

| Param | Type | Required | Description |
|---|---|---|---|
| `list_address` | string | Yes | Comma-separated pair addresses |

### GET /defi/v3/price/stats/single
Price statistical analysis.

**CU Cost**: 20 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-price-stats-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

### POST /defi/v3/price/stats/multiple
Batch price statistics.

**CU Cost**: 20 per token | **Docs**: https://docs.birdeye.so/reference/post-defi-v3-price-stats-multiple

**Body**: `{ "list_address": "addr1,addr2" }`

---

## Alltime & History Endpoints

### GET /defi/v3/all-time/trades/single
Complete historical trading data for a token.

**Docs**: https://docs.birdeye.so/reference/get-defi-v3-all-time-trades-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ allTimeBuyVolume, allTimeSellVolume, allTimeTradeCount, allTimeUniqueBuyers, firstTradeUnixTime, lastTradeUnixTime }`

### POST /defi/v3/all-time/trades/multiple
Batch historical trade data.

**Docs**: https://docs.birdeye.so/reference/post-defi-v3-all-time-trades-multiple

**Body**: `{ "list_address": "addr1,addr2" }`
