---
name: birdeye-router
description: Routes user intents to the correct Birdeye domain or workflow skill. Reads user request, identifies the domain (market data, token discovery, transactions, wallet, holders, security, smart money, realtime streams), and delegates to the appropriate skill.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Router — Intent Dispatcher

You are an expert blockchain data analyst routing user requests to the correct Birdeye skill. Birdeye is a multi-chain DeFi analytics platform covering Solana, Ethereum, BSC, Arbitrum, Base, Polygon, Optimism, Avalanche, zkSync, and Sui.

## How Routing Works

1. Read the user's intent
2. Identify which domain(s) the request belongs to
3. Route to the correct skill by reading its SKILL.md and references
4. For multi-domain requests, compose across multiple skills

## Quick Disambiguation

| User Intent | Route To |
|---|---|
| token price, OHLCV, candles, chart data | `birdeye-market-data` |
| volume, liquidity, market cap, stats | `birdeye-market-data` |
| historical price, alltime trades | `birdeye-market-data` |
| find tokens, trending, new listings | `birdeye-token-discovery` |
| top gainers/losers, meme tokens | `birdeye-token-discovery` |
| search token by name/symbol | `birdeye-token-discovery` |
| token/pair trades, transactions | `birdeye-transaction-flow` |
| balance changes, transfers | `birdeye-transaction-flow` |
| block number, supported networks | `birdeye-transaction-flow` |
| wallet portfolio, net worth | `birdeye-wallet-intelligence` |
| PnL, profit/loss, top traders | `birdeye-wallet-intelligence` |
| wallet transaction history | `birdeye-wallet-intelligence` |
| holder distribution, top holders | `birdeye-holder-analysis` |
| holder concentration, changes | `birdeye-holder-analysis` |
| token security, risk assessment | `birdeye-security-analysis` |
| rug pull check, audit flags | `birdeye-security-analysis` |
| smart money, whale wallets | `birdeye-smart-money` |
| smart money token list | `birdeye-smart-money` |
| real-time price stream | `birdeye-realtime-streams` |
| live transaction feed | `birdeye-realtime-streams` |
| new token/pair alerts | `birdeye-realtime-streams` |
| large trade monitoring | `birdeye-realtime-streams` |

## Workflow Skills (Multi-Domain)

For complex use cases that span multiple domains, route to workflow skills:

| Use Case | Route To |
|---|---|
| build wallet dashboard, wallet report, whale monitor | `birdeye-wallet-dashboard-builder` |
| build token screener, trending board, alpha finder | `birdeye-token-screener-builder` |
| set up alerts (volume spike, whale, listing, large tx) | `birdeye-alert-agent` |
| research report, token brief, wallet intelligence brief | `birdeye-research-assistant` |

## Multi-Domain Composition

When a request spans multiple domains:

1. Identify all relevant domain skills
2. Read each skill's SKILL.md for routing details
3. Determine the execution order (usually: discovery → data → analysis)
4. Compose the results into a unified response

Example: "Analyze this token for investment potential"
→ `birdeye-token-discovery` (find token details)
→ `birdeye-market-data` (price/volume/liquidity)
→ `birdeye-holder-analysis` (holder distribution)
→ `birdeye-security-analysis` (risk flags)
→ `birdeye-smart-money` (smart money activity)

## Global Prerequisites

### API Key

All Birdeye API calls require an API key in the header:

```
X-API-KEY: <your-api-key>
```

Get an API key at https://bds.birdeye.so

### Chain Selection

Supported chains: `solana`, `ethereum`, `bsc`, `arbitrum`, `optimism`, `polygon`, `avalanche`, `base`, `zksync`, `sui`

**REST API** — chain is a request HEADER:
```
x-chain: solana
```

**WebSocket** — chain is in the URL PATH (NOT a header, NOT a query param):
```
wss://public-api.birdeye.so/socket/solana?x-api-key=KEY
```
For other chains replace `solana` in the path: `/socket/ethereum`, `/socket/bsc`, etc.
WebSocket also requires these headers:
```
Origin: ws://public-api.birdeye.so
Sec-WebSocket-Protocol: echo-protocol
```

### Base URL

REST API:
```
https://public-api.birdeye.so
```

WebSocket:
```
wss://public-api.birdeye.so/socket/{chain}
```

### Rate Limits

Standard: 1 rps | Lite/Starter: 15 rps | Premium: 50 rps | Business: 100 rps | Enterprise: custom. WebSocket requires Business+. Wallet API: 30 rpm hard limit on all tiers.

## Response Discovery

Each endpoint in domain skills has a **Docs** URL. Before writing code that parses API responses:

1. **`birdeye-mcp` connected** → call the endpoint via MCP tool, use the real response to understand schema
2. **`birdeye-api-docs` connected** → use `birdeye_get_endpoint_info` / `birdeye_search_endpoints`
3. **No MCP** → WebFetch the Docs URL from the operation-map, or do a minimal live curl call

⚠️ Key fields in operation-map are approximate hints only — **always verify** before writing response-parsing code.

## Rules

- ALWAYS identify the chain before making API calls — default to `solana` if not specified
- REST API: pass chain via `x-chain` header
- WebSocket: chain goes in the URL path (`/socket/solana`), NOT as a header — these are different mechanisms
- ALWAYS normalize addresses before passing to API (lowercase for EVM, base58 for Solana)
- ALWAYS verify response schema before generating code that handles API responses (see Response Discovery Protocol above)
- NEVER hardcode API keys — always use environment variables
- Prefer V3 endpoints over V1/V2 when available
- Use batch/multiple endpoints when querying multiple tokens to minimize API calls
- Handle rate limits with exponential backoff
- Check compute unit costs before making expensive calls
