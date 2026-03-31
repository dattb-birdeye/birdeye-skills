# Security Analysis — Risk Flags Guide

## Authority-Based Risks

### Mint Authority
- **What**: The wallet/program that can create new tokens, inflating supply.
- **Safe**: `null` — no one can mint new tokens.
- **Risky**: A wallet address — holder can inflate supply at any time.
- **Mitigated**: A program address (multisig, timelock) — less risky but still possible.

### Freeze Authority
- **What**: Can freeze any token account, preventing holders from transferring.
- **Safe**: `null` — no one can freeze accounts.
- **Risky**: A wallet address — holder can freeze your tokens.
- **Context**: Some legitimate tokens (e.g., stablecoins) use freeze authority for compliance.

### Metaplex Update Authority
- **What**: Can change token name, symbol, logo, and metadata.
- **Safe**: `null` or renounced.
- **Risky**: Active authority — token could change identity (bait-and-switch).
- **Common tactic**: Launch as "LEGIT TOKEN", change metadata to something else after gaining traction.

## Liquidity Risks

### Liquidity Lock Status
- **Locked (>80%, long expiry)**: Good — LP tokens can't be pulled.
- **Locked (short expiry)**: Moderate — check when it expires.
- **Partially locked**: Risky — unlocked portion can still be rugpulled.
- **Not locked**: High risk — deployer can remove all liquidity at any time.

### Lock Expiry
- **>1 year**: Generally safe signal.
- **1-6 months**: Moderate — could unlock soon.
- **<1 month**: High risk — imminent unlock.
- **Already expired**: Treat as unlocked.

### Lock Platform
Common platforms: `streamflow`, `uncx`, `team.finance`, `unicrypt`.
- Verify the lock on the platform itself. The API reports what's indexed, but always cross-reference.

## Holder-Based Risks

### Top 10 Holder Percentage
| Range | Risk Level | Interpretation |
|---|---|---|
| 0-30% | Low | Well distributed |
| 30-50% | Medium | Some concentration |
| 50-80% | High | Whale-dominated |
| 80-100% | Critical | Extreme concentration |

### Top 10 User Percentage
- Excludes known program accounts (DEX pools, vaults).
- More accurate for assessing individual whale risk.
- If `top10UserPercent` is much lower than `top10HolderPercent`, most concentration is in DEX pools (less risky).

### Pre-Market Holders
- Wallets that held tokens before the first DEX listing.
- Can indicate insider allocation, team tokens, or pre-sale.
- Not inherently bad, but worth investigating.

## Token-2022 Risks

### Transfer Fee
- Token has a built-in fee on every transfer.
- Check `transferFee.feePercent` — high percentages (>5%) are unusual.
- Some scam tokens use 99% transfer fee (honeypot).

### Other Extensions
- Token-2022 supports many extensions (confidential transfers, transfer hooks, etc.).
- Transfer hooks can execute arbitrary code on transfer — additional risk surface.

## Composite Risk Score

```typescript
function calculateRiskScore(security: any): {
  score: number;        // 0-100 (0 = safest, 100 = riskiest)
  level: string;
  flags: string[];
} {
  let score = 0;
  const flags: string[] = [];

  // Authority checks
  if (security.mintAuthority) { score += 20; flags.push('Active mint authority'); }
  if (security.freezeAuthority) { score += 15; flags.push('Active freeze authority'); }
  if (security.mutableMetadata) { score += 10; flags.push('Mutable metadata'); }

  // Liquidity checks
  if (!security.lockInfo?.locked) { score += 25; flags.push('Liquidity not locked'); }
  else if (security.lockInfo.lockPercent < 50) { score += 15; flags.push('Low lock percentage'); }

  // Concentration checks
  if (security.top10HolderPercent > 80) { score += 20; flags.push('Extreme holder concentration'); }
  else if (security.top10HolderPercent > 50) { score += 10; flags.push('High holder concentration'); }

  // Transfer fee
  if (security.transferFee?.enabled && security.transferFee.feePercent > 5) {
    score += 15; flags.push(`High transfer fee: ${security.transferFee.feePercent}%`);
  }

  // Pre-market holders
  if (security.preMarketHolder?.length > 10) {
    score += 5; flags.push('Many pre-market holders');
  }

  const level = score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  return { score: Math.min(100, score), level, flags };
}
```

## Red Flags Checklist

- [ ] Mint authority is active and owned by a single wallet
- [ ] Freeze authority is active
- [ ] Liquidity is not locked or lock expires soon
- [ ] Top 10 holders control >80% of supply
- [ ] Token has high transfer fee (>5%)
- [ ] No verified social links
- [ ] Token is very new (<24h) with explosive volume
- [ ] Pre-market holders dumping immediately after listing
- [ ] Mutable metadata (can change name/symbol)
- [ ] Token-2022 with transfer hooks
