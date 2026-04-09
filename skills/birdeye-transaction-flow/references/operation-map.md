# Transaction Flow — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.

---

## Token Trades

### GET /defi/v3/token/txs
Trades for a token with rich filtering. All chains. Preferred over legacy endpoints.

**CU**: 20 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-txs

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/txs?address=<TOKEN>&tx_type=swap&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { txHash, blockUnixTime, source, owner, from: { address, symbol, amount, uiAmount, price }, to: { ... }, volumeUSD, side }`, `data.hasNext`

---

### GET /defi/v3/token/txs-by-volume
Trades filtered by minimum/maximum volume. `token_address`, `volume_type`, and `sort_type` are all required.

**CU**: dynamic | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-txs-by-volume

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/txs-by-volume?token_address=<TOKEN>&volume_type=usd&min_volume=10000&sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: same shape as v3/token/txs

---

## Pair Trades

### GET /defi/txs/pair
Trades for a specific DEX pool/pair address.

**CU**: 10 | **Docs**: https://docs.birdeye.so/reference/get-defi-txs-pair

```bash
curl -sS "https://public-api.birdeye.so/defi/txs/pair?address=<PAIR>&tx_type=swap&sort_type=desc&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: list of swap transactions for the pair

---

## All Trades

### GET /defi/v3/txs
All trades across the chain with filters (firehose).

**CU**: 25 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-txs

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/txs?tx_type=swap&sort_type=desc&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Trader Trades

### GET /trader/txs/seek_by_time
All trades by a specific wallet in a time range.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-trader-txs-seek_by_time

```bash
curl -sS "https://public-api.birdeye.so/trader/txs/seek_by_time?address=<WALLET>&after_time=<TS>&before_time=<TS>&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Mint / Burn

### GET /defi/v3/token/mint-burn-txs
Mint and burn events for a token. `address`, `sort_by`, `sort_type`, `type` are all required.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-token-mint-burn-txs

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/mint-burn-txs?address=<TOKEN>&type=mint&sort_by=block_time&sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { txHash, blockUnixTime, type, amount, uiAmount, decimals, authority }`

---

## Balance & Transfer

### GET /wallet/v2/balance-change
Per-token balance changes for a wallet. Required param is `address` (not `wallet`).

**CU**: 20 | **Docs**: https://docs.birdeye.so/reference/get-wallet-v2-balance-change

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/balance-change?address=<WALLET>&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { address, symbol, name, decimals, logoURI, amount, uiAmount, changeType, blockUnixTime, txHash }`

---

### POST /wallet/v2/token-balance
Current token balances for a wallet.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/post-wallet-v2-token-balance

```bash
curl -sS -X POST "https://public-api.birdeye.so/wallet/v2/token-balance" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"wallet": "<WALLET>", "token_list": ["<TOKEN1>", "<TOKEN2>"]}'
```

---

### POST /token/v1/transfer
Token transfer history.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/post-token-v1-transfer

```bash
curl -sS -X POST "https://public-api.birdeye.so/token/v1/transfer" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"address": "<TOKEN>", "offset": 0, "limit": 50}'
```

**Response**: `data.items[] → { txHash, blockUnixTime, from, to, tokenAddress, symbol, amount, uiAmount, valueUSD }`

---

### POST /wallet/v2/transfer
Wallet-centric transfer history.

**CU**: variable | **Docs**: https://docs.birdeye.so/reference/post-wallet-v2-transfer

```bash
curl -sS -X POST "https://public-api.birdeye.so/wallet/v2/transfer" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"wallet": "<WALLET>", "offset": 0, "limit": 50}'
```

---

## Blockchain State

### GET /defi/v3/txs/latest-block
Current latest block number on the chain.

**CU**: 5 | **Docs**: https://docs.birdeye.so/reference/get-defi-v3-txs-latest-block

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/txs/latest-block" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ block, unixTime }`

---

### GET /defi/networks
List of all supported blockchain networks.

**CU**: 1 | **Docs**: https://docs.birdeye.so/reference/get-defi-networks

```bash
curl -sS "https://public-api.birdeye.so/defi/networks" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "accept: application/json"
```

**Response**: `data` → array of chain names `["solana", "ethereum", "bsc", ...]`
