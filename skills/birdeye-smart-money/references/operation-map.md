# Smart Money — Operation Map

## Smart Money Token List

### GET /smart-money/v1/token/list
Tokens being actively traded by smart money wallets.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-smart-money-v1-token-list

| Param | Type | Required | Description |
|---|---|---|---|
| `interval` | string | No | Time interval: `1d`, `7d`, `30d` |
| `trader_style` | string | No | Filter by trader style: `all`, `risk_averse`, `risk_balancers`, `trenchers` |
| `sort_by` | string | No | Sort field: `net_flow`, `smart_traders_no`, `market_cap` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Pagination offset |
| `limit` | number | No | Results per page |

**Key fields**: `data.items[]` → `{ address, name, symbol, price, netFlow, smartTradersNo, smartBuyWallets, smartSellWallets, signal }`, `data.total`

**Signal interpretation**:

| Field | Description |
|---|---|
| `netFlow` | Net flow (buy - sell). Positive = accumulation |
| `smartTradersNo` | Number of smart money traders involved |
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
    sort_by: 'net_flow',
    sort_type: 'desc',
    interval: timeFrame,
    limit: limit.toString(),
  });

  const url = `https://public-api.birdeye.so/smart-money/v1/token/list?${params}`;

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
  return json.data.items.filter((t: any) => t.netFlow > 0);
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
    sort_by: 'net_flow',
    sort_type: 'asc',     // Ascending = most negative net volume first
    interval: timeFrame,
    limit: '20',
  });

  const url = `https://public-api.birdeye.so/smart-money/v1/token/list?${params}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return json.data.items.filter((t: any) => t.netFlow < 0);
}
```

### Track Specific Smart Money Wallets

To track what specific smart money wallets are doing:

1. Get smart money wallets from the token list response (`smartBuyWallets`, `smartSellWallets`)
2. Use `birdeye-wallet-intelligence` skill to analyze each wallet's portfolio and PnL
3. Use `birdeye-transaction-flow` skill to see their recent trades
4. Use `birdeye-realtime-streams` skill (`SUBSCRIBE_WALLET_TXS`) to monitor in real-time
