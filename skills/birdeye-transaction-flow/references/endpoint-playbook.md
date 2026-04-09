# Transaction Flow — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Token trades

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Recent trades for a token | `GET /defi/v3/token/txs` | 20 | Recommended. Use `tx_type=buy\|sell\|swap`, `source`, `owner` to filter |
| Trades for a token by time range | `GET /defi/v3/token/txs` | 20 | Add `before_time` + `after_time` params |
| Trades above a USD volume threshold | `GET /defi/v3/token/txs-by-volume` | Dynamic | Add `min_volume` param |
| Legacy token trades | `GET /defi/txs/token` | 10 | Legacy — fewer filters; prefer V3 |
| Legacy token trades in time range | `GET /defi/txs/token/seek_by_time` | 15 | Legacy time-scoped version |

## Pair / pool trades

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Trades for a specific DEX pool | `GET /defi/txs/pair` | 10 | Address = pair/pool address, not token address |
| Pair trades in time range | `GET /defi/txs/pair/seek_by_time` | 15 | Adds `before_time`/`after_time` to pair trades |

## All trades (chain-wide)

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| All recent trades on chain | `GET /defi/v3/txs` | 25 | No token filter — chain-wide feed |
| Most recent trades (snapshot) | `GET /defi/v3/txs/recent` | Dynamic | Tail of the chain tx feed |

## Trader activity

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Trades by a specific wallet | `GET /trader/txs/seek_by_time` | Variable | Filter by `address` (wallet), scoped by time |

## Balance and transfers

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Balance changes for a wallet | `GET /wallet/v2/balance-change` | 20 | Per-token change events; filter by `token_address` |
| Current token balances for a wallet | `POST /wallet/v2/token-balance` | Variable | Body: `{ "wallet": "...", "token_list": [...] }` |
| Token transfer history | `POST /token/v1/transfer` | Variable | Body: `{ "address": "token", "offset": 0, "limit": 50 }` |
| Aggregate transfer volumes | `POST /token/v1/transfer/total` | — | Lifetime totals: count, volume, unique senders/receivers |
| Wallet transfer history | `POST /wallet/v2/transfer` | — | Wallet-centric view of transfers |
| Wallet transfer summary | `POST /wallet/v2/transfer/total` | — | Aggregate view for a wallet |

## Mint / burn

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Mint and burn events for a token | `GET /defi/v3/token/mint-burn-txs` | Variable | `type=mint\|burn\|all` to filter (required); also requires `sort_by=block_time`, `sort_type` |

## Blockchain state

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Current block number | `GET /defi/v3/txs/latest-block` | 5 | Use for `after_block_number` anchoring |
| Supported chain list | `GET /defi/networks` | 1 | Run once per session |

## Selection heuristics

- **"Show me trades for token X"** → `/defi/v3/token/txs` (add `tx_type=buy` or `sell` for direction)
- **"Show whale trades only"** → `/defi/v3/token/txs-by-volume` with `min_volume=10000`
- **"What did wallet X buy/sell?"** → `/trader/txs/seek_by_time` scoped by time
- **"Show trades on a specific Raydium pool"** → `/defi/txs/pair` with the pool address
- **"Has this token been minted recently?"** → `/defi/v3/token/mint-burn-txs` with `type=mint`
- **"What changed in this wallet's balance?"** → `/wallet/v2/balance-change` (param: `address`, not `wallet`)
- **Real-time trades** → Use `birdeye-realtime-streams` (`SUBSCRIBE_TXS` or `SUBSCRIBE_WALLET_TXS`), not polling
