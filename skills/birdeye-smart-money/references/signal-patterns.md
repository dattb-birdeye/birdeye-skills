# Smart Money — Signal Patterns

## Accumulation Signals (Bullish)

### Strong Accumulation
- `smartNetVolume` >> 0 (large positive)
- `smartWalletCount` >= 5 (multiple wallets, not just one)
- `smartBuyCount` >> `smartSellCount`
- Price hasn't pumped significantly yet
- Liquidity is sufficient for the volume

**Action**: This is a potential early entry signal. Verify with security analysis before acting.

### Gradual Accumulation
- Consistent positive `smartNetVolume` across multiple time frames (24h, 7d)
- Wallet count gradually increasing
- Volume is moderate, not explosive

**Action**: Higher conviction signal. Smart money is building a position over time.

### Contrarian Accumulation
- Smart money buying while price is declining
- Retail selling (check `volume24h` vs `smartBuyVolume` ratio)
- Smart money percentage of volume increasing

**Action**: Potential bottom signal. Smart money buying the dip while weak hands sell.

## Distribution Signals (Bearish)

### Active Distribution
- `smartNetVolume` << 0 (large negative)
- Multiple smart wallets selling
- Price may still be rising (distribution into strength)

**Action**: Warning signal. Smart money taking profits or exiting.

### Dump After Accumulation
- Previously positive `smartNetVolume` now turning negative
- Smart buy wallet count decreasing
- Volume spiking with selling

**Action**: Strong sell signal. Smart money completed their thesis or sees risk.

## Neutral / Noise

### Low Activity
- `smartWalletCount` < 3
- Low `smartNetVolume` (close to zero)
- Few transactions

**Action**: Not enough signal. Don't over-interpret.

### Balanced Flow
- `smartBuyVolume` ≈ `smartSellVolume`
- Multiple wallets on both sides

**Action**: Market making or rotation. Not directional.

## Signal Strength Framework

Use the API response fields to derive a signal. WebFetch the Docs URL in `operation-map.md` for the full response schema before implementing.

```typescript
function assessSignal(token: any): { direction: string; strength: string; confidence: number; reasons: string[] } {
  const netRatio = token.smartNetVolume / (token.smartBuyVolume + token.smartSellVolume || 1);
  const walletCount = token.smartWalletCount;
  const buyRatio = token.smartBuyCount / (token.smartBuyCount + token.smartSellCount || 1);

  let direction: 'bullish' | 'bearish' | 'neutral';
  let strength: 'strong' | 'moderate' | 'weak';
  const reasons: string[] = [];

  // Direction
  if (netRatio > 0.3) {
    direction = 'bullish';
    reasons.push(`Net volume strongly positive (${(netRatio * 100).toFixed(0)}% net buy)`);
  } else if (netRatio < -0.3) {
    direction = 'bearish';
    reasons.push(`Net volume strongly negative (${(netRatio * 100).toFixed(0)}% net sell)`);
  } else {
    direction = 'neutral';
    reasons.push('Balanced smart money flow');
  }

  // Strength
  if (walletCount >= 10 && Math.abs(netRatio) > 0.5) {
    strength = 'strong';
    reasons.push(`${walletCount} smart wallets involved`);
  } else if (walletCount >= 5) {
    strength = 'moderate';
    reasons.push(`${walletCount} smart wallets involved`);
  } else {
    strength = 'weak';
    reasons.push(`Only ${walletCount} smart wallet(s) — low sample`);
  }

  const confidence = Math.min(100, Math.round(
    Math.abs(netRatio) * 40 +
    Math.min(walletCount, 20) * 2 +
    (direction !== 'neutral' ? 20 : 0)
  ));

  return { direction, strength, confidence, reasons };
}
```

## Combining with Price Action

| Smart Money | Price Action | Interpretation |
|---|---|---|
| Accumulating | Declining | Potential bottom / contrarian buy |
| Accumulating | Rising | Momentum confirmation |
| Accumulating | Flat | Silent accumulation before move |
| Distributing | Rising | Distribution into strength — top signal |
| Distributing | Declining | Confirmation of downtrend |
| Distributing | Flat | Loss of interest |
