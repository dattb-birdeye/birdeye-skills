# Wallet Intelligence — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Portfolio and net worth

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Current total portfolio value | `GET /wallet/v2/current-net-worth` | 60 | Returns single `totalUsd` value with SOL and token breakdown |
| Token-by-token portfolio breakdown | `GET /wallet/v2/net-worth-details` | — | Detailed list of every holding with price and USD value |
| Net worth history chart | `GET /wallet/v2/net-worth` | 60 | Historical chart data; params: `count` (points), `direction` (`back`/`forward`), `time` (anchor Unix ts), `type` (`1h`/`1d`) |
| Compare portfolio values across wallets | `POST /wallet/v2/net-worth-summary/multiple` | — | Body: `{ "wallets": [...] }` — max batch per call |
| Current token holdings inventory | `GET /v1/wallet/token_list` (Beta) | 100 | Raw token list with balances |

## PnL (Profit & Loss)

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Overall win rate, total PnL, realized vs unrealized | `GET /wallet/v2/pnl/summary` | — | Best starting point for PnL analysis |
| PnL breakdown by token | `GET /wallet/v2/pnl` | — | Requires `token_addresses` (required, comma-separated) |
| Per-trade entry/exit detail | `POST /wallet/v2/pnl/details` | — | Most granular PnL view; Body: `{ "wallet": "..." }` |
| Compare PnL across multiple wallets | `GET /wallet/v2/pnl/multiple` | — | `wallets` param: comma-separated addresses |

## Top traders

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Best traders for a specific token | `GET /defi/v2/tokens/top_traders` | 30 | Requires `address`, `time_frame`, `sort_by`, `sort_type` (all required) |
| Top PnL performers today / this week | `GET /trader/gainers-losers` | — | `type` required: `today`, `yesterday`, `1W`; `sort_by=PnL` required |

## Transaction history

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Full transaction history | `GET /v1/wallet/tx_list` (Beta) | 150 | Expensive. Use `before_time`/`after_time` to scope the range |
| First funding transaction (wallet age) | `POST /wallet/v2/tx/first-funded` | — | Body: `{ "wallet": "..." }` |
| Supported chains for wallet API | `GET /v1/wallet/list_supported_chain` | — | Run once and cache |

## Selection heuristics

- **"What is this wallet worth?"** → `/wallet/v2/current-net-worth` (single call, 60 CU)
- **"What tokens does this wallet hold?"** → `/wallet/v2/net-worth-details` (includes USD values per token)
- **"How has this wallet performed?"** → `/wallet/v2/pnl/summary` first, then `/wallet/v2/pnl` for per-token detail
- **"Per-trade PnL"** → `/wallet/v2/pnl/details` (POST)
- **"Comparing multiple wallets"** → `/wallet/v2/net-worth-summary/multiple` + `/wallet/v2/pnl/multiple`
- **"Who are the best traders on this token?"** → `/defi/v2/tokens/top_traders` (sort_by=`volume` or `trade`)
- **"Who made the most profit today?"** → `/trader/gainers-losers` with `type=today`
- **"How old is this wallet?"** → `/wallet/v2/tx/first-funded`
- **Wallet rate limit**: 30 RPM — sequence calls or cache aggressively; use WebSocket for real-time
