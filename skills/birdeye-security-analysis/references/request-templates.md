# Security Analysis — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`

---

## 1) Token security check

```bash
curl -sS "https://public-api.birdeye.so/defi/token_security?address=<TOKEN_ADDRESS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.{ mintAuthority, freezeAuthority, mutableMetadata, top10HolderPercent, top10UserPercent, lockInfo, transferFee, isToken2022, preMarketHolder }`

---

## 2) Quick risk flag check

```typescript
async function quickRiskCheck(apiKey: string, tokenAddress: string): Promise<{
  safe: boolean;
  flags: string[];
}> {
  const res = await fetch(
    `https://public-api.birdeye.so/defi/token_security?address=${tokenAddress}`,
    { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' } }
  );
  const json = await res.json();
  const d = json.data;

  const flags: string[] = [];
  if (d.mintAuthority) flags.push('mint authority active — inflation risk');
  if (d.freezeAuthority) flags.push('freeze authority active — censorship risk');
  if (!d.lockInfo?.locked) flags.push('liquidity not locked — rug risk');
  if (d.top10HolderPercent > 80) flags.push(`top 10 hold ${d.top10HolderPercent?.toFixed(1)}% — high concentration`);
  if (d.mutableMetadata) flags.push('mutable metadata — bait-and-switch risk');
  if (d.transferFee?.enabled) flags.push(`transfer fee ${d.transferFee.pct}% — hidden tax`);

  return { safe: flags.length === 0, flags };
}
```

---

## 3) Batch security check (sequential, rate-limited)

```typescript
async function batchSecurityCheck(
  apiKey: string,
  tokenAddresses: string[],
  delayMs = 200
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const headers = { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' };

  for (const address of tokenAddresses) {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/token_security?address=${address}`,
      { headers }
    );
    const json = await res.json();
    results.set(address, json.data);
    await new Promise(r => setTimeout(r, delayMs)); // respect rate limit
  }

  return results;
}
```

---

## 4) Lock info check

```typescript
// After fetching token_security, evaluate lock quality
function assessLockInfo(lockInfo: any): string {
  if (!lockInfo) return 'no lock data';
  if (!lockInfo.locked) return 'unlocked — rug risk';
  const pct = lockInfo.lockPercent ?? 0;
  const expiry = lockInfo.lockExpiry;
  const daysLeft = expiry ? Math.floor((expiry - Date.now() / 1000) / 86400) : null;
  if (pct < 50) return `partial lock (${pct}%) — still risky`;
  if (daysLeft !== null && daysLeft < 30) return `lock expires in ${daysLeft} days — unlocking soon`;
  return `locked (${pct}%)${daysLeft ? ` for ${daysLeft} more days` : ''}`;
}
```
