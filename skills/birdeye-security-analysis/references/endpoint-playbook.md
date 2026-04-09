# Security Analysis — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Token security

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Full security audit for a token | `GET /defi/token_security` | 50 | Single endpoint covering all risk signals |
| Quick rug pull flags only | `GET /defi/token_security` | 50 | Extract: `mintAuthority`, `freezeAuthority`, `lockInfo.locked` |
| Concentration risk | `GET /defi/token_security` | 50 | Use `top10HolderPercent`, `top10UserPercent` fields |
| Insider / pre-market risk | `GET /defi/token_security` | 50 | Check `preMarketHolder` field |
| Transfer tax check | `GET /defi/token_security` | 50 | Check `transferFee.enabled` and `transferFee.pct` |

## Composite analysis (multi-skill)

| Intent | Add This |
|---|---|
| Verify concentration claim | Cross-check `top10HolderPercent` with `birdeye-holder-analysis → /defi/v3/token/holder` |
| Check liquidity depth | Add `birdeye-market-data → /defi/token_overview` for `liquidity` field |
| Social/creator verification | `birdeye-token-discovery → /defi/token_creation_info` for deployer address |

## Selection heuristics

- **There is only one security endpoint**: `/defi/token_security` — all risk signals come from this single call
- **Quick pre-filter** (before spending CU on other endpoints): check `mintAuthority`, `freezeAuthority`, `lockInfo.locked` — if any of these fail your criteria, skip the token immediately
- **Batching**: There is no batch security endpoint. For a list of tokens, call sequentially and respect the rate limit (add delay between calls)
- **Pair with holder analysis** when `top10HolderPercent > 60%` — verify with `/defi/v3/token/holder` to see if concentration is wallet-based or program-locked
- **Token-2022 tokens** (`isToken2022=true`) may have extension-based risks not visible in standard fields — flag for manual review

## Risk scoring guide

| Field | Safe | Warning | Danger |
|---|---|---|---|
| `mintAuthority` | null | — | non-null |
| `freezeAuthority` | null | — | non-null |
| `lockInfo.locked` | true | partial | false |
| `top10HolderPercent` | <50% | 50–80% | >80% |
| `mutableMetadata` | false | — | true |
| `transferFee.enabled` | false | low % | high % |
