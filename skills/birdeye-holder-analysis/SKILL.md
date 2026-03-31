---
name: birdeye-holder-analysis
description: Analyze token holder distributions, top holders, holder concentration, and batch holder data via Birdeye API. Covers the Holder endpoint group.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Holder Analysis — Distribution & Concentration

You are an expert at analyzing token holder data using Birdeye APIs. This skill covers holder lists, distribution analysis, and concentration metrics.

## Prerequisites

### API Key
All requests require `X-API-KEY` header. Get one at https://bds.birdeye.so.

### Chain Selection
Set `x-chain` header. Default: `solana`.

### Base URL
```
https://public-api.birdeye.so
```

## Routing

| Intent | Reference |
|---|---|
| Top holders for a token | `references/operation-map.md` → Token Holder |
| Holder distribution ranges | `references/operation-map.md` → Distribution |
| Batch holder data | `references/operation-map.md` → Batch |
| Common issues | `references/caveats.md` |

## Response Discovery

Each endpoint in the operation map includes a **Docs** URL. Before writing code that parses API responses:

1. **If birdeye-mcp is connected** → call the endpoint directly via MCP tool, inspect the real response
2. **Otherwise** → WebFetch the Docs URL to get the full response schema from docs.birdeye.so
3. **CRITICAL**: Key fields listed in the operation map are approximate hints only and may contain wrong field names. **NEVER use key field names in code without first verifying them via docs**. Agents that skip verification will generate broken code with non-existent fields.

## Rules

### Endpoint Selection
- `GET /defi/v3-token-holder` — paginated list of holders with balances
- `POST /token-v1-holder-batch` — batch holder data for multiple tokens
- `GET /holder-v1-distribution` — holder distribution by balance ranges

### Analysis Patterns

**Holder Concentration**:
1. Get top holders via `/defi/v3-token-holder` sorted by balance
2. Calculate top 10/top 50 concentration percentage
3. High concentration (>50% in top 10) = centralization risk

**Distribution Health**:
1. Get distribution via `/holder-v1-distribution`
2. Healthy distribution: many small holders, few whales
3. Unhealthy: extreme concentration in 1-3 wallets

**Holder Growth Trend**:
- Compare holder count over time (from `token_overview` endpoint in market-data skill)
- Growing holders = adoption signal
- Declining holders = potential exit signal

### CU Costs
- Token Holder list: Variable (depends on pagination)
- Distribution: Variable
- Batch: Variable per token
