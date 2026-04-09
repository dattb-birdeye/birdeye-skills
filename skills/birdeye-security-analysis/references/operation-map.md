# Security Analysis — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.

---

## Token Security

### GET /defi/token_security
Security audit and risk flags for a token. All chains except Sui.

**CU**: 50 | **Docs**: https://docs.birdeye.so/reference/get-defi-token_security

```bash
curl -sS "https://public-api.birdeye.so/defi/token_security?address=<TOKEN>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data` — schema differs by chain (Solana vs EVM). Key fields:

**Solana response fields**:

| Field | Risk Signal |
|---|---|
| `mintAuthority` | Non-null = can mint new tokens (inflation risk) |
| `freezeAuthority` | Non-null = can freeze token accounts (censorship risk) |
| `metaplexUpdateAuthority` | Non-null = can change token metadata (bait-and-switch risk) |
| `mutableMetadata` | `true` = metadata can be modified |
| `top10HolderPercent` | > 0.8 (80%) = concentration risk |
| `top10UserPercent` | > 0.5 (50%) = whale risk |
| `lockInfo` | `null` = no liquidity lock (rug pull risk); check `lockPercent`, `lockExpiry` |
| `transferFeeEnable` | `true` = token has a transfer tax |
| `isToken2022` | Uses Token-2022 program — may have extension risks |
| `preMarketHolder` | Non-empty = wallets held before market was created (insider risk) |
| `jupStrictList` | `false` = not on Jupiter strict list |

**EVM response fields**:

| Field | Risk Signal |
|---|---|
| `isHoneypot` | `"1"` = cannot sell (honeypot) |
| `isMintable` | `"1"` = mintable supply |
| `isOpenSource` | `"0"` = unverified contract |
| `isProxy` | `"1"` = upgradeable proxy (can change logic) |
| `hiddenOwner` | `"1"` = renounced but hidden owner exists |
| `buyTax` / `sellTax` | Non-zero = buy/sell fee percentage |
| `canTakeBackOwnership` | `"1"` = ownership can be reclaimed |
| `holderCount` | Cross-reference with holder analysis |

---

## Composite Analysis Pattern

For thorough security check, combine with other skills:

```typescript
async function fullSecurityAnalysis(apiKey: string, tokenAddress: string, chain = 'solana') {
  const headers = { 'X-API-KEY': apiKey, 'x-chain': chain, 'accept': 'application/json' };

  // 1. Security flags (50 CU)
  const secRes = await fetch(
    `https://public-api.birdeye.so/defi/token_security?address=${tokenAddress}`, { headers }
  );
  const security = await secRes.json();

  // 2. Token overview for liquidity/volume context (30 CU)
  const overviewRes = await fetch(
    `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`, { headers }
  );
  const overview = await overviewRes.json();

  // 3. Top holders for concentration check (variable CU)
  const holdersRes = await fetch(
    `https://public-api.birdeye.so/defi/v3/token/holder?address=${tokenAddress}&limit=20`, { headers }
  );
  const holders = await holdersRes.json();

  return {
    security: security.data,
    overview: overview.data,
    topHolders: holders.data?.items ?? [],
  };
}
```
