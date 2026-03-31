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

| Tier | Rate Limit | WebSocket |
|---|---|---|
| Standard | 1 rps | No |
| Lite | 15 rps | No |
| Starter | 15 rps | No |
| Premium | 50 rps / 1000 rpm | No |
| Business | 100 rps / 1500 rpm | Yes |
| Enterprise | Custom | Yes |

Wallet API group is limited to 30 rpm regardless of tier.

## Response Discovery Protocol

Domain skills provide endpoint paths, parameters, and key field hints. Each endpoint includes a **Docs** URL pointing to the official API documentation. **Before generating code that parses API responses, ALWAYS verify the actual response schema** using one of these methods (in priority order):

### Method 1: Official Birdeye MCP (best — call API directly via MCP tools)

Birdeye provides an official MCP server at `https://mcp.birdeye.so/mcp` (currently in Beta).
When the `birdeye-mcp` server is connected, the AI can call Birdeye API endpoints directly as MCP tools — no manual curl needed.

**Setup** (add to MCP config):
```json
{
  "mcpServers": {
    "birdeye-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@0.1.38",
        "https://mcp.birdeye.so/mcp",
        "--header",
        "x-api-key:${API_KEY}"
      ],
      "env": {
        "API_KEY": "<YOUR_BIRDEYE_API_KEY>"
      }
    }
  }
}
```

**Available endpoints via MCP** (21 tools):
- `GET /defi/price` — Current token price
- `GET /defi/history_price` — Historical pricing
- `GET /defi/v3/ohlcv` — OHLCV candles
- `GET /defi/token_overview` — Token statistics
- `GET /defi/token_security` — Security/risk assessment
- `GET /defi/v3/search` — Token/market search
- `GET /defi/networks` — Supported networks
- `GET /wallet/v2/current-net-worth` — Wallet net worth
- And more...

**Usage**: Call the MCP tool directly. The response IS the real API response — use it to understand the schema and build your code.

### Method 2: Docs Companion MCP (optional — endpoint discovery & CU costs)

If `birdeye-api-docs` companion server is connected, use these lookup tools:

| Tool | Purpose |
|---|---|
| `birdeye_get_endpoint_info` | Get docs, params, CU cost, docs URL for an endpoint |
| `birdeye_search_endpoints` | Search endpoints by keyword (e.g., "token price") |
| `birdeye_list_endpoints` | List all endpoints grouped by domain |

This server does NOT make API calls — it provides documentation and discovery. Use with Method 1 for the best experience.

### Method 3: Live Test Call (reliable — no MCP needed)

Make a minimal API call to inspect the actual response:

```bash
# Inspect real response shape
curl -s \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112" \
  | python3 -m json.tool | head -30
```

Rules for test calls:
- Use `limit=1` or minimal parameters to keep response small
- Use a well-known token address (SOL: `So11111111111111111111111111111111111111112`)
- Inspect the response structure before writing parsing code
- This costs real CU — use sparingly, cache the shape mentally

### Method 4: WebSearch Documentation (fallback)

Search Birdeye's official API docs:

```
WebSearch: "birdeye api {endpoint_path} response schema site:docs.birdeye.so"
WebFetch:  https://docs.birdeye.so/reference
Birdeye AI docs: https://docs.birdeye.so/docs/birdeye-ai
```

### Method 5: Key Fields in Operation Map (quick reference)

Each endpoint in the skill's operation map includes **Key fields** — a compact summary of the most important response fields. Use this for a quick overview, but always verify against the full docs for complete schema.

### When to Discover

- **ALWAYS** before generating response parsing/handling code
- When a user asks about specific response fields
- When the key fields summary seems incomplete
- When switching between V1/V2/V3 endpoints (response shapes differ)

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
