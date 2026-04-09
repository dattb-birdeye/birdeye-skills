# Smart Money — Caveats

## Classification Accuracy

- **"Smart money" is a label**: Birdeye's classification is based on historical performance and behavior patterns. It's not infallible.
- **Past performance ≠ future results**: A wallet classified as "smart money" based on past trades can still lose money on future trades.
- **Bot wallets**: Some "smart money" wallets are MEV bots or arbitrage bots. Their trades may not represent human conviction.

## Signal Reliability

- **Single wallet moves**: If only 1-2 smart wallets are active on a token, the signal is weak. Look for consensus (5+ wallets).
- **Wash trading**: Smart money metrics can be manipulated through wash trading between wallets. Cross-reference with holder analysis.
- **Token age matters**: Smart money signals on very new tokens (<24h) are less reliable. The classification system needs history to work.

## Volume Context

- **Relative volume**: $500K smart money volume on a $100M market cap token is noise. The same $500K on a $1M token is significant.
- **Net volume direction**: Always look at `netFlow`, not just buy or sell volume in isolation. A wallet that buys $1M and sells $900K is only net long $100K.

## Interval Selection

- **`1d`**: Most responsive but most noisy. Good for active trading.
- **`7d`**: Better balance of signal and noise. Recommended for general analysis.
- **`30d`**: Best for identifying sustained trends. May miss short-term opportunities.

## Integration Recommendations

- **Always pair with security analysis**: A smart money signal on an unsafe token is a trap, not an opportunity.
- **Check liquidity**: Smart money accumulating a token with $10K liquidity may indicate they can't actually exit.
- **Verify the smart wallets**: Use wallet-intelligence to check if the "smart money" wallets are actually profitable and active.

## Common Mistakes

- Blindly following smart money without checking token security.
- Treating a single wallet's trade as a market signal.
- Ignoring the time frame — a 24h accumulation can reverse in the next 24h.
- Not considering market context — bull market smart money behavior differs from bear market.
- Confusing MEV bot activity with intentional accumulation.
