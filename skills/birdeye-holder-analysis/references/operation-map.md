# Holder Analysis — Operation Map

## Token Holder

### GET /defi/v3/token/holder
Paginated list of token holders with balances.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-holder

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `offset` | number | No | Pagination offset (default: 0) |
| `limit` | number | No | Results per page (max 100) |

**Key fields**: `data.items[]` → `{ address, amount (string), uiAmount, decimals, percentage, owner, rank }`, `data.totalHolder`, `data.hasNext`

**Notes**:
- `amount`: Raw token amount (string to preserve precision for large numbers)
- `uiAmount`: Human-readable amount (amount / 10^decimals)
- `percentage`: Percentage of total supply held

---

## Holder Distribution

### GET /holder/v1/distribution
Distribution of holders by balance ranges.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-holder-v1-distribution

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.distribution[]` → `{ range, holderCount, percentage, totalAmount }`, `data.totalHolder`, `data.totalSupply`

---

## Batch Holder

### POST /token/v1/holder/batch
Batch holder data for multiple tokens.

**CU Cost**: Variable per token | **Docs**: https://docs.birdeye.so/reference/post-token-v1-holder-batch

**Body**: `{ "list_address": ["token_addr_1", "token_addr_2"] }`

**Key fields**: Array of holder summaries per token with `totalHolder`, top holders, and concentration metrics.

---

## Derived Analysis Patterns

### Concentration Score Calculation

```typescript
async function getConcentrationScore(
  apiKey: string,
  tokenAddress: string,
  chain: string = 'solana'
): Promise<{
  top10Pct: number;
  top50Pct: number;
  risk: 'low' | 'medium' | 'high';
}> {
  const url = `https://public-api.birdeye.so/defi/v3/token/holder?address=${tokenAddress}&limit=50`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  const holders = json.data.items;
  const top10Pct = holders.slice(0, 10).reduce((sum: number, h: any) => sum + h.percentage, 0);
  const top50Pct = holders.slice(0, 50).reduce((sum: number, h: any) => sum + h.percentage, 0);

  let risk: 'low' | 'medium' | 'high';
  if (top10Pct > 80) risk = 'high';
  else if (top10Pct > 50) risk = 'medium';
  else risk = 'low';

  return { top10Pct, top50Pct, risk };
}
```

### Distribution Health Score

```typescript
function assessDistribution(distribution: any[]): {
  score: number;     // 0-100 (higher = healthier)
  verdict: string;
} {
  const totalHolders = distribution.reduce((sum, d) => sum + d.holderCount, 0);
  const smallHolderPct = (distribution[0]?.holderCount || 0) / totalHolders;
  const whaleHolderPct = (distribution[distribution.length - 1]?.holderCount || 0) / totalHolders;

  const score = Math.min(100, Math.round(smallHolderPct * 80 + (1 - whaleHolderPct) * 20));

  let verdict: string;
  if (score > 70) verdict = 'Healthy — well distributed across many holders';
  else if (score > 40) verdict = 'Moderate — some concentration in large holders';
  else verdict = 'Concentrated — dominated by few wallets, higher risk';

  return { score, verdict };
}
```
