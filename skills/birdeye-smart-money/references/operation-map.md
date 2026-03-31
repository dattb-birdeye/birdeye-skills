# Smart Money — Operation Map

All responses are wrapped in `{ "data": { ... }, "success": true }`.

> **IMPORTANT**: Key fields listed below are approximate hints only — they may contain inaccurate field names. **ALWAYS WebFetch the Docs URL** for each endpoint to get the actual response schema before writing code that parses API responses. Do NOT trust key field hints as authoritative.

## Smart Money Token List

### GET /smart-money-v1-token-list
Tokens being actively traded by smart money wallets.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-smart-money-v1-token-list

| Param | Type | Required | Description |
|---|---|---|---|
| `sort_by` | string | No | Sort field: `smart_buy_volume`, `smart_sell_volume`, `smart_net_volume`, `smart_wallet_count` |
| `sort_type` | string | No | `asc`, `desc` |
| `time_frame` | string | No | `24h`, `7d`, `30d` |
| `offset` | number | No | Pagination offset |
| `limit` | number | No | Results per page |

**Key fields**: `data.items[]` → `{ address, name, symbol, price, smartBuyVolume, smartSellVolume, smartNetVolume, smartWalletCount, smartBuyWallets, smartSellWallets, signal }`, `data.total`

**Signal interpretation**:

| Field | Description |
|---|---|
| `smartBuyVolume` | Total USD volume bought by smart money |
| `smartSellVolume` | Total USD volume sold by smart money |
| `smartNetVolume` | Net flow (buy - sell). Positive = accumulation |
| `smartWalletCount` | Number of smart money wallets involved |
| `smartBuyWallets` | List of smart money wallets that bought |
| `smartSellWallets` | List of smart money wallets that sold |
| `signal` | Birdeye's derived signal: `accumulation`, `distribution`, `neutral` |

---

## Usage Patterns

### Find Tokens Smart Money is Accumulating

```typescript
async function getSmartMoneyAccumulation(
  apiKey: string,
  chain: string = 'solana',
  timeFrame: string = '24h',
  limit: number = 20
): Promise<any[]> {
  const params = new URLSearchParams({
    sort_by: 'smart_net_volume',
    sort_type: 'desc',
    time_frame: timeFrame,
    limit: limit.toString(),
  });

  const url = `https://public-api.birdeye.so/smart-money-v1-token-list?${params}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  // Filter for tokens with positive net volume (accumulation)
  return json.data.items.filter((t: any) => t.smartNetVolume > 0);
}
```

### Find Tokens Smart Money is Dumping

```typescript
async function getSmartMoneyDistribution(
  apiKey: string,
  chain: string = 'solana',
  timeFrame: string = '24h'
): Promise<any[]> {
  const params = new URLSearchParams({
    sort_by: 'smart_net_volume',
    sort_type: 'asc',     // Ascending = most negative net volume first
    time_frame: timeFrame,
    limit: '20',
  });

  const url = `https://public-api.birdeye.so/smart-money-v1-token-list?${params}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return json.data.items.filter((t: any) => t.smartNetVolume < 0);
}
```

### Track Specific Smart Money Wallets

To track what specific smart money wallets are doing:

1. Get smart money wallets from the token list response (`smartBuyWallets`, `smartSellWallets`)
2. Use `birdeye-wallet-intelligence` skill to analyze each wallet's portfolio and PnL
3. Use `birdeye-transaction-flow` skill to see their recent trades
4. Use `birdeye-realtime-streams` skill (`SUBSCRIBE_WALLET_TXS`) to monitor in real-time
