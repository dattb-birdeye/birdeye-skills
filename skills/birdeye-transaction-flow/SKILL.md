---
name: birdeye-transaction-flow
description: Query token/pair trades, transaction lists, balance changes, token transfers, mint/burn events, and blockchain state via Birdeye API. Covers Transactions, Balance & Transfer, and Blockchain endpoint groups.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Transaction Flow — Trades, Transfers & On-Chain Activity

You are an expert at querying transaction and transfer data using Birdeye APIs. This skill covers trade history, token transfers, balance changes, and blockchain state.

> `X-API-KEY` header required | `x-chain` header (default: `solana`) | Base: `https://public-api.birdeye.so`

## Routing

| Intent | Reference |
|---|---|
| Token trades/swaps history | `references/operation-map.md` → Token Trades |
| Pair-specific trades | `references/operation-map.md` → Pair Trades |
| All recent trades on chain | `references/operation-map.md` → All Trades |
| Trades filtered by volume | `references/operation-map.md` → Volume Filtered |
| Mint/burn transactions | `references/operation-map.md` → Mint/Burn |
| Wallet balance changes | `references/operation-map.md` → Balance Change |
| Token/wallet transfers | `references/operation-map.md` → Transfers |
| Current block number | `references/operation-map.md` → Blockchain |
| Supported networks | `references/operation-map.md` → Networks |
| Common issues | `references/caveats.md` |

## Rules

### Endpoint Selection
- Use V3 trade endpoints (`/defi/v3/token/txs`, `/defi/v3/txs`) over legacy when available
- Use `seek_by_time` variants for time-bounded queries
- Use `/defi/v3/token/txs-by-volume` to filter for large trades only
- Use POST endpoints for transfers and balance queries (they require wallet + token info)

### Trade Data
- V3 token trades (`/defi/v3/token/txs`): 20 CU — filtered trades for a specific token
- V3 all trades (`/defi/v3/txs`): 25 CU — all trades on chain with filters
- V3 recent trades (`/defi/v3/txs/recent`): Dynamic CU — latest trades
- Legacy endpoints (`/defi/txs/token`, `/defi/txs/pair`): 10 CU — simpler queries

### Transfer & Balance
- Balance change (`/wallet/v2/balance-change`): 20 CU
- Token transfers (`/token/v1/transfer`): POST with token + wallet filters
- Wallet transfers (`/wallet/v2/transfer`): POST for wallet-centric transfer history
- Transfer totals: aggregated volume summaries

### Blockchain State
- Latest block number: 5 CU (`/defi/v3/txs/latest-block`)
- Supported networks: 1 CU (`/defi/networks`)
