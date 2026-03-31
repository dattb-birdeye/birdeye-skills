# Market Data — Caveats & Common Mistakes

## Endpoint Version Confusion

- **V3 vs Legacy**: Always prefer V3 endpoints (`/defi/v3-ohlcv`, `/defi/v3-token-*`). Legacy endpoints (`/defi/ohlcv`, `/defi/tokenlist`) are maintained for backward compatibility but may have lower performance.
- **Dynamic CU Costs**: V3 OHLCV and recent trades use dynamic pricing based on data range. A 1-hour window costs less than a 30-day window.

## OHLCV Pitfalls

- **Max 1000 records**: If your time range produces >1000 candles, the response is truncated. Split into smaller ranges.
- **Interval strings are case-sensitive**: Use `1H` not `1h`, `1D` not `1d`, `1M` not `1m` (except for minutes: `1m`, `3m`, `5m`, `15m`, `30m`).
- **time_from and time_to are Unix seconds**, not milliseconds. Divide JavaScript `Date.now()` by 1000.
- **Pair vs Token OHLCV**: `/defi/v3-ohlcv` uses token address (aggregated across all pairs). `/defi/v3-ohlcv-pair` uses pair address (specific DEX pool). Choose based on whether you want aggregated or pool-specific data.

## Price Data Pitfalls

- **multi_price max 100**: The multi-price endpoint caps at 100 addresses per request. For more, batch into multiple calls.
- **price vs history_price CU cost**: `price` is 10 CU, `history_price` is 60 CU (6x more expensive). Only use `history_price` when you actually need historical data.
- **historical_price_unix returns nearest**: It returns the price closest to the requested timestamp, not an exact match. Useful for "price at time X" queries.

## Stats Pitfalls

- **token_overview vs V3 endpoints**: `token_overview` (30 CU) returns everything in one call. V3 endpoints split into meta (5 CU), market (15 CU), trade (15 CU). If you need all three, `token_overview` is cheaper. If you only need metadata, use V3 meta (5 CU).
- **Batch endpoints have address limits**: `*-multiple` endpoints typically cap at 100 addresses. Don't pass more without checking the documentation.

## Chain-Specific Issues

- **Always set x-chain header**: If omitted, defaults to `solana`. This is the #1 cause of "token not found" errors when querying EVM chains.
- **Address format matters**: Solana uses base58, EVM uses 0x-prefixed hex. Don't mix them up when specifying the chain.
- **Not all tokens exist on all chains**: A token address valid on Ethereum won't work with `x-chain: solana`.

## Rate Limiting

- **Wallet API group**: Even when querying price/volume data, if you're also calling wallet endpoints, the wallet 30 rpm limit applies separately.
- **Exponential backoff**: On 429 (rate limited), wait 1s → 2s → 4s → 8s before retrying. Don't retry immediately.

## Data Freshness

- **Price updates**: Real-time price is typically <2s lag. OHLCV candles for smaller intervals (1m, 5m) may have slight lag.
- **Token overview**: Stats like `holder` count may be updated less frequently (minutes to hours).
- **Historical data**: Complete and immutable once available. No lag concerns for past data.
