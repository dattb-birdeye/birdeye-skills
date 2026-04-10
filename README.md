# Birdeye Skills

AI-native skill system for Birdeye's multi-chain DeFi analytics API — structured as a 3-tier router/domain/workflow architecture.

Supports Claude Code, Cursor, OpenAI Codex CLI, and ChatGPT/OpenAI API.

---

## Quick Start

```bash
# Install for all platforms (Claude Code + Cursor + Codex)
npx birdeye-skills install

# With your Birdeye API key (auto-configures MCP)
npx birdeye-skills install --api-key YOUR_KEY
```

Get an API key at **https://bds.birdeye.so** → Usages → Security → Generate key

### Platform-specific installs

```bash
npx birdeye-skills install --claude       # Claude Code only
npx birdeye-skills install --cursor       # Cursor only
npx birdeye-skills install --codex        # OpenAI Codex CLI only
npx birdeye-skills install --bundle       # ChatGPT / OpenAI API (prompt file)
```

### Shell script (no Node.js required)

```bash
git clone https://github.com/birdeye-so/birdeye-skills.git
cd birdeye-skills

./install.sh                                    # All platforms
./install.sh --claude                           # Claude Code only
./install.sh --cursor                           # Cursor
./install.sh --codex --project /path/to/app     # Codex AGENTS.md
./install.sh --bundle                           # Bundled prompt file
```

---

## MCP Integration

### Official Birdeye MCP Server (API calls)

Birdeye provides a remote MCP server exposing 21+ API endpoints as tools — the AI can call Birdeye API directly without manual curl.

The `install --api-key` command auto-writes this config. To add manually:

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
        "x-api-key:YOUR_KEY"
      ]
    }
  }
}
```

| Platform | Config file |
|---|---|
| Claude Code (personal) | `~/.claude/settings.json` |
| Claude Code (project) | `.mcp.json` |
| Cursor (global) | `~/.cursor/mcp.json` |
| Cursor (project) | `.cursor/mcp.json` |
| OpenAI Codex | `~/.codex/config.toml` |

To update the API key at any time:

```bash
npx birdeye-skills install --api-key NEW_KEY
```

### Fallback: Docs Companion MCP

Local fallback server powered by the official [Birdeye OpenAPI spec](https://assets.birdeye.so/bds/docs/openapi_docs.json), cached and refreshed every 24h. Auto-installed alongside skills.

```json
{
  "mcpServers": {
    "birdeye-api-docs": {
      "command": "node",
      "args": ["/path/to/birdeye-skills/birdeye-mcp/index.js"]
    }
  }
}
```

| Tool | Purpose |
|---|---|
| `birdeye_list_endpoints` | List all endpoints grouped by domain |
| `birdeye_search_endpoints` | Search endpoints by keyword |
| `birdeye_get_endpoint_info` | Get params, types, required flags, and docs URL |

---

## Usage

Once installed, just describe what you want — the router dispatches automatically:

```
"Get the current price of SOL"
→ birdeye-router → birdeye-market-data → GET /defi/price

"Find trending tokens on Solana"
→ birdeye-router → birdeye-token-discovery → GET /defi/token_trending

"Analyze this token for security risks: <address>"
→ birdeye-router → birdeye-security-analysis → GET /defi/token_security

"Build a token screener with smart money signals"
→ birdeye-router → birdeye-token-screener-builder (workflow)

"Generate a research report for this token"
→ birdeye-router → birdeye-research-assistant (workflow)
```

---

## Updating Skills

Skills have a **7-day TTL**. The CLI checks `~/.birdeye/skills-config.json` and prompts you to update when skills are stale.

```bash
# Update to latest
npx birdeye-skills@latest install

# Check version and TTL status
npx birdeye-skills check

# List installed skills
npx birdeye-skills list

# Uninstall everything
npx birdeye-skills uninstall
```

---

## Architecture

```
Infrastructure
└── birdeye-indexer                   Canonical endpoint dictionary + shared policies

Tier 1: Router
└── birdeye-router                    Intent dispatcher

Tier 2: Domain Skills (API-focused)
├── birdeye-market-data               Price, OHLCV, stats, historical data
├── birdeye-token-discovery           Token lists, search, trending, meme
├── birdeye-transaction-flow          Trades, transfers, balance changes
├── birdeye-wallet-intelligence       Portfolio, PnL, top traders
├── birdeye-holder-analysis           Holder distribution, concentration
├── birdeye-security-analysis         Token security, risk assessment
├── birdeye-smart-money               Smart money tracking, signals
└── birdeye-realtime-streams          WebSocket subscriptions (9 channels)

Tier 3: Workflow Skills (Multi-domain)
├── birdeye-wallet-dashboard-builder  Portfolio monitors, whale trackers
├── birdeye-token-screener-builder    Token screeners, alpha finders
├── birdeye-alert-agent               Real-time alerting pipelines
└── birdeye-research-assistant        Research reports, token briefs
```

## API Group → Skill Mapping

| API Group | Skill | Endpoints |
|---|---|---|
| Price & OHLCV | birdeye-market-data | 12 |
| Stats | birdeye-market-data | 13 |
| Alltime & History | birdeye-market-data | 2 |
| Token/Market List | birdeye-token-discovery | 5 |
| Creation & Trending | birdeye-token-discovery | 2 |
| Meme | birdeye-token-discovery | 2 |
| Search & Utils | birdeye-token-discovery | 2 |
| Transactions | birdeye-transaction-flow | 10 |
| Balance & Transfer | birdeye-transaction-flow | 7 |
| Blockchain | birdeye-transaction-flow | 2 |
| Wallet, Networth & PnL | birdeye-wallet-intelligence | 14 |
| Holder | birdeye-holder-analysis | 3 |
| Security | birdeye-security-analysis | 1 |
| Smart Money | birdeye-smart-money | 1 |
| WebSockets | birdeye-realtime-streams | 9 channels |
| **Total** | | **85+ endpoints** |

## Supported Chains

Solana, Ethereum, BSC, Arbitrum, Optimism, Polygon, Avalanche, Base, zkSync, Sui

---

## Cross-Platform Support

| Platform | Command |
|---|---|
| **Claude Code** | `npx birdeye-skills install --claude` → `~/.claude/skills/` |
| **Cursor** | `npx birdeye-skills install --cursor` → `~/.cursor/rules/` |
| **OpenAI Codex CLI** | `npx birdeye-skills install --codex` → `~/.codex/AGENTS.md` |
| **ChatGPT / OpenAI API** | `npx birdeye-skills install --bundle` → `birdeye-system-prompt.md` |

---

## CLI Reference

```
npx birdeye-skills <command> [options]

Commands:
  install               Install all skills for all platforms (default)
  install --claude      Claude Code only  (~/.claude/skills/)
  install --cursor      Cursor only       (~/.cursor/rules/)
  install --codex       Codex CLI only    (~/.codex/AGENTS.md)
  install --bundle      ChatGPT / OpenAI API (prompt file)
  install --api-key KEY Set/update API key in MCP config

  uninstall             Remove all installed skills and config
  update                Update installed skills to latest version
  check                 Check version and update status
  list                  Show installed skills and versions

Examples:
  npx birdeye-skills install                    # All platforms
  npx birdeye-skills install --claude           # Claude only
  npx birdeye-skills install --api-key YOUR_KEY # With API key
  npx birdeye-skills install --bundle           # ChatGPT prompt file
  npx birdeye-skills@latest install             # Update to latest version
  npx birdeye-skills uninstall                  # Remove everything
```

---

## Repo Structure

```
birdeye-skills/
  skills/
    birdeye-indexer/
      SKILL.md
      references/
        canonical-endpoint-dictionary.md  # Ground truth for all endpoints
        session-preflight.md              # Auth, API key location, rate limits
        error-handling.md
        pagination.md
        wss-policy.md
    birdeye-router/
      SKILL.md
      references/                         # Redirect stubs → birdeye-indexer
    birdeye-market-data/
      SKILL.md
      references/
        operation-map.md                  # Endpoint details + curl examples
        request-templates.md
        endpoint-playbook.md
        caveats.md
    ... (8 more domain skills + 4 workflow skills)
  bin/
    cli.js                                # npm CLI
  birdeye-mcp/
    index.js                              # Fallback MCP server (OpenAPI-powered)
  install.sh                              # Shell installer (no Node.js required)
  package.json
```

---

## Rate Limits

| Tier | Rate Limit | WebSocket |
|---|---|---|
| Standard | 1 rps | No |
| Lite / Starter | 15 rps | No |
| Premium | 50 rps / 1000 rpm | No |
| Business | 100 rps / 1500 rpm | Yes |
| Enterprise | Custom | Yes |

**Wallet API** (`/wallet/v2/*`, `/v1/wallet/*`): 30 rpm hard limit on all tiers.

---

## For Developers

```bash
git clone https://github.com/birdeye-so/birdeye-skills
cd birdeye-skills
npm install
npm link

# Now use the CLI anywhere
birdeye-skills install
birdeye-skills check

# When done
npm unlink -g birdeye-skills
```

Edit files under `skills/` or `bin/cli.js` and re-run commands — no build step needed.

See [`SYSTEM-PROMPTS.md`](./SYSTEM-PROMPTS.md) for detailed integration architecture.
