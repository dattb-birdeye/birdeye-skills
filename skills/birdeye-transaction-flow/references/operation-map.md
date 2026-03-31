# Transaction Flow — Operation Map

All responses are wrapped in `{ "data": { ... }, "success": true }`.

> **IMPORTANT**: Key fields listed below are approximate hints only — they may contain inaccurate field names. **ALWAYS WebFetch the Docs URL** for each endpoint to get the actual response schema before writing code that parses API responses. Do NOT trust key field hints as authoritative.

## Token Trades

### GET /defi/v3-token-txs (Recommended)
Trades for a specific token with advanced filters.

**CU Cost**: 20 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-txs

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `tx_type` | string | No | `swap`, `add`, `remove` (trade type filter) |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Pagination offset |
| `limit` | number | No | Results per page (max 50) |

**Key fields**: `data.items[]` → `{ txHash, blockUnixTime, source, owner, from: { address, symbol, amount, uiAmount, price }, to: { ... }, volumeUSD, side }`, `data.hasNext`

### GET /defi/v3-token-txs-by-volume
Trades filtered by minimum volume.

**CU Cost**: Dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-txs-by-volume

Same params as v3-token-txs, plus:
| Param | Type | Required | Description |
|---|---|---|---|
| `min_volume` | number | No | Minimum trade volume in USD |

### GET /defi/txs-token (Legacy)
Legacy token trades endpoint.

**CU Cost**: 10 | **Docs**: https://docs.birdeye.so/reference/get-defi-txs-token

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `tx_type` | string | No | `swap`, `add`, `remove` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

### GET /defi/txs-token-seek_by_time
Token trades within a time range.

**CU Cost**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-txs-token-seek_by_time

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `before_time` | number | No | End Unix timestamp |
| `after_time` | number | No | Start Unix timestamp |
| `tx_type` | string | No | Trade type filter |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

---

## Pair Trades

### GET /defi/txs-pair
Trades for a specific trading pair.

**CU Cost**: 10 | **Docs**: https://docs.birdeye.so/reference/get-defi-txs-pair

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Pair address |
| `tx_type` | string | No | `swap`, `add`, `remove` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

### GET /defi/txs-pair-seek_by_time
Pair trades within a time range.

**CU Cost**: 15 | **Docs**: https://docs.birdeye.so/reference/get-defi-txs-pair-seek_by_time

Same params as txs-pair, plus `before_time`, `after_time`.

---

## All Trades

### GET /defi/v3-txs
All trades across the chain with filters.

**CU Cost**: 25 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-txs

| Param | Type | Required | Description |
|---|---|---|---|
| `tx_type` | string | No | `swap`, `add`, `remove` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

### GET /defi/v3-txs-recent
Most recent trades on the chain.

**CU Cost**: Dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-txs-recent

Similar params to v3-txs with limit.

---

## Mint/Burn

### GET /defi/v3-token-mint-burn-txs
Mint and burn transaction history for a token.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-mint-burn-txs

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Token address |
| `tx_type` | string | No | `mint`, `burn` |
| `sort_type` | string | No | `asc`, `desc` |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

**Key fields**: `data.items[]` → `{ txHash, blockUnixTime, type, amount, uiAmount, decimals, authority }`

---

## Trader Trades

### GET /trader-txs-seek_by_time
Trades by a specific wallet/trader within a time range.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/get-trader-txs-seek_by_time

| Param | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Wallet address |
| `before_time` | number | No | End Unix timestamp |
| `after_time` | number | No | Start Unix timestamp |
| `tx_type` | string | No | Trade type |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

---

## Balance & Transfer

### GET /wallet-v2-balance-change
Wallet balance changes over time.

**CU Cost**: 20 | **Docs**: https://docs.birdeye.so/reference/get-wallet-v2-balance-change

| Param | Type | Required | Description |
|---|---|---|---|
| `wallet` | string | Yes | Wallet address |
| `token_address` | string | No | Filter by token |
| `offset` | number | No | Offset |
| `limit` | number | No | Max results |

**Key fields**: `data.items[]` → `{ address, symbol, name, decimals, logoURI, amount, uiAmount, changeType, blockUnixTime, txHash }`

### POST /wallet-v2-token-balance
Current token balances for a wallet.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/post-wallet-v2-token-balance

**Body**: `{ "wallet": "wallet_address", "token_list": ["token_addr_1", "token_addr_2"] }`

### POST /token-v1-transfer
Token transfer history.

**CU Cost**: Variable | **Docs**: https://docs.birdeye.so/reference/post-token-v1-transfer

**Body**: `{ "address": "token_address", "offset": 0, "limit": 50 }`

**Key fields**: `data.items[]` → `{ txHash, blockUnixTime, from, to, tokenAddress, symbol, amount, uiAmount, valueUSD }`

### POST /token-v1-transfer-total
Aggregated transfer volumes.

**Docs**: https://docs.birdeye.so/reference/post-token-v1-transfer-total

**Body**: Same as token-v1-transfer.

**Key fields**: `data.{ totalTransfers, totalVolumeUSD, uniqueSenders, uniqueReceivers }`

### POST /wallet-v2-transfer
Wallet-centric transfer history.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-transfer

**Body**: `{ "wallet": "wallet_address", "offset": 0, "limit": 50 }`

### POST /wallet-v2-transfer-total
Wallet transfer summary.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-transfer-total

**Body**: Same as wallet-v2-transfer.

### GET /v1-wallet-token_balance (Beta)
Legacy wallet token balance endpoint.

**Docs**: https://docs.birdeye.so/reference/get-v1-wallet-token_balance

---

## Blockchain State

### GET /defi/v3-txs-latest-block
Current latest block number.

**CU Cost**: 5 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-txs-latest-block

**Key fields**: `data.{ block, unixTime }`

### GET /defi-networks
List of supported blockchain networks.

**CU Cost**: 1 | **Docs**: https://docs.birdeye.so/reference/get-defi-networks

**Key fields**: `data` → array of chain names `["solana", "ethereum", "bsc", ...]`
