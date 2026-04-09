# Token Discovery — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Search and browse

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Find a token by name, symbol, or address | `GET /defi/v3/search` | Low | Returns both tokens and markets; set `target=token` to narrow |
| Browse tokens with market filters | `GET /defi/v3/token/list` | 100 | Primary screener endpoint. Supports min/max filters and sorting |
| Scroll through the full token universe | `GET /defi/v3/token/list/scroll` | 500 | Expensive. Use only for full-list iteration; `scroll_id` for pagination |
| Legacy token list | `GET /defi/tokenlist` | 30 | Legacy — limited sort options. Prefer V3 |

## Trending and new listings

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Currently trending tokens | `GET /defi/token_trending` | Variable | `sort_by` required: `rank`, `volumeUSD`, or `liquidity`; use `interval` for time window |
| Recently listed tokens | `GET /defi/v2/tokens/new_listing` | 80 | Includes meme platform tokens when `meme_platform_enabled=true` |

## Meme tokens

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Browse meme tokens | `GET /defi/v3/token/meme/list` | Variable | Filtered list of meme tokens with sorting |
| Meme token detail metrics | `GET /defi/v3/token/meme/detail/single` | 30 | Includes pump.fun/bonding curve status, social metrics |

## Token metadata and markets

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Token creation/deployment info | `GET /defi/token_creation_info` | 80 | Deployer address, creation tx, slot, timestamp |
| All DEX pools for a token | `GET /defi/v2/markets` | Variable | Lists every pair with DEX info, volume, liquidity |

## Selection heuristics

- **"Find token named X"** → `/defi/v3/search` with `keyword=X` (fast, searches name + symbol + address)
- **"Top tokens by volume/liquidity/market cap"** → `/defi/v3/token/list` with `sort_by` and optional `min_*` filters
- **"What's trending now"** → `/defi/token_trending` with `sort_by=rank&sort_type=asc` and `interval=24h`
- **"What just launched"** → `/defi/v2/tokens/new_listing` — set `meme_platform_enabled=true` to include pump.fun tokens
- **"Is this a pump.fun / meme token"** → `/defi/v3/token/meme/detail/single` for bonding curve status
- **"Who deployed this contract"** → `/defi/token_creation_info`
- **"Which DEXes trade this token"** → `/defi/v2/markets`
- **Full token universe pagination** → `/defi/v3/token/list/scroll` (500 CU — last resort)
