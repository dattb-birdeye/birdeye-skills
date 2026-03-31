# Realtime Streams — Stream Map

## Connection

**WebSocket URL** — the chain name is part of the URL path (NOT a header):

```
wss://public-api.birdeye.so/socket/solana?x-api-key=YOUR_API_KEY
```

For other chains, replace `solana` in the URL path:
- Ethereum: `wss://public-api.birdeye.so/socket/ethereum?x-api-key=...`
- BSC: `wss://public-api.birdeye.so/socket/bsc?x-api-key=...`
- Other chains: `arbitrum`, `optimism`, `polygon`, `avalanche`, `base`, `zksync`

**Required Headers**:

| Header | Value |
|---|---|
| `Origin` | `ws://public-api.birdeye.so` |
| `Sec-WebSocket-Origin` | `ws://public-api.birdeye.so` |
| `Sec-WebSocket-Protocol` | `echo-protocol` |

Requires **Business tier or higher**.

> **Important**: Key fields listed below are a quick reference only. Before writing code that handles WebSocket messages, WebFetch the **Docs** URL for each channel to verify the complete event schema.

---

## SUBSCRIBE_PRICE (Token/Pair OHLCV)

Live OHLCV price updates for tokens or pairs.

**CU/byte**: 0.003 | **Docs**: https://docs.birdeye.so/reference/subscribe_price-ohlcv

### Simple Subscription
```json
{
  "type": "SUBSCRIBE_PRICE",
  "data": {
    "queryType": "simple",
    "chartType": "1m",
    "address": "So11111111111111111111111111111111111111112",
    "currency": "usd"
  }
}
```

### Complex Subscription (max 100 addresses)
```json
{
  "type": "SUBSCRIBE_PRICE",
  "data": {
    "queryType": "complex",
    "query": "(address = ADDR1 AND chartType = 1m AND currency = usd) OR (address = ADDR2 AND chartType = 3m AND currency = pair)"
  }
}
```

| Param | Values | Description |
|---|---|---|
| `queryType` | `simple`, `complex` | Simple for single, complex for multi |
| `chartType` | `1s`,`15s`,`30s`,`1m`,`3m`,`5m`,`15m`,`30m`,`1H`,`2H`,`4H`,`6H`,`8H`,`12H`,`1D`,`3D`,`1W`,`1M` | Candle interval |
| `address` | string | Token or pair address |
| `currency` | `usd`, `pair` | `usd` for token price, `pair` for market/pair price |

**Event**: `PRICE_DATA` | **Key fields**: `{ o, h, l, c, v, eventType, type, unixTime, symbol, address }`

---

## SUBSCRIBE_TXS (Token/Pair Transactions)

Live trade transactions for a token or pair.

**CU/byte**: 0.0004 | **Docs**: https://docs.birdeye.so/reference/tokenpair-transactions

### Token Subscription
```json
{
  "type": "SUBSCRIBE_TXS",
  "data": {
    "queryType": "simple",
    "address": "TOKEN_ADDRESS",
    "txsType": "all"
  }
}
```

### Pair Subscription
```json
{
  "type": "SUBSCRIBE_TXS",
  "data": {
    "queryType": "simple",
    "pairAddress": "PAIR_ADDRESS",
    "txsType": "all"
  }
}
```

### Complex Subscription (max 100 addresses)
```json
{
  "type": "SUBSCRIBE_TXS",
  "data": {
    "queryType": "complex",
    "query": "address = ADDR1 OR pairAddress = PAIR1",
    "txsType": "all"
  }
}
```

| Param | Values | Description |
|---|---|---|
| `txsType` | `all`, `swap`, `add_liquidity`, `remove_liquidity`, `add_remove_liquidity` | Transaction type filter |

**Note**: New `SUBSCRIBE_TXS` replaces existing subscription.

**Event**: `TXS_DATA` | **Key fields**: `{ blockUnixTime, owner, source, txHash, side, volumeUSD, from, to, network, poolId }` — see docs for full field list

---

## SUBSCRIBE_BASE_QUOTE_PRICE

Price updates for a base/quote token pair.

**CU/byte**: 0.003 | **Docs**: https://docs.birdeye.so/reference/base-quote-ohlcv

```json
{
  "type": "SUBSCRIBE_BASE_QUOTE_PRICE",
  "data": {
    "baseAddress": "BASE_TOKEN_ADDRESS",
    "quoteAddress": "QUOTE_TOKEN_ADDRESS",
    "chartType": "1m"
  }
}
```

**Note**: Each connection supports only ONE base-quote pair. Additional pairs require separate connections.

**Event**: `BASE_QUOTE_PRICE_DATA` | **Key fields**: `{ o, h, l, c, v, eventType, type, unixTime, baseAddress, quoteAddress }`

---

## SUBSCRIBE_TOKEN_NEW_LISTING

Real-time notifications for new token listings on DEXs.

**CU/byte**: 0.08 (expensive) | **Docs**: https://docs.birdeye.so/reference/new-token-listing

```json
{
  "type": "SUBSCRIBE_TOKEN_NEW_LISTING"
}
```

### With Filters
```json
{
  "type": "SUBSCRIBE_TOKEN_NEW_LISTING",
  "meme_platform_enabled": true,
  "min_liquidity": 5000,
  "max_liquidity": 10000,
  "sources": ["pump_dot_fun", "meteora_dynamic_bonding_curve"]
}
```

| Param | Type | Description |
|---|---|---|
| `meme_platform_enabled` | boolean | Enable meme token listings (pump.fun etc.) |
| `min_liquidity` | number | Minimum liquidity filter |
| `max_liquidity` | number | Maximum liquidity filter (must > min) |
| `sources` | string[] | Filter by platform: `pump_dot_fun`, `meteora_dynamic_bonding_curve`, etc. |

**Note**: No `data` wrapper — params are at the top level.

**Event**: `TOKEN_NEW_LISTING_DATA` | **Key fields**: `{ address, decimals, name, symbol, liquidity, liquidityAddedAt }` — see docs for full fields

---

## SUBSCRIBE_NEW_PAIR

Real-time notifications for new trading pair creation.

**CU/byte**: 0.05 | **Docs**: https://docs.birdeye.so/reference/new-pair

```json
{
  "type": "SUBSCRIBE_NEW_PAIR"
}
```

### With Filters
```json
{
  "type": "SUBSCRIBE_NEW_PAIR",
  "min_liquidity": 100,
  "max_liquidity": 50000
}
```

**Note**: No `data` wrapper. DEX Openbook pairs are excluded.

**Event**: `NEW_PAIR_DATA` | **Key fields**: `{ data.address, data.name, data.source, data.base, data.quote, data.txHash, data.blockTime }` — see docs for full fields

---

## SUBSCRIBE_LARGE_TRADE_TXS

Monitor large trades above a volume threshold. Only swap transactions.

**CU/byte**: 0.006 | **Docs**: https://docs.birdeye.so/reference/track-large-transactions

```json
{
  "type": "SUBSCRIBE_LARGE_TRADE_TXS",
  "min_volume": 10000,
  "max_volume": 20000
}
```

| Param | Type | Description |
|---|---|---|
| `min_volume` | number | Minimum trade volume in USD |
| `max_volume` | number | Maximum volume (must > min_volume) |

**Note**: No `data` wrapper. Only swap transactions are included.

**Event**: `TXS_LARGE_TRADE_DATA` | **Key fields**: `{ blockUnixTime, owner, source, poolAddress, txHash, volumeUSD, network, from, to }` — see docs for full fields

---

## SUBSCRIBE_WALLET_TXS

Monitor all trades by a specific wallet.

**CU/byte**: 0.004 | **Docs**: https://docs.birdeye.so/reference/wallet-transactions

```json
{
  "type": "SUBSCRIBE_WALLET_TXS",
  "data": {
    "address": "WALLET_ADDRESS"
  }
}
```

Supports both EVM and Solana wallet addresses.

**Event**: `WALLET_TXS_DATA` | **Key fields**: `{ type, blockUnixTime, owner, source, txHash, volumeUSD, network, base, quote }` — see docs for full fields

---

## SUBSCRIBE_TOKEN_STATS

Live token statistics updates with granular field selection.

**CU/byte**: 0.005 | **Docs**: https://docs.birdeye.so/reference/token-stats

```json
{
  "type": "SUBSCRIBE_TOKEN_STATS",
  "data": {
    "address": "TOKEN_ADDRESS",
    "select": {
      "price": true,
      "trade_data": {
        "volume": true,
        "trade": true,
        "price_history": true,
        "price_change": true,
        "unique_wallet": true,
        "intervals": ["30m", "1h", "2h", "4h", "8h", "24h"]
      },
      "fdv": true,
      "marketcap": true,
      "supply": true,
      "last_trade": true,
      "liquidity": true
    }
  }
}
```

Supports single address or array (max 100 addresses).

**Event**: `TOKEN_STATS_DATA` | **Key fields**: `{ address, price, liquidity, marketcap, fdv, circulating_supply, total_supply, volume_*_usd, trade_*, price_change_*_percent, unique_wallet_* }` — see docs for full interval-based fields

---

## SUBSCRIBE_MEME

Live meme token statistics with filtering.

**CU/byte**: Varies | **Docs**: https://docs.birdeye.so/reference/meme-stats

```json
{
  "type": "SUBSCRIBE_MEME",
  "data": {
    "address": "TOKEN_ADDRESS",
    "graduated": false,
    "source": "pump_dot_fun",
    "progress_percent": { "min": 0, "max": 100 },
    "creation_time": { "from": 1720000000, "to": 1720100000 }
  }
}
```

| Param | Type | Description |
|---|---|---|
| `address` | string | Filter specific meme token (optional) |
| `graduated` | boolean | `true` = graduated only, `false` = non-graduated |
| `source` | string | Platform: `pump_dot_fun`, `meteora_dynamic_bonding_curve`, `moonshot`, `raydium_launchlab` |
| `progress_percent` | `{ min, max }` | Bonding curve progress 0-100 |
| `creation_time` | `{ from, to }` | Filter by creation time (Unix seconds) |
| `graduated_time` | `{ from, to }` | Filter by graduation time (requires `graduated: true`) |

**Event**: `MEME_DATA` | **Key fields**: `{ address, name, symbol, price, liquidity, fdv, market_cap, meme_info: { source, creator, graduated, progress_percent, pool } }` — see docs for full fields

---

## Unsubscribe Pattern

Replace `SUBSCRIBE` with `UNSUBSCRIBE`:

```json
{ "type": "UNSUBSCRIBE_PRICE" }
```

For channels with `data`, send the same data:
```json
{
  "type": "UNSUBSCRIBE_TOKEN_STATS",
  "data": { "address": "TOKEN_ADDRESS" }
}
```
