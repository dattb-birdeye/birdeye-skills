# Token Discovery — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.

---

## Search

### GET /defi/v3/search
Search tokens and pairs by keyword (name, symbol, or address). `sort_by` and `sort_type` are required.

**CU**: low | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-search

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/search?sort_by=liquidity&sort_type=desc&keyword=bonk&target=token" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { type: "token"|"market", result: [{ name, symbol, address, decimals, logoURI, liquidity, volume24hUSD, marketCap, network }] }`

---

## Token Lists

### GET /defi/v3/token/list
Browse tokens ranked by volume, liquidity, market cap, or holder count with optional filters.

**CU**: 100 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-list

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/list?sort_by=volume24h&sort_type=desc&min_liquidity=50000&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.tokens[] → { address, name, symbol, price, priceChange24h, volume24h, liquidity, marketCap, holder, trade24h, uniqueWallet24h }`, `data.total`

---

### GET /defi/v3/token/list/scroll
Scroll-based pagination for iterating the full token universe. Use only when you need all tokens — expensive.

**CU**: 500 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-list-scroll

```bash
# First page — no scroll_id
curl -sS "https://public-api.birdeye.so/defi/v3/token/list/scroll?sort_by=volume24h&sort_type=desc" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"

# Subsequent pages — pass scroll_id from previous response
curl -sS "https://public-api.birdeye.so/defi/v3/token/list/scroll?sort_by=volume24h&sort_type=desc&scroll_id=<ID>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: same as v3/token/list plus `data.scroll_id` for next page

---

## Market List

### GET /defi/v2/markets
All trading pairs for a token — useful for finding pool addresses or liquidity distribution across DEXs. `time_frame`, `sort_by`, `sort_type` are required.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v2-markets

```bash
curl -sS "https://public-api.birdeye.so/defi/v2/markets?address=<TOKEN>&time_frame=24h&sort_by=liquidity&sort_type=desc" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: list of pairs with DEX info, base/quote tokens, volume, liquidity

---

## New Listing & Trending

### GET /defi/v2/tokens/new_listing
Recently listed tokens. Includes creation time, initial liquidity, current price, volume.

**CU**: 80 | **Docs**: https://docs.birdeye.so/reference/get-defi-v2-tokens-new_listing

```bash
curl -sS "https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=20&meme_platform_enabled=true" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: list of recently listed tokens with `{ address, name, symbol, liquidity, price, volume24h, createdAt }`

---

### GET /defi/token_trending
Currently trending tokens. `sort_by` and `sort_type` are required.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-token_trending

```bash
curl -sS "https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&interval=24h&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Creation Info

### GET /defi/token_creation_info
Token deployment details: deployer wallet, creation tx, creation timestamp. Solana only.

**CU**: 80 | **Docs**: https://docs.birdeye.so/reference/get-defi-token_creation_info

```bash
curl -sS "https://public-api.birdeye.so/defi/token_creation_info?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ address, decimals, symbol, name, txHash, slot, blockUnixTime, owner, deployer }`

---

## Meme Tokens

### GET /defi/v3/token/meme/list
Browse meme tokens (pump.fun, bonding curve). Solana and BSC only.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meme-list

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/meme/list?sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /defi/v3/token/meme/detail/single
Detailed meme token metrics: graduation status, bonding curve progress, social metrics.

**CU**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-meme-detail-single

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/meme/detail/single?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Utilities

### GET /utils/v1/credits
Check remaining API credit balance.

**Docs**: https://docs.birdeye.so/reference/get-utils-v1-credits

```bash
curl -sS "https://public-api.birdeye.so/utils/v1/credits" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "accept: application/json"
```

**Response**: `data.{ totalCredits, usedCredits, remainingCredits, resetDate }`
