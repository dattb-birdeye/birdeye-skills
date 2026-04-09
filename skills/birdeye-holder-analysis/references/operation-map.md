# Holder Analysis — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.

---

## Token Holder

### GET /defi/v3/token/holder
Paginated list of token holders with balances and percentages. Solana only.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-holder

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/holder?address=<TOKEN>&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { address, amount (string), uiAmount, decimals, percentage, owner, rank }`, `data.totalHolder`, `data.hasNext`

**Notes**:
- `amount`: raw integer as string (preserves precision for large supply tokens)
- `uiAmount`: human-readable (amount / 10^decimals)
- `percentage`: fraction of total supply held by this wallet

---

## Holder Distribution

### GET /holder/v1/distribution
Holder distribution bucketed by balance range. Solana only.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-holder-v1-distribution

```bash
curl -sS "https://public-api.birdeye.so/holder/v1/distribution?token_address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.distribution[] → { range, holderCount, percentage, totalAmount }`, `data.totalHolder`, `data.totalSupply`

---

## Batch Holder

### POST /token/v1/holder/batch
Batch holder summary for multiple tokens in one call.

**CU**: variable/token | **Docs**: https://docs.birdeye.so/reference/post-token-v1-holder-batch

```bash
curl -sS -X POST "https://public-api.birdeye.so/token/v1/holder/batch" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"list_address": ["<TOKEN1>", "<TOKEN2>"]}'
```

**Response**: array of holder summaries per token with `totalHolder`, top holders, and concentration metrics

---

## Analysis Patterns

### Concentration Score

```typescript
async function getConcentrationScore(apiKey: string, tokenAddress: string) {
  const res = await fetch(
    `https://public-api.birdeye.so/defi/v3/token/holder?address=${tokenAddress}&limit=50`,
    { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' } }
  );
  const json = await res.json();
  const holders = json.data.items;

  const top10Pct = holders.slice(0, 10).reduce((s: number, h: any) => s + h.percentage, 0);
  const top50Pct = holders.slice(0, 50).reduce((s: number, h: any) => s + h.percentage, 0);
  const risk = top10Pct > 0.8 ? 'high' : top10Pct > 0.5 ? 'medium' : 'low';

  return { top10Pct, top50Pct, risk };
}
```

### Distribution Health Score

```typescript
function assessDistribution(distribution: any[]): { score: number; verdict: string } {
  const total = distribution.reduce((s, d) => s + d.holderCount, 0);
  const smallHolderPct = (distribution[0]?.holderCount || 0) / total;
  const whaleHolderPct = (distribution[distribution.length - 1]?.holderCount || 0) / total;

  const score = Math.min(100, Math.round(smallHolderPct * 80 + (1 - whaleHolderPct) * 20));
  const verdict =
    score > 70 ? 'Healthy — well distributed' :
    score > 40 ? 'Moderate — some whale concentration' :
    'Concentrated — dominated by few wallets';

  return { score, verdict };
}
```
