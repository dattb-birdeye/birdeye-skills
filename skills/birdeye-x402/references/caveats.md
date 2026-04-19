# x402 — Caveats

## USDC balance requirement

- Wallet must hold **USDC on Solana mainnet** — not SOL, not ETH, not USDT.
- If USDC balance is insufficient, `withPaymentInterceptor` throws; the 402 is never resolved.
- Keep a buffer — each request costs a small USDC amount (varies by endpoint). Monitor balance proactively.

## What is NOT supported via x402

These require a standard `BIRDEYE_API_KEY`:

- **All wallet endpoints**: `/wallet/v2/*`, `/v1/wallet/*` — no x402 path exists.
- **POST bulk endpoints**: `multi_price` (POST body), `pair/overview/multiple`, `token/meta-data/multiple`, `price/stats/multiple`. The GET versions of some of these work; POST bulk does not.
- **WebSocket streams**: All 9 channels (`SUBSCRIBE_PRICE`, etc.).
- **Non-Solana chains** for holder/smart-money endpoints — those are Solana-only via x402.

## Idempotency and retry safety

- Retrying the exact same request within the cache TTL returns a **cached response at no charge**.
- Do NOT reuse a payment ID on a different request — it will be rejected as a replay attack.
- `@x402/fetch` generates unique payment IDs automatically — never construct them manually.

## No API key means no rate limit tier

- Standard API tiers (1 rps, 15 rps, 50 rps, 100 rps) apply per API key.
- x402 uses per-IP rate limiting before payment verification: **100 requests/second per IP**.
- After payment verification the rate limit is effectively per-wallet USDC spend.

## meme/list — no sort_by

`GET /x402/defi/v3/token/meme/list` does NOT accept `sort_by` — any value causes 400. Pass only `limit`.

## holder/v1/distribution — token_address param

Use `?token_address=<address>` — NOT `?address=`. Using `address` causes 400.

## gainers-losers — valid type values

`type` accepts only `today` · `yesterday` · `1W`. Do not use `gainers`, `losers`, or `1H`.

## Common errors

| Symptom | Cause | Fix |
|---|---|---|
| 402 not resolved, library throws | Insufficient USDC in wallet | Top up USDC on Solana mainnet |
| 402 loop, never resolves | Wrong keypair format or facilitator unreachable | Verify `SOLANA_PRIVATE_KEY` is a byte-array JSON; check network |
| 400 on meme/list | Passed `sort_by` param | Remove `sort_by` entirely |
| 400 on holder distribution | Used `address=` instead of `token_address=` | Use `?token_address=<addr>` |
| 400 on gainers-losers | Wrong `type` value | Use `today`, `yesterday`, or `1W` |
| 404 | Token not on the chain specified in `x-chain` | Verify chain and token address |
| Empty `data.items` on token list | Invalid `sort_by` value | Use only: `liquidity`, `fdv`, `market_cap`, `holder` |
