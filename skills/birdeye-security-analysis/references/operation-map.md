# Security Analysis — Operation Map

## Token Security

### GET /defi-token_security
Security audit and risk assessment for a token.

**CU Cost**: 50 | **Docs**: https://docs.birdeye.so/reference/get-defi-token_security

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |

**Key fields**: `data.{ ownerAddress, creatorAddress, mintAuthority, freezeAuthority, isToken2022, mutableMetadata, top10HolderPercent, top10UserPercent, totalSupply, lockInfo, transferFee, isVerified, knownAccounts, preMarketHolder }`

**Key Security Fields**:

| Field | What It Means | Risk Signal |
|---|---|---|
| `mintAuthority` | Can mint new tokens | Non-null = inflation risk |
| `freezeAuthority` | Can freeze token accounts | Non-null = censorship risk |
| `metaplexUpdateAuthority` | Can change token metadata | Non-null = bait-and-switch risk |
| `mutableMetadata` | Metadata can be modified | true = metadata can change |
| `top10HolderPercent` | Supply held by top 10 wallets | >80% = concentration risk |
| `top10UserPercent` | Supply held by top 10 non-program wallets | >50% = whale risk |
| `lockInfo.locked` | Liquidity is locked | false = rug pull risk |
| `lockInfo.lockPercent` | % of liquidity locked | <50% = partial lock, still risky |
| `lockInfo.lockExpiry` | Lock expiry timestamp | Soon = unlocking risk |
| `transferFee.enabled` | Token has transfer tax | true = hidden fee, check % |
| `isToken2022` | Uses Token-2022 program | May have extension risks |
| `preMarketHolder` | Wallets that held before market creation | Insider risk signal |

---

## Composite Security Analysis Pattern

For a thorough security check, combine the security endpoint with other skills:

```typescript
async function fullSecurityAnalysis(
  apiKey: string,
  tokenAddress: string,
  chain: string = 'solana'
) {
  const headers = {
    'X-API-KEY': apiKey,
    'x-chain': chain,
    'accept': 'application/json',
  };

  // 1. Security data (50 CU)
  const securityRes = await fetch(
    `https://public-api.birdeye.so/defi-token_security?address=${tokenAddress}`,
    { headers }
  );
  const security = await securityRes.json();

  // 2. Token overview for liquidity/volume context (30 CU)
  const overviewRes = await fetch(
    `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`,
    { headers }
  );
  const overview = await overviewRes.json();

  // 3. Top holders for concentration check (variable CU)
  const holdersRes = await fetch(
    `https://public-api.birdeye.so/defi/v3-token-holder?address=${tokenAddress}&limit=20`,
    { headers }
  );
  const holders = await holdersRes.json();

  return {
    security: security.data,
    overview: overview.data,
    topHolders: holders.data?.items || [],
  };
}
```
