# Wallet Intelligence — Operation Map

> **Params source of truth**: [`birdeye-indexer/references/canonical-endpoint-dictionary.md`](../../../birdeye-indexer/references/canonical-endpoint-dictionary.md)
> Each entry below lists: description · CU · Docs URL · minimal curl · response fields.
> ⚠️ All wallet endpoints: **30 RPM hard limit** on all tiers. Sequence calls — do not burst.

---

## Net Worth

### GET /wallet/v2/current-net-worth
Real-time total portfolio value. `wallet` and `sort_type` are required.

**CU**: 60 | **Docs**: https://docs.birdeye.so/reference/get-wallet-v2-current-net-worth

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/current-net-worth?wallet=<WALLET>&sort_type=desc" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ wallet, totalUsd, solBalance, solUsdValue, tokenCount, nftCount, updateTime }`

---

### GET /wallet/v2/net-worth
Historical net worth chart data. `wallet` and `sort_type` required. Use `count`/`direction`/`time`/`type` to scope the range — not `time_from`/`time_to`.

**CU**: 60 | **Docs**: https://docs.birdeye.so/reference/get-wallet-v2-net-worth

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/net-worth?wallet=<WALLET>&sort_type=desc&count=30&direction=back&type=1d" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { unixTime, totalUsd, solValue, tokenValue, nftValue }`

---

### GET /wallet/v2/net-worth-details
Granular token-by-token holding breakdown. `wallet` and `sort_type` required.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-net-worth-details

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/net-worth-details?wallet=<WALLET>&sort_type=desc&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: list of token holdings `{ address, symbol, amount, uiAmount, price, valueUsd, percentage }`

---

### POST /wallet/v2/net-worth-summary/multiple
Batch portfolio values for multiple wallets.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-net-worth-summary-multiple

```bash
curl -sS -X POST "https://public-api.birdeye.so/wallet/v2/net-worth-summary/multiple" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"wallets": ["<WALLET1>", "<WALLET2>"]}'
```

---

## PnL (Profit & Loss)

### GET /wallet/v2/pnl/summary
Overall win rate, total PnL, realized vs unrealized. Best starting point for PnL analysis.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-pnl-summary

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/pnl/summary?wallet=<WALLET>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.{ wallet, totalPnl, totalPnlPercent, totalInvested, totalRealized, totalUnrealized, winRate, totalTrades }`

---

### GET /wallet/v2/pnl
PnL breakdown per token. Both `wallet` and `token_addresses` are required.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-pnl

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/pnl?wallet=<WALLET>&token_addresses=<TOKEN1>,<TOKEN2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: per-token `{ tokenAddress, symbol, buyVolume, sellVolume, avgBuyPrice, avgSellPrice, realizedPnl, unrealizedPnl, totalPnl, pnlPercent }`

---

### POST /wallet/v2/pnl/details
Per-trade entry/exit detail — most granular PnL view.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-pnl-details

```bash
curl -sS -X POST "https://public-api.birdeye.so/wallet/v2/pnl/details" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"wallet": "<WALLET>"}'
```

**Response**: list of individual trades with entry/exit prices, PnL per trade, timestamps

---

### GET /wallet/v2/pnl/multiple
Compare PnL for a token across multiple wallets. Both `token_address` and `wallets` are required.

**Docs**: https://docs.birdeye.so/reference/get-wallet-v2-pnl-multiple

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/pnl/multiple?token_address=<TOKEN>&wallets=<WALLET1>,<WALLET2>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Top Traders

### GET /defi/v2/tokens/top_traders
Best traders for a specific token. `address`, `time_frame`, `sort_by`, `sort_type` all required.

**CU**: 30 | **Docs**: https://docs.birdeye.so/reference/get-defi-v2-tokens-top_traders

```bash
curl -sS "https://public-api.birdeye.so/defi/v2/tokens/top_traders?address=<TOKEN>&time_frame=24h&sort_by=volume&sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

**Response**: `data.items[] → { wallet, pnl, volume, tradeCount, buyVolume, sellVolume, tags }`

---

### GET /trader/gainers-losers
Top performing traders today, yesterday, or this week. `type`, `sort_by`, `sort_type` all required.

**Docs**: https://docs.birdeye.so/reference/get-trader-gainers-losers

```bash
curl -sS "https://public-api.birdeye.so/trader/gainers-losers?type=today&sort_by=PnL&sort_type=desc&limit=10" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

## Wallet History

### POST /wallet/v2/tx/first-funded
First funding transaction — use to determine wallet age and funding origin.

**Docs**: https://docs.birdeye.so/reference/post-wallet-v2-tx-first-funded

```bash
curl -sS -X POST "https://public-api.birdeye.so/wallet/v2/tx/first-funded" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "Content-Type: application/json" \
  -d '{"wallet": "<WALLET>"}'
```

**Response**: details of the first funding transaction (source wallet, amount, timestamp)

---

### GET /v1/wallet/tx_list (Beta)
Complete transaction history for a wallet. Expensive — scope with `before_time`/`after_time`.

**CU**: 150 | **Docs**: https://docs.birdeye.so/reference/get-v1-wallet-tx_list

```bash
curl -sS "https://public-api.birdeye.so/v1/wallet/tx_list?wallet=<WALLET>&after_time=<TS>&limit=50" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /v1/wallet/token_list (Beta)
Current token holdings with balances.

**CU**: 100 | **Docs**: https://docs.birdeye.so/reference/get-v1-wallet-token_list

```bash
curl -sS "https://public-api.birdeye.so/v1/wallet/token_list?wallet=<WALLET>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "x-chain: solana" -H "accept: application/json"
```

---

### GET /v1/wallet/list_supported_chain
Supported chains for wallet APIs. Run once and cache.

**Docs**: https://docs.birdeye.so/reference/get-v1-wallet-list_supported_chain

```bash
curl -sS "https://public-api.birdeye.so/v1/wallet/list_supported_chain" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "accept: application/json"
```
