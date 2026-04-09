# Pagination Guide

Birdeye uses three pagination patterns depending on the endpoint.

---

## Pattern 1: offset / limit (most common)

Used by: token list, holder list, trade history, balance changes, smart money list, etc.

**Request params**: `offset` (default: 0), `limit` (endpoint-specific max)
**Response signals**: `data.total` (total count) or `data.hasNext` (boolean)

```typescript
async function paginate<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total?: number; hasNext?: boolean }>,
  limit = 50
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset, limit);
    all.push(...page.items);

    // Use hasNext if available, otherwise use total count
    const done = page.hasNext === false || (page.total !== undefined && all.length >= page.total);
    if (done || page.items.length < limit) break;
    offset += limit;
  }

  return all;
}
```

### Per-endpoint max limits

| Endpoint | Max `limit` | Notes |
|---|---|---|
| `/defi/v3/token/list` | 50 | Default: 20 |
| `/defi/v3/token/txs` | 50 | Default varies |
| `/defi/v3/token/holder` | 100 | — |
| `/defi/v3/search` | 20 | Hard cap |
| `/smart-money/v1/token/list` | 100 | — |
| `/defi/v2/tokens/new_listing` | — | No documented cap |
| `/wallet/v2/current-net-worth` | 100 | Token list in portfolio |
| `/v1/wallet/tx_list` | — | Use `before_time` to paginate |

---

## Pattern 2: scroll_id (full dataset iteration)

Used by: `/defi/v3/token/list/scroll` only

First page — no `scroll_id`:
```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/list/scroll?sort_by=volume24h&sort_type=desc&limit=50" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

Subsequent pages — pass `scroll_id` from previous response:
```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/list/scroll?sort_by=volume24h&sort_type=desc&limit=50&scroll_id=SCROLL_ID_FROM_PREV" \
  -H "X-API-KEY: $KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Stop condition**: empty `data.tokens` array or `data.hasNext === false`

⚠️ Cost: 500 CU per call — only use when you need to iterate the full token universe.

---

## Pattern 3: time-based pagination

Used by: `/defi/v3/token/txs`, `/defi/txs/token/seek_by_time`, `/trader/txs/seek_by_time`, `/v1/wallet/tx_list`

Use `before_time` / `after_time` (Unix seconds) to window your queries:

```typescript
async function fetchAllTrades(
  apiKey: string,
  tokenAddress: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  const all: any[] = [];
  let before = endTime;

  while (true) {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/v3/token/txs?address=${tokenAddress}&before_time=${before}&after_time=${startTime}&limit=50`,
      { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' } }
    );
    const json = await res.json();
    const items = json.data?.items ?? [];
    all.push(...items);

    if (!json.data?.hasNext || items.length === 0) break;

    // Move window back using earliest item's timestamp
    before = items[items.length - 1].blockUnixTime - 1;
  }

  return all;
}
```

---

## Pattern 4: cursor (rare)

Some newer/beta endpoints may use cursor-based pagination. Check response for a `cursor` field and pass it back in the next request's `cursor` param.

---

## Summary

| Pattern | Endpoints | Key params |
|---|---|---|
| offset/limit | Most list endpoints | `offset`, `limit` → check `hasNext` or `total` |
| scroll_id | `/defi/v3/token/list/scroll` | `scroll_id` from response |
| time-based | Trade history, tx_list | `before_time`, `after_time`, `limit` |
| cursor | Some beta endpoints | `cursor` from response |
