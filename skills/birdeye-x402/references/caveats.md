# x402 — Caveats

## USDC balance requirement

- Wallet must hold **USDC on Solana mainnet** — not SOL, not ETH, not USDT.
- Insufficient USDC → the x402 client throws; the 402 challenge is never resolved.
- Each request costs a small USDC amount (varies by endpoint). Keep a buffer and monitor balance.

## PRIVATE_KEY format

- Set `PRIVATE_KEY` to a **base58** string — the format Phantom / Solflare exports.
- Do NOT use a JSON byte array (`[1,2,3,...]`). The client decodes via `@scure/base` `base58.decode`.

## Birdeye-specific: payment-identifier extension

Birdeye requires a `payment-identifier.info.id` field inside the `extensions` block of the base64-encoded `PAYMENT-SIGNATURE` header. Standard x402 clients don't inject this — `scripts/x402-client.mjs` patches it in via `withPaymentIdentifier`. If you build a custom client, replicate this or expect non-standard failures.

## What is NOT supported via x402

These require a standard `BIRDEYE_API_KEY`:

- **Wallet endpoints**: `/wallet/v2/*`, `/v1/wallet/*` — no x402 path exists.
- **WebSocket streams**: All 9 channels (`SUBSCRIBE_PRICE`, etc.).
- **Non-Solana chains** for holder/smart-money endpoints — Solana-only via x402.

POST endpoints **are supported** for token holder batch and transfer queries — see `operation-map.md`.

## Idempotency and retry safety

- `scripts/x402-client.mjs` generates a unique `payment-identifier` per outgoing request.
- Do not reuse a `PAYMENT-SIGNATURE` on a different URL — facilitator may reject as replay.
- Retrying the exact same request within Birdeye's cache TTL may return a cached response.

## Rate limiting

- No per-key tier (no API key). Limit is per-IP before payment verification (~100 req/s/IP), then effectively per-wallet USDC throughput.

## Endpoint-specific gotchas

| Endpoint | Gotcha |
|---|---|
| `/x402/defi/v3/token/meme/list` | Do NOT pass `sort_by` — causes 400. Pass only `limit`. |
| `/x402/holder/v1/distribution` | Param is `token_address`, not `address`. |
| `/x402/trader/gainers-losers` | `type` accepts only `today`, `yesterday`, `1W`. |
| `/x402/defi/v3/token/list` | `sort_by` only: `liquidity`, `fdv`, `market_cap`, `holder`. |
| `/x402/defi/historical_price_unix` | Param is `unixtime`, not `time_from`. |

## Common errors

| Symptom | Cause | Fix |
|---|---|---|
| `PRIVATE_KEY not set` | Env var missing | Add to `.env` (base58 string) |
| `PRIVATE_KEY is not valid base58` | Wrong format (likely JSON byte array) | Re-export from Phantom in base58 |
| Library throws on first paid call | Insufficient USDC on Solana mainnet | Top up the wallet |
| 402 loop, never resolves | Wrong keypair / facilitator unreachable | Verify wallet address printed by smoke test; check network |
| 400 on holder distribution | Used `address=` | Use `token_address=` |
| 400 on meme/list | Passed `sort_by` | Remove the param entirely |
| 404 | Token not on the chain in `x-chain` | Verify chain + token address |
