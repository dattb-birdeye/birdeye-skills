# Token Discovery — Operation Map

## Search

### GET /defi/v3/search
Search tokens and pairs by keyword (name, symbol, or address).

**CU Cost**: Low | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-search

| Param | Type | Required | Description |
|---|---|---|---|
| `keyword` | string | Yes | Search term (token name, symbol, or address) |
| `target` | string | No | Filter target: `token`, `market` (default: both) |
| `sort_by` | string | No | Sort results: `volume_24h_usd`, `liquidity`, `market_cap` |
| `sort_type` | string | No | Sort direction: `asc`, `desc` |
| `offset` | number | No | Pagination offset |
| `limit` | number | No | Results per page (max 20) |
| `chain` | string | No | Alternative to x-chain header. `all` to search all chains |

**Key fields**: `data.items[]` → `{ type: "token"|"market", result: [{ name, symbol, address, decimals, logoURI, liquidity, volume24hUSD, marketCap, network }] }`

---

## Token Lists

### GET /defi/v3-token-list
Browse tokens with filtering and sorting.

**CU Cost**: 100 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-list

| Param | Type | Required | Description |
|---|---|---|---|
| `sort_by` | string | No | Sort field: `volume24h`, `liquidity`, `marketCap`, `price`, `priceChange24h`, `holder`, `trade24h`, `uniqueWallet24h` |
| `sort_type` | string | No | `asc` or `desc` (default: `desc`) |
| `offset` | number | No | Pagination offset (default: 0) |
| `limit` | number | No | Results per page (max 50, default: 20) |
| `min_liquidity` | number | No | Minimum USD liquidity filter |
| `min_volume_24h` | number | No | Minimum 24h volume filter |
| `min_market_cap` | number | No | Minimum market cap filter |
| `min_holder` | number | No | Minimum holder count |
| `min_trade_24h` | number | No | Minimum trade count in 24h |

**Key fields**: `data.tokens[]` → `{ address, name, symbol, price, priceChange24h, volume24h, liquidity, marketCap, holder, trade24h, uniqueWallet24h }`, `data.total`

### GET /defi/v3-token-list-scroll
Scroll-based pagination for large token lists.

**CU Cost**: 500 (expensive) | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-list-scroll

Same params as v3-token-list, plus:
| Param | Type | Required | Description |
|---|---|---|---|
| `scroll_id` | string | No | Scroll cursor from previous response |

Use only when you need to iterate through the full token list. For most use cases, `v3-token-list` with offset/limit is sufficient.

### GET /defi/tokenlist (Legacy)
Legacy token list endpoint.

**CU Cost**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-tokenlist

| Param | Type | Required | Description |
|---|---|---|---|
| `sort_by` | string | No | `v24hUSD`, `mc`, `holder` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Pagination offset |
| `limit` | number | No | Max 50 |

---

## Market List

### GET /defi/v2-markets
All trading pairs/markets for a token.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v2-markets

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `sort_by` | string | No | `volume24h`, `liquidity` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Pagination offset |
| `limit` | number | No | Results per page |

**Key fields**: List of trading pairs with DEX info, base/quote tokens, volume, liquidity.

---

## New Listing & Trending

### GET /defi/v2-tokens-new_listing
Recently listed tokens.

**CU Cost**: 80 | **Docs**: https://docs.birdeye.so/reference/get-defi-v2-tokens-new_listing

| Param | Type | Required | Description |
|---|---|---|---|
| `time_to` | number | No | End time filter (Unix timestamp) |
| `limit` | number | No | Results per page |
| `meme_platform_enabled` | boolean | No | Include meme platform tokens |

**Key fields**: List of recently listed tokens with creation time, initial liquidity, current price, volume.

### GET /defi-token_trending
Currently trending tokens.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-defi-token_trending

| Param | Type | Required | Description |
|---|---|---|---|
| `sort_by` | string | No | `rank`, `volume24h`, `priceChange24h` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

---

## Creation Info

### GET /defi-token_creation_info
Token creation/deployment details.

**CU Cost**: 80 | **Docs**: https://docs.birdeye.so/reference/get-defi-token_creation_info

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ address, decimals, symbol, name, txHash, slot, blockUnixTime, owner, deployer }`

---

## Meme Tokens

### GET /defi/v3-token-meme-list
Browse meme tokens with filtering.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meme-list

| Param | Type | Required | Description |
|---|---|---|---|
| `sort_by` | string | No | Sort field |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

### GET /defi/v3-token-meme-detail-single
Detailed meme token metrics.

**CU Cost**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meme-detail-single

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: Meme-specific metrics including social metrics, holder distribution, pump.fun/bonding curve status.

---

## Utilities

### GET /utils/v1/credits
Check API credit usage.

**Docs**: https://docs.birdeye.so/reference/get-utils-v1-credits

**Key fields**: `data.{ totalCredits, usedCredits, remainingCredits, resetDate }`
