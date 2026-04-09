# Transaction Flow — Caveats

## V3 vs Legacy Trade Endpoints

- **Prefer V3**: `/defi/v3/token/txs` (20 CU) returns richer data than `/defi/txs/token` (10 CU). The extra 10 CU buys better filtering and more fields.
- **seek_by_time**: Use the `seek_by_time` variants when you need time-bounded queries. The standard endpoints paginate by offset only.
- **Volume-filtered trades**: `/defi/v3/token/txs-by-volume` is purpose-built for finding whale trades. Don't use the standard endpoint and filter client-side — wasteful.

## Trade Direction (side field)

- The `side` field is **relative to the queried token**. If you query trades for token A:
  - `buy` = someone bought token A (sold another token for A)
  - `sell` = someone sold token A (bought another token with A)
- For pair trades, the side is relative to the base token of the pair.

## Pagination

- **offset/limit**: Standard pagination. Max limit is typically 50.
- **hasNext**: Check this field to know if more pages exist. Don't assume a fixed total.
- **Time-based pagination**: The `seek_by_time` endpoints use `before_time`/`after_time` instead of offset. More efficient for large datasets.

## Transfer Endpoints

- **POST, not GET**: Transfer and balance endpoints use POST. Don't attempt GET requests.
- **Wallet vs Token transfers**:
  - `/token-v1-transfer` — all transfers of a specific token (across all wallets)
  - `/wallet-v2-transfer` — all transfers for a specific wallet (across all tokens)
  - Choose based on whether your query is token-centric or wallet-centric.

## Rate Limits

- **Wallet API group limit**: Balance change, token balance, and transfer endpoints fall under the Wallet API group, which has a stricter 30 rpm limit regardless of your tier.
- **Don't poll transfers rapidly**: Cache and use WebSocket `SUBSCRIBE_WALLET_TXS` for real-time updates instead.

## Data Freshness

- **Trades**: Near real-time (~2-5 second lag).
- **Transfers**: May have slightly more lag than trades.
- **Latest block**: Real-time.
- **Balance changes**: Depends on indexing — typically <10 seconds.

## Common Mistakes

- Using offset pagination for very large datasets — switch to time-based (`seek_by_time`) for better performance.
- Forgetting to set `x-chain` header when querying EVM chain transactions.
- Confusing pair address with token address in pair trade queries.
- Not handling the `hasNext` flag — assuming all data is in the first page.
