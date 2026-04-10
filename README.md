# Birdeye Skills

AI-native skill system for Birdeye's multi-chain DeFi analytics API — structured as a 3-tier router/domain/workflow architecture.

Supports Claude Code, Cursor, OpenAI Codex CLI, and ChatGPT/OpenAI API.

---

## Quick Start

### Option 1: Claude Code plugin (recommended)

```bash
npx skills add birdeye-so/birdeye-skills -g --yes
```

Installs all 14 skills globally to `~/.claude/skills/` in one command — no clone needed.

### Option 2: npm / npx

```bash
# Install globally (Claude Code personal)
npx birdeye-skills install --all

# Install to a project
npx birdeye-skills install --all --project /path/to/app

# Cursor
npx birdeye-skills install --cursor --all
npx birdeye-skills install --cursor --all --project /path/to/app

# OpenAI Codex CLI
npx birdeye-skills install --codex --all --project /path/to/app

# ChatGPT / OpenAI API (bundle to file)
npx birdeye-skills install --bundle
```

### Option 3: Shell script (no Node.js required)

```bash
git clone https://github.com/birdeye-so/birdeye-skills.git
cd birdeye-skills

./install.sh                                    # Claude Code personal
./install.sh --project /path/to/app             # Claude Code project
./install.sh --cursor                           # Cursor global (~/.cursor/rules)
./install.sh --cursor --project /path/to/app    # Cursor project
./install.sh --codex --project /path/to/app     # Codex AGENTS.md
./install.sh --bundle                           # Bundled prompt file
./install.sh --domain                           # Domain skills only (9)
./install.sh birdeye-market-data                # Single skill
```

---

## MCP Integration

### Official Birdeye MCP Server (API calls)

Birdeye provides an official remote MCP server (Beta) exposing 21 API endpoints as MCP tools — the AI can call Birdeye API directly, no manual curl needed.

**API Key**: Login to https://bds.birdeye.so → Usages → Security → Generate key

**Docs**: https://docs.birdeye.so/docs/birdeye-ai

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

| Platform | Config file |
|---|---|
| Claude Code (project) | `.mcp.json` |
| Claude Code (personal) | `~/.claude/settings.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| GitHub Copilot | `.vscode/mcp.json` |
| Gemini CLI | `~/.gemini/settings.json` |
| OpenAI Codex | `~/.codex/config.toml` |

The npm CLI auto-configures MCP when installing with `--api-key`:

```bash
npx birdeye-skills install --all --project . --api-key YOUR_KEY
```

### Fallback: Docs Companion MCP

If the official MCP is unavailable (outage, no API key, offline), add this local fallback — powered by the official [Birdeye OpenAPI spec](https://assets.birdeye.so/bds/docs/openapi_docs.json) fetched and cached locally.

```bash
cd birdeye-mcp && npm install
```

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
| `birdeye_list_endpoints` | List all 75+ endpoints grouped by domain |
| `birdeye_search_endpoints` | Search endpoints by keyword |
| `birdeye_get_endpoint_info` | Get params, types, required flags, and docs URL |

Spec is fetched once and cached at `~/.birdeye/openapi-cache.json` (refreshed every 24h). Falls back to stale cache if offline.

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
# Pull latest from npm and reinstall
npx birdeye-skills@latest install --all

# Or via shell script
git pull && ./install.sh

# Check TTL status
npx birdeye-skills check

# List installed skills and versions
npx birdeye-skills list
```

### Adding a New API Endpoint

1. Identify which domain skill it belongs to (see table below)
2. Edit `skills/<skill>/references/operation-map.md` — add the endpoint
3. Edit `skills/<skill>/references/caveats.md` if needed
4. Bump `version` in `skills/<skill>/SKILL.md` frontmatter
5. Reinstall: `npx birdeye-skills install --all` or `./install.sh`

```bash
npx birdeye-skills docs sync     # Shows the full guide
```

---

## Architecture

```
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

| Platform | Command | Output |
|---|---|---|
| **Claude Code** (plugin) | `npx skills add birdeye-so/birdeye-skills -g --yes` | `~/.claude/skills/` |
| **Claude Code** (personal) | `npx birdeye-skills install --all` | `~/.claude/skills/` |
| **Claude Code** (project) | `npx birdeye-skills install --all --project DIR` | `DIR/.claude/skills/` |
| **Cursor** (global) | `npx birdeye-skills install --cursor --all` | `~/.cursor/rules/` |
| **Cursor** (project) | `npx birdeye-skills install --cursor --all --project DIR` | `DIR/.cursor/rules/` |
| **OpenAI Codex CLI** | `npx birdeye-skills install --codex --all --project DIR` | `DIR/AGENTS.md` |
| **ChatGPT / OpenAI API** | `npx birdeye-skills install --bundle` | `birdeye-system-prompt.md` |

---

## Repo Structure

```
birdeye-skills/
  .claude-plugin/
    plugin.json           # Claude Code plugin metadata
  skills/
    birdeye-router/
      SKILL.md
    birdeye-market-data/
      SKILL.md
      references/
        operation-map.md  # Endpoint paths, params, docs URL, key fields
        caveats.md        # Common mistakes and edge cases
        preflight.md      # Pre-request checklist (optional)
        templates.md      # Code templates (optional)
    birdeye-token-discovery/
    birdeye-transaction-flow/
    birdeye-wallet-intelligence/
    birdeye-holder-analysis/
    birdeye-security-analysis/
    birdeye-smart-money/
    birdeye-realtime-streams/
    birdeye-wallet-dashboard-builder/
    birdeye-token-screener-builder/
    birdeye-alert-agent/
    birdeye-research-assistant/
  bin/
    cli.js                # npm CLI (npx birdeye-skills)
  birdeye-mcp/
    index.js              # Fallback MCP server (OpenAPI-powered, no build step)
    package.json
  install.sh              # Shell installer (no Node.js required)
  package.json            # npm package (name: birdeye-skills)
```

---

## CLI Reference

```
npx birdeye-skills <command> [options]

Commands:
  install [options]       Install skills

  Platform (default: all agents):
    (none)                Claude + Cursor + Codex global (default)
    --claude              Claude Code only  (~/.claude/skills/)
    --cursor              Cursor only       (~/.cursor/rules/)
    --codex               Codex CLI only    (~/.codex/AGENTS.md)
    --bundle [file]       ChatGPT / OpenAI API (system prompt file)

  Skill selection:
    --all                 All 14 skills (default when no selection flag given)
    --domain              Router + indexer + 8 domain skills
    --workflow            4 workflow skills
    <skill-name>          Single skill

  Target:
    --project DIR         Install to project directory (scoped)
    --path DIR            Custom directory

  MCP:
    --api-key KEY         Set API key in MCP config
    --skip-mcp            Skip MCP config generation

  update                  Reinstall skills from recorded install config
  pull                    Fetch latest from npm and reinstall
  check                   Check TTL and version status
  list                    Show installed skills
  info <skill-name>       Show skill details
  docs sync               Guide for adding new API endpoints
  cache clear             Clear install metadata

Examples:
  npx birdeye-skills install --all                             # All agents (global)
  npx birdeye-skills install --all --project .                 # All agents (project)
  npx birdeye-skills install --all --project . --api-key KEY   # With MCP key
  npx birdeye-skills install --claude --all                    # Claude only
  npx birdeye-skills install --cursor --all                    # Cursor only (global)
  npx birdeye-skills install --codex --all --project .         # Codex (project)
  npx birdeye-skills install --bundle                          # ChatGPT bundle
  npx birdeye-skills@latest install --all                      # Update to latest
  npx birdeye-skills check                                     # Check TTL status
```

## Rate Limits by Tier

| Tier | Rate Limit | WebSocket |
|---|---|---|
| Standard | 1 rps | No |
| Lite / Starter | 15 rps | No |
| Premium | 50 rps / 1000 rpm | No |
| Business | 100 rps / 1500 rpm | Yes |
| Enterprise | Custom | Yes |

**Wallet API**: 30 rpm hard limit regardless of tier.

See [`SYSTEM-PROMPTS.md`](./SYSTEM-PROMPTS.md) for detailed integration architecture.

---

## For Developers

### Test CLI locally with npm link

```bash
git clone https://github.com/birdeye-so/birdeye-skills
cd birdeye-skills

# Link the package globally (no npm publish needed)
npm link

# Now use the CLI anywhere
birdeye-skills install --all
birdeye-skills list
birdeye-skills check

# When done testing
npm unlink -g dattb-birdeye-skills
```

Edit files under `skills/` or `bin/cli.js`, then re-run commands immediately — no build step needed.

### Test the fallback MCP locally

```bash
cd birdeye-mcp && npm install

# Smoke test — should hang silently (waiting for MCP stdio)
node index.js
```

Add to MCP config with the absolute path to `birdeye-mcp/index.js`.
