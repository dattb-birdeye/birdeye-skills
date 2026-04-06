# Wallet Intelligence — Operation Map

## Net Worth

### GET /wallet-v2-current-net-worth
Real-time portfolio valuation.

**CU Cost**: 60 | **Docs**: https://docs.birdeye.so/reference/get-wallet-v2-current-net-worth

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |

**Key fields**: `data.{ wallet, totalUsd, solBalance, solUsdValue, tokenCount, nftCount, updateTime }`

### GET /wallet-v2-net-worth
Historical net worth chart data.

**CU Cost**: 60 | **Docs**: https://docs.birdeye.so/reference/get-wallet-v2-net-worth

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |
| `time_from` | number | No | Start Unix timestamp |
| `time_to` | number | No | End Unix timestamp |

**Key fields**: `data.items[]` → `{ unixTime, totalUsd, solValue, tokenValue, nftValue }`

### GET /wallet-v2-net-worth-details
Granular holding breakdown.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-net-worth-details

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |

**Key fields**: Detailed list of each token holding with amount, price, USD value, and percentage of portfolio.

### POST /wallet-v2-net-worth-summary-multiple
Batch portfolio values for multiple wallets.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-net-worth-summary-multiple

**Body**: `{ "wallets": ["wallet1", "wallet2", "wallet3"] }`

---

## PnL (Profit & Loss)

### GET /wallet-v2-pnl-summary
Overall PnL summary for a wallet.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-pnl-summary

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |

**Key fields**: `data.{ wallet, totalPnl, totalPnlPercent, totalInvested, totalRealized, totalUnrealized, winRate, totalTrades }`

### POST /wallet-v2-pnl-details
Detailed gain/loss per trade.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-pnl-details

**Body**: `{ "wallet": "wallet_address" }`

**Key fields**: List of individual trades with entry/exit prices, PnL per trade, timestamps.

### GET /wallet-v2-pnl
PnL breakdown per token.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-pnl

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |
| `token_address` | string | No | Filter by specific token |

**Key fields**: Per-token `{ tokenAddress, symbol, buyVolume, sellVolume, avgBuyPrice, avgSellPrice, realizedPnl, unrealizedPnl, totalPnl, pnlPercent }`

### GET /wallet-v2-pnl-multiple
Compare PnL across multiple wallets.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-pnl-multiple

| Param | Type | Required | Description |
|---|---|---|---|
| `wallets` | string | Yes | Comma-separated wallet addresses |

---

## Top Traders

### GET /defi-v2-tokens-top_traders
Leading traders for a specific token.

**CU Cost**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-v2-tokens-top_traders

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `time_frame` | string | No | `24h`, `7d`, `30d` |
| `sort_by` | string | No | `volume`, `pnl`, `trade_count` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

**Key fields**: `data.items[]` → `{ wallet, pnl, volume, tradeCount, buyVolume, sellVolume, tags }`

### GET /trader-gainers-losers
Top performing and worst-performing traders.

**Docs**: https://docs.birdeye.so/reference/get-trader-gainers-losers

| Param | Type | Required | Description |
|---|---|---|---|
| `time_frame` | string | No | `24h`, `7d`, `30d` |
| `type` | string | No | `gainers`, `losers` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

---

## Wallet History

### POST /wallet-v2-tx-first-funded
First funding transaction for a wallet.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-tx-first-funded

**Body**: `{ "wallet": "wallet_address" }`

**Key fields**: Details of the first transaction that funded the wallet (useful for wallet provenance tracking).

### GET /v1-wallet-tx_list (Beta)
Complete transaction history.

**CU Cost**: 150 | **Docs**: https://docs.birdeye.so/reference/get-v1-wallet-tx_list

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |
| `before_time` | number | No | End Unix timestamp |
| `after_time` | number | No | Start Unix timestamp |
| `limit` | number | No | Max results |

### GET /v1-wallet-token_list (Beta)
Current holdings inventory.

**CU Cost**: 100 | **Docs**: https://docs.birdeye.so/reference/get-v1-wallet-token_list

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |

### GET /v1-wallet-list_supported_chain
Supported chains for wallet APIs.

**Docs**: https://docs.birdeye.so/reference/get-v1-wallet-list_supported_chain

**Key fields**: `data` → list of chain identifiers.
