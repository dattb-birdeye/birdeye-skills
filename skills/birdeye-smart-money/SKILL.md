---
name: birdeye-smart-money
description: Track smart money wallets, whale activity, and smart money token flows via Birdeye API. Covers the Smart Money endpoint group.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Smart Money — Whale & Smart Wallet Tracking

You are an expert at tracking smart money activity using Birdeye APIs. This skill covers smart money wallet identification, their token holdings, and trading signals.

> `X-API-KEY` header required | `x-chain` header (default: `solana`) | Base: `https://public-api.birdeye.so`

## Use This Skill vs Others

**Tokens that the curated smart-money cohort is buying/selling, ranked by net flow.** Output is a token leaderboard.
- vs `birdeye-wallet-intelligence` → that analyzes **a specific wallet** (PnL, portfolio). This skill works at the cohort level — there's no "is wallet X smart money?" endpoint; cross-reference holdings instead.
- vs `birdeye-holder-analysis` → that segments **holders of one token**. Note `holder-positions?labels=smart_trader` returns smart-trader wallets for a single token; this skill returns tokens across the whole cohort.
- vs `birdeye-token-discovery` → use this when ranking criterion is **smart money flow**, not generic volume/liquidity.

## Routing

| Intent | Reference |
|---|---|
| Smart money token list | `references/operation-map.md` → Smart Money Token List |
| Smart money signal interpretation | `references/signal-patterns.md` |
| Which endpoint to use for your intent | `references/endpoint-playbook.md` |
| Copy-paste curl/fetch examples | `references/request-templates.md` |
| Common issues | `references/caveats.md` |
| Exact endpoint params, chain support, curl | `birdeye-indexer` skill → `references/canonical-endpoint-dictionary.md` |

## Rules

### Primary Endpoint
- `GET /smart-money/v1/token/list` — tokens being accumulated/distributed by smart money wallets

### What is "Smart Money"?
Birdeye classifies wallets as "smart money" based on:
- Historical trading performance (consistent profitability)
- Portfolio size (whale wallets with significant capital)
- Trading patterns (early entry into successful tokens)
- On-chain behavior analysis

### Signal Interpretation

**Accumulation Signal** (Bullish):
- Multiple smart money wallets buying the same token
- Increasing smart money holdings over time
- Smart money buying while retail is selling

**Distribution Signal** (Bearish):
- Smart money wallets selling a token
- Decreasing smart money holdings
- Smart money selling while retail is buying

### Integration with Other Skills
- Combine with `birdeye-wallet-intelligence` for deep-dive into specific smart money wallets
- Combine with `birdeye-market-data` for price/volume context around smart money moves
- Combine with `birdeye-token-discovery` to find tokens where smart money is early
- Combine with `birdeye-holder-analysis` to see smart money's share of total holders
