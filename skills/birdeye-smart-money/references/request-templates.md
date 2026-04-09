# Smart Money — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`

---

## 1) Tokens being accumulated by smart money (24h)

```bash
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?sort_by=net_flow&sort_type=desc&interval=1d&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.items[].{ address, name, symbol, netFlow, smartTradersNo, smartBuyWallets, smartSellWallets, signal }`

---

## 2) Tokens being distributed (smart money selling)

```bash
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?sort_by=net_flow&sort_type=asc&interval=1d&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## 3) Most wallet-consensus tokens (highest smart trader count)

```bash
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?sort_by=smart_traders_no&sort_type=desc&interval=7d&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## 4) Filter by trader style — risk-averse wallets only

```typescript
const params = new URLSearchParams({
  sort_by: 'net_flow',
  sort_type: 'desc',
  interval: '7d',
  trader_style: 'risk_averse',  // all | risk_averse | risk_balancers | trenchers
  limit: '20',
});

const res = await fetch(
  `https://public-api.birdeye.so/smart-money/v1/token/list?${params}`,
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY!, 'x-chain': 'solana', 'accept': 'application/json' } }
);
const data = await res.json();

// Filter for pure accumulation (positive net flow only)
const accumulating = data.data.items.filter((t: any) => t.netFlow > 0);
```

---

## 5) 30-day sustained smart money trend

```bash
curl -sS "https://public-api.birdeye.so/smart-money/v1/token/list?sort_by=net_flow&sort_type=desc&interval=30d&limit=10" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## Signal check helper

```typescript
// After getting smart money token list, check signal strength
function assessSignal(token: any): string {
  const { netFlow, smartTradersNo, signal } = token;
  if (smartTradersNo < 3) return 'weak — too few wallets';
  if (netFlow > 0 && signal === 'accumulation') return 'strong buy';
  if (netFlow < 0 && signal === 'distribution') return 'strong sell';
  return signal || 'neutral';
}
```
