---
name: birdeye-research-assistant
description: Generate token research reports, wallet intelligence briefs, and market analysis notes by composing Birdeye domain skills — market-data, token-discovery, security-analysis, holder-analysis, wallet-intelligence, and smart-money.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
  type: workflow
---

# Birdeye Research Assistant — Reports & Briefs

You are an expert at generating comprehensive research reports and intelligence briefs using multiple Birdeye domain skills. This workflow skill orchestrates data from across all Birdeye domains to produce structured analysis.

## When To Use

- User wants a **token research report** (full analysis of a token)
- User wants a **wallet intelligence brief** (deep dive into a wallet)
- User wants a **market overview** or **sector analysis**
- User wants to **compare tokens** side by side
- User wants a **due diligence report** before investing

## Skills Used

| Skill | Purpose |
|---|---|
| `birdeye-market-data` | Price, volume, liquidity, historical data |
| `birdeye-token-discovery` | Token metadata, trending, creation info |
| `birdeye-security-analysis` | Risk assessment, contract safety |
| `birdeye-holder-analysis` | Holder distribution, concentration |
| `birdeye-wallet-intelligence` | Wallet PnL, portfolio, top traders |
| `birdeye-smart-money` | Smart money signals, whale activity |
| `birdeye-transaction-flow` | Trade history, flow analysis |

> ⚠️ Key fields in operation maps are hints only — verify via docs before parsing responses. Report templates below reference response fields illustratively — verify actual field names via docs before use.
## Report Type 1: Token Research Brief

### Data Collection Order

```
1. birdeye-token-discovery → GET /defi/v3-search (resolve token)
2. birdeye-token-discovery → GET /defi-token_creation_info (creation details)
3. birdeye-market-data → GET /defi/token_overview (comprehensive stats)
4. birdeye-market-data → GET /defi/v3-ohlcv (price chart data)
5. birdeye-security-analysis → GET /defi-token_security (risk assessment)
6. birdeye-holder-analysis → GET /defi/v3-token-holder (top holders)
7. birdeye-holder-analysis → GET /holder-v1-distribution (distribution)
8. birdeye-smart-money → cross-reference with smart money list
9. birdeye-wallet-intelligence → GET /defi-v2-tokens-top_traders (top traders)
10. birdeye-market-data → GET /defi/v3-all-time-trades-single (alltime data)
```

### Output Format

```markdown
# Token Research Brief: {SYMBOL} ({NAME})

**Address**: `{address}`
**Chain**: {chain}
**Generated**: {timestamp}

## Overview
- **Price**: ${price} ({priceChange24h}% 24h)
- **Market Cap**: ${marketCap}
- **FDV**: ${fdv}
- **Liquidity**: ${liquidity}
- **Volume (24h)**: ${volume24h}
- **Created**: {creationDate}
- **Deployer**: `{deployer}`

## Price Analysis
- 1h: {priceChange1h}% | 4h: {priceChange4h}% | 24h: {priceChange24h}%
- 24h High/Low: ${high} / ${low}
- All-time volume: ${allTimeVolume}

## Security Assessment
- **Risk Level**: {LOW/MEDIUM/HIGH/CRITICAL}
- Mint Authority: {status}
- Freeze Authority: {status}
- Liquidity Lock: {locked}% until {expiry}
- Transfer Fee: {status}
- **Flags**: {list of risk flags}

## Holder Analysis
- **Total Holders**: {holderCount}
- **Top 10 Concentration**: {top10Pct}%
- **Distribution Health**: {score}/100

### Top 5 Holders
| Rank | Address | Balance | % Supply |
|------|---------|---------|----------|
| 1 | {addr} | {balance} | {pct}% |
...

## Smart Money Activity
- **Signal**: {accumulation/distribution/neutral}
- **Smart Wallets**: {count}
- **Net Volume**: ${netVolume}

## Top Traders
| Wallet | PnL | Volume | Win Rate |
|--------|-----|--------|----------|
| {addr} | ${pnl} | ${vol} | {wr}% |
...

## Trading Activity
- 24h Trades: {tradeCount}
- 24h Unique Wallets: {uniqueWallets}
- Buy/Sell Ratio: {buyCount}/{sellCount}

## Verdict
{AI-generated summary based on all data points}

## Caveats
- {data limitations}
- {assumptions made}
```

## Report Type 2: Wallet Intelligence Brief

### Data Collection Order

```
1. birdeye-wallet-intelligence → GET /wallet-v2-current-net-worth
2. birdeye-wallet-intelligence → GET /wallet-v2-net-worth-details
3. birdeye-wallet-intelligence → GET /wallet-v2-pnl-summary
4. birdeye-wallet-intelligence → GET /wallet-v2-pnl (per-token PnL)
5. birdeye-wallet-intelligence → POST /wallet-v2-tx-first-funded
6. birdeye-transaction-flow → GET /trader-txs-seek_by_time (recent trades)
7. birdeye-smart-money → check if wallet is in smart money lists
8. For top holdings: birdeye-security-analysis → security check each
```

### Output Format

```markdown
# Wallet Intelligence Brief

**Address**: `{wallet}`
**Chain**: {chain}
**Generated**: {timestamp}

## Portfolio Summary
- **Total Value**: ${totalUsd}
- **Native Balance**: {nativeBalance} ({nativeSymbol})
- **Token Count**: {tokenCount}
- **NFT Count**: {nftCount}

## Performance
- **Total PnL**: ${totalPnl} ({totalPnlPct}%)
- **Realized**: ${realized}
- **Unrealized**: ${unrealized}
- **Win Rate**: {winRate}%
- **Total Trades**: {tradeCount}

## Top Holdings
| Token | Balance | Value | % Portfolio | 24h Change |
|-------|---------|-------|-------------|------------|
...

## Best/Worst Trades
| Token | PnL | Entry | Exit | ROI |
|-------|-----|-------|------|-----|
...

## Activity Pattern
- **First Funded**: {date} by `{funderWallet}`
- **Last Active**: {date}
- **Trade Frequency**: {frequency}
- **Smart Money**: {yes/no}

## Recent Activity
| Time | Token | Side | Amount | USD Value |
|------|-------|------|--------|-----------|
...

## Risk Assessment
- Portfolio concentration: {topHoldingPct}% in largest position
- High-risk tokens: {count}
- Low-liquidity tokens: {count}
```

## Report Type 3: Token Comparison

### Data Collection
For each token:
```
birdeye-market-data → token_overview
birdeye-security-analysis → token_security
birdeye-holder-analysis → v3-token-holder
birdeye-smart-money → cross-reference
```

### Output Format

```markdown
# Token Comparison: {TOKEN_A} vs {TOKEN_B}

| Metric | {SYMBOL_A} | {SYMBOL_B} |
|--------|-----------|-----------|
| Price | ${priceA} | ${priceB} |
| Market Cap | ${mcapA} | ${mcapB} |
| Volume 24h | ${volA} | ${volB} |
| Liquidity | ${liqA} | ${liqB} |
| Holders | {holdersA} | {holdersB} |
| Top 10 Conc. | {concA}% | {concB}% |
| Risk Level | {riskA} | {riskB} |
| Smart Money | {signalA} | {signalB} |
| 24h Change | {changeA}% | {changeB}% |

## Analysis
{comparative analysis}
```

## CU Budget by Report Type

| Report Type | Est. API Calls | Est. Total CU |
|---|---|---|
| Token Brief | 10-12 calls | ~300-400 |
| Wallet Brief | 8-10 calls | ~400-600 |
| Token Comparison (2 tokens) | 8-10 calls | ~250-350 |
| Market Overview (top 20 tokens) | 25-30 calls | ~1,500-2,000 |

## Rate Limit Strategy

1. **Sequential calls**: Make API calls one at a time, not in parallel (respecting rate limits).
2. **Wallet data first**: If report includes wallet data, prioritize those calls (30 rpm limit).
3. **Cache shared data**: If comparing tokens, fetch shared data (smart money list) once.
4. **Graceful degradation**: If a call fails, include what data you have and note the missing section.
