---
name: birdeye-wallet-intelligence
description: Analyze wallet portfolios, net worth, PnL (profit/loss), top traders, transaction history, and wallet comparisons via Birdeye API. Covers Wallet, Networth & PnL endpoint groups.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Wallet Intelligence — Portfolio, PnL & Wallet Analysis

You are an expert at analyzing wallets using Birdeye APIs. This skill covers portfolio valuation, profit/loss tracking, top trader analysis, and wallet history.

> `X-API-KEY` header required | `x-chain` header (default: `solana`) | Base: `https://public-api.birdeye.so` | ⚠️ Wallet API: **30 rpm hard limit** on all tiers

## Routing

| Intent | Reference |
|---|---|
| Wallet portfolio, current holdings | `references/operation-map.md` → Net Worth |
| Historical net worth chart | `references/operation-map.md` → Net Worth Chart |
| PnL summary, profit/loss | `references/operation-map.md` → PnL |
| Per-token PnL breakdown | `references/operation-map.md` → PnL Per Token |
| Compare multiple wallets | `references/operation-map.md` → Multi-Wallet |
| Top traders for a token | `references/operation-map.md` → Top Traders |
| Top gainers/losers | `references/operation-map.md` → Gainers/Losers |
| First funding transaction | `references/operation-map.md` → First Funded |
| Wallet tx history | `references/operation-map.md` → Tx History |
| Wallet token list | `references/operation-map.md` → Portfolio |
| Common issues | `references/caveats.md` |

## Rules

### Portfolio Analysis
- Use `GET /wallet-v2-current-net-worth` for real-time portfolio valuation (60 CU)
- Use `GET /wallet-v2-net-worth` for historical net worth charting (60 CU)
- Use `GET /wallet-v2-net-worth-details` for granular holding breakdown
- Use `POST /wallet-v2-net-worth-summary-multiple` for batch portfolio values

### PnL Analysis
- `GET /wallet-v2-pnl-summary` — overall PnL summary
- `POST /wallet-v2-pnl-details` — detailed gain/loss per trade
- `GET /wallet-v2-pnl` — PnL per token
- `GET /wallet-v2-pnl-multiple` — compare PnL across wallets

### Trader Intelligence
- `GET /defi-v2-tokens-top_traders` — top traders for a specific token (30 CU)
- `GET /trader-gainers-losers` — top performing and worst-performing traders
- `POST /wallet-v2-tx-first-funded` — find who originally funded a wallet

### Beta Endpoints
- `GET /v1-wallet-tx_list` — complete transaction history (150 CU — expensive)
- `GET /v1-wallet-token_list` — current holdings inventory (100 CU)
- These are beta and may change. Use the V2 endpoints when possible.

### CU Optimization
- Net worth endpoints cost 60 CU each — don't poll frequently
- Wallet tx history costs 150 CU — cache results
- Top traders: 30 CU — reasonable for periodic queries
- Use `wallet-v2-pnl` (per-token) instead of `wallet-v2-pnl-details` when you only need summary PnL per token
