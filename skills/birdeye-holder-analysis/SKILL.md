---
name: birdeye-holder-analysis
description: Analyze token holder distributions, top holders, holder concentration, and batch holder data via Birdeye API. Covers the Holder endpoint group.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Holder Analysis — Distribution & Concentration

You are an expert at analyzing token holder data using Birdeye APIs. This skill covers holder lists, distribution analysis, and concentration metrics.

> `X-API-KEY` header required | `x-chain` header (default: `solana`) | Base: `https://public-api.birdeye.so`

## Use This Skill vs Others

**Token-centric** — answers "who holds this token?". Use when input is a token address.
- vs `birdeye-wallet-intelligence` → use that for **wallet-centric** queries ("what does this wallet hold? PnL? net worth?"). Input there is a wallet.
- vs `birdeye-smart-money` → use that for **whale/smart-trader leaderboards** across tokens. This skill only segments holders of one token.
- vs `birdeye-transaction-flow` → use that for **trade events** (buy/sell). This skill returns balance snapshots, not trades.

## Routing

| Intent | Reference |
|---|---|
| Top holders for a token | `references/operation-map.md` → Token Holder |
| Holder distribution ranges | `references/operation-map.md` → Distribution |
| Batch holder data | `references/operation-map.md` → Batch |
| Which endpoint to use for your intent | `references/endpoint-playbook.md` |
| Copy-paste curl/fetch examples | `references/request-templates.md` |
| Common issues | `references/caveats.md` |
| Exact endpoint params, chain support, curl | `birdeye-indexer` skill → `references/canonical-endpoint-dictionary.md` |

## Endpoint Picker

> Endpoint params, CU, chain support, and curl live in `references/operation-map.md` (and authoritatively in `birdeye-indexer/references/canonical-endpoint-dictionary.md`). Don't duplicate them here — link out instead.

| If you need… | Endpoint |
|---|---|
| Ranked list of top holders with balances | `GET /defi/v3/token/holder` |
| Holder count by balance bucket | `GET /holder/v1/distribution` |
| Holder summary for many tokens at once | `POST /token/v1/holder/batch` |
| Tag breakdown (bundler/sniper/insider/dev/smart_trader %) for a token | `GET /token/v1/holder-profile` |
| Per-wallet PnL/volume filtered by holder tags | `GET /token/v1/holder-positions` |
| Holder count time series (1s/1m/1h/1d) | `GET /token/v1/holder/chart` |

## Analysis Patterns

**Holder Concentration** — top holders sorted by balance → top-10 / top-50 sum. >50% in top-10 = centralization risk.

**Distribution Health** — many small holders + few whales = healthy; extreme concentration in 1–3 wallets = unhealthy.

**Tag Composition** (Solana, `holder-profile`) — high bundler% or sniper% suggests insider-heavy launch; high smart_trader% is a quality signal. Bundler tag accurate for tokens created from **2026-03-01** onwards.

**Holder Growth Trend** — `holder/chart` for time series; growing = adoption, declining = exit signal. Combine with price action to detect divergence.
