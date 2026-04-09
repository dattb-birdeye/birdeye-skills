# Smart Money — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Smart money token flows

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Tokens smart money is actively trading | `GET /smart-money/v1/token/list` | Variable | Core endpoint. Sort and filter to find signals |
| Tokens being accumulated (net buy) | `GET /smart-money/v1/token/list` | Variable | `sort_by=net_flow&sort_type=desc` — most positive net flow first |
| Tokens being distributed (net sell) | `GET /smart-money/v1/token/list` | Variable | `sort_by=net_flow&sort_type=asc` — most negative net flow first |
| Tokens by smart trader count | `GET /smart-money/v1/token/list` | Variable | `sort_by=smart_traders_no` — tokens with most smart wallets active |
| Filter by trader style | `GET /smart-money/v1/token/list` | Variable | `trader_style=risk_averse\|risk_balancers\|trenchers\|all` |
| Different time windows | `GET /smart-money/v1/token/list` | Variable | `interval=1d\|7d\|30d` |

## Downstream analysis

| Intent | Endpoint / Skill |
|---|---|
| What is this smart wallet actually holding? | `birdeye-wallet-intelligence → /wallet/v2/net-worth-details` |
| What has this smart wallet been trading? | `birdeye-transaction-flow → /trader/txs/seek_by_time` |
| Monitor smart wallet live | `birdeye-realtime-streams → SUBSCRIBE_WALLET_TXS` |
| Is the token itself safe? | `birdeye-security-analysis → /defi/token_security` |

## Selection heuristics

- **One endpoint covers all smart money token queries** — all use `/smart-money/v1/token/list` with different params
- **Accumulation signal** → `sort_by=net_flow&sort_type=desc` + filter `netFlow > 0` in response
- **Distribution signal** → `sort_by=net_flow&sort_type=asc` + filter `netFlow < 0` in response
- **Signal strength** → `sort_by=smart_traders_no` — more wallets = higher conviction
- **Time frame selection**: `1d` for recent activity, `7d` for trend confirmation, `30d` for sustained moves
- **Trader style**: `risk_averse` wallets hold longer and trade less — strongest signal; `trenchers` are momentum traders
- **Always cross-check**: A smart money signal on an unsafe token is a trap. Run `/defi/token_security` before acting
