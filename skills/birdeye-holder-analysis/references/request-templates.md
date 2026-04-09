# Holder Analysis — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`

---

## 1) Top 20 holders

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/holder?address=<TOKEN_ADDRESS>&limit=20&offset=0" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.items[].{ owner, uiAmount, percentage, rank }`, `data.totalHolder`, `data.hasNext`

---

## 2) Concentration check — top 10 percentage

```typescript
const res = await fetch(
  'https://public-api.birdeye.so/defi/v3/token/holder?address=<TOKEN_ADDRESS>&limit=10',
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY!, 'x-chain': 'solana', 'accept': 'application/json' } }
);
const data = await res.json();

const top10Pct = data.data.items
  .slice(0, 10)
  .reduce((sum: number, h: any) => sum + (h.percentage || 0), 0);

console.log(`Top 10 holders: ${top10Pct.toFixed(1)}%`);
// >80% = high concentration risk
```

---

## 3) Holder distribution by balance range

```bash
curl -sS "https://public-api.birdeye.so/holder/v1/distribution?token_address=<TOKEN_ADDRESS>&mode=percent" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.distribution[].{ range, holderCount, percentage, totalAmount }`, `data.totalHolder`, `data.totalSupply`

---

## 4) Holder distribution — top N holders

```bash
curl -sS "https://public-api.birdeye.so/holder/v1/distribution?token_address=<TOKEN_ADDRESS>&mode=top&top_n=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## 5) Batch holder data for multiple tokens (POST)

```bash
curl -sS -X POST "https://public-api.birdeye.so/token/v1/holder/batch" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"list_address": ["<TOKEN_1>", "<TOKEN_2>", "<TOKEN_3>"]}'
```
