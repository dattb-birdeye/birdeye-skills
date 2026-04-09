# Holder Analysis — Endpoint Playbook

Use this guide to pick the right endpoint for your intent.

## Holder list

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Top N holders with balances | `GET /defi/v3/token/holder` | Variable | Paginated; use `offset`+`limit`; key fields: `owner`, `uiAmount`, `percentage` |
| Concentration check (top 10 %) | Derive from `GET /defi/v3/token/holder` | — | Sum `percentage` of first 10 items. Or use security endpoint's `top10HolderPercent` field |

## Holder distribution

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Distribution by balance range | `GET /holder/v1/distribution` | Variable | Required: `token_address`. Use `mode=percent` for range buckets or `mode=top` for top-N |

## Batch

| Intent | Endpoint | CU | Notes |
|---|---|---|---|
| Holder data for multiple tokens | `POST /token/v1/holder/batch` | Variable/token | Body: `{ "list_address": [...] }` |

## Selection heuristics

- **"Who holds this token?"** → `/defi/v3/token/holder` with `limit=20` for top holders
- **"Is this token whale-concentrated?"** → `/defi/v3/token/holder` + sum top 10 percentages, OR check `top10HolderPercent` from `/defi/token_security` (cheaper if security data already fetched)
- **"Show me the distribution curve"** → `/holder/v1/distribution` with `mode=percent` — returns buckets like "0–1%", "1–5%", etc.
- **"Holder data for a list of tokens"** → `POST /token/v1/holder/batch`
- **Complement with security** → Always pair high concentration findings with `/defi/token_security` to check `mintAuthority` and `freezeAuthority`
