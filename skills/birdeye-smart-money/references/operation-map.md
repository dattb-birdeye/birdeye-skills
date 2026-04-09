# Smart Money — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.

---

## Smart Money Token List

### GET /smart-money/v1/token/list
Tokens being actively traded by smart money wallets. Solana only.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-smart-money-v1-token-list

```bash
# Accumulation: sort by net_flow desc
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?interval=1d&sort_by=net_flow&sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"

# Distribution: sort by net_flow asc
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?interval=1d&sort_by=net_flow&sort_type=asc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { address, name, symbol, price, netFlow, smartTradersNo, smartBuyWallets, smartSellWallets, signal }`, `data.total`

**Signal fields**:

| Field | Description |
|---|---|
| `netFlow` | Net volume (buy − sell). Positive = accumulation, negative = distribution |
| `smartTradersNo` | Number of distinct smart money wallets trading this token |
| `smartBuyWallets` | Wallets that bought |
| `smartSellWallets` | Wallets that sold |
| `signal` | Birdeye-derived signal: `accumulation`, `distribution`, `neutral` |

---

## Usage Patterns

### Find Accumulating Tokens

```typescript
const params = new URLSearchParams({
  interval: '1d',     // 1d | 7d | 30d
  sort_by: 'net_flow',
  sort_type: 'desc',
  limit: '20',
});

const res = await fetch(
  `https://public-api.birdeye.so/smart-money/v1/token/list?${params}`,
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY!, 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json = await res.json();
const accumulating = json.data.items.filter((t: any) => t.netFlow > 0);
```

### Filter by Trader Style

```typescript
// risk_averse | risk_balancers | trenchers | all
const params = new URLSearchParams({
  interval: '1d',
  trader_style: 'risk_averse',
  sort_by: 'smart_traders_no',
  sort_type: 'desc',
  limit: '20',
});
```

### Track Wallet Activity from Smart Money Results

Smart money API returns tokens, not wallets. To dig into individual wallet behaviour:

1. Get `smartBuyWallets` / `smartSellWallets` from the token list response
2. Use `birdeye-wallet-intelligence` → `GET /wallet/v2/pnl` to analyze each wallet's performance
3. Use `birdeye-transaction-flow` → `GET /trader/txs/seek_by_time` to see their recent trades
4. Use `birdeye-realtime-streams` → `SUBSCRIBE_WALLET_TXS` to monitor in real time
