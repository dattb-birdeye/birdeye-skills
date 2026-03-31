# Birdeye Skills

AI-native skill system for integrating Birdeye's multi-chain DeFi analytics API. Structured as a 3-tier architecture with router, domain skills, and workflow skills.

## Packages

| Package | Description | Install |
|---|---|---|
| [`birdeye-skills`](.) | Canonical skill source — SKILL.md + references | `./install.sh` |
| [`birdeye-cli`](./birdeye-cli) | CLI for managing skill install/update/sync | `npm install -g birdeye-skills-cli` |
| [`birdeye-plugin`](./birdeye-plugin) | Claude Code plugin — bundles all skills | `/plugin install birdeye` |
| [`birdeye-mcp`](./birdeye-mcp) | Docs companion MCP — endpoint discovery, CU costs, param reference | See below |

---

## MCP Integration

### Official Birdeye MCP Server (API calls)

Birdeye provides an official remote MCP server (Beta) that exposes 21 API endpoints as MCP tools.
The AI can call Birdeye API directly via MCP — no manual curl needed.

**Docs**: https://docs.birdeye.so/docs/birdeye-ai

**API Key**: Login to https://bds.birdeye.so → Usages → Security → Generate Authentication key

#### Setup (all platforms)

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
| Claude Desktop | `claude_desktop_config.json` |
| Claude Code CLI | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| GitHub Copilot | `.vscode/mcp.json` |
| Gemini CLI | `~/.gemini/settings.json` |
| OpenAI Codex | `~/.codex/config.toml` |

### Docs Companion MCP Server (optional — endpoint discovery)

The `birdeye-api-docs` companion provides endpoint documentation, CU costs, and search — it does NOT make API calls. Use alongside the official MCP for the best experience.

| Tool | Purpose |
|---|---|
| `birdeye_get_endpoint_info` | Get docs, params, CU cost, docs URL for an endpoint |
| `birdeye_search_endpoints` | Search endpoints by keyword |
| `birdeye_list_endpoints` | List all endpoints grouped by domain |

```bash
cd birdeye-mcp && npm install && npm run build
```

```json
{
  "mcpServers": {
    "birdeye-api-docs": {
      "command": "node",
      "args": ["/path/to/birdeye-skills/birdeye-mcp/dist/index.js"]
    }
  }
}
```

### Response Discovery Protocol

The Router skill instructs the AI to verify response schemas before generating code:

1. **Official MCP** (if connected) → Call endpoint directly, inspect real response
2. **Docs Companion** (if connected) → Look up params, CU costs, docs URL
3. **Live curl** → Make a minimal test call manually
4. **WebSearch** → Search docs.birdeye.so
5. **Key fields** → Quick reference in operation map, verify via Docs URL

---

## Quick Start

### Option 1: Claude Code — One-shot install (simplest)

```bash
git clone https://github.com/birdeye-so/birdeye-skills.git
cd birdeye-skills
./install.sh
```

This installs all 13 skills to `~/.claude/skills/` (personal, available in all projects).

### Option 2: Claude Code — Install to a specific project

```bash
./install.sh --project /path/to/my-app
```

### Option 3: Cursor

```bash
./install.sh --cursor --project /path/to/my-app
```

Installs all skills as `.mdc` rule files in `<project>/.cursor/rules/`. The router rule has `alwaysApply: true`; domain/workflow rules load on-demand via Cursor's description matching.

### Option 4: OpenAI Codex CLI

```bash
./install.sh --codex --project /path/to/my-app
```

Generates an `AGENTS.md` file in the project root with all Birdeye API knowledge bundled.

### Option 5: ChatGPT / OpenAI API

```bash
./install.sh --bundle
./install.sh --bundle my-custom-prompt.md    # Custom filename
```

Generates a single `birdeye-system-prompt.md` file containing all skills and references. Copy the content into ChatGPT Custom Instructions or an OpenAI API system message.

### Option 6: Install specific skills

```bash
./install.sh birdeye-market-data           # Single skill
./install.sh --domain                       # Router + 8 domain skills
./install.sh --workflow                     # 4 workflow skills only
```

### Option 7: Claude Code Plugin

```
/plugin install birdeye
```

### Option 8: CLI tool

```bash
npm install -g birdeye-skills-cli

birdeye-skills install --all                                # Claude Code personal
birdeye-skills install --all --project /path/to/app         # Claude Code project
birdeye-skills install --cursor --all --project /path/to/app  # Cursor rules
birdeye-skills install --codex --all --project /path/to/app   # Codex AGENTS.md
birdeye-skills install --bundle                              # Bundled prompt file
birdeye-skills install --domain                              # Domain skills only
birdeye-skills install birdeye-market-data                   # Specific skill
```

---

## Cross-Platform Support

| Platform | Command | Output |
|---|---|---|
| **Claude Code** (personal) | `./install.sh` | `~/.claude/skills/<skill>/SKILL.md` |
| **Claude Code** (project) | `./install.sh --project DIR` | `DIR/.claude/skills/<skill>/SKILL.md` |
| **Claude Code** (plugin) | `/plugin install birdeye` | Plugin bundle |
| **Cursor** | `./install.sh --cursor --project DIR` | `DIR/.cursor/rules/<skill>.mdc` |
| **OpenAI Codex CLI** | `./install.sh --codex --project DIR` | `DIR/AGENTS.md` |
| **ChatGPT** | `./install.sh --bundle` | `birdeye-system-prompt.md` |
| **OpenAI API** | `./install.sh --bundle` | System prompt file |
| **Other AI tools** | `./install.sh --bundle` | Use as system prompt |

### Platform Details

**Cursor**: Each skill becomes a `.mdc` rule file with Cursor-specific frontmatter. The router has `alwaysApply: true` so it's always available for intent routing. Domain and workflow skills have descriptive triggers so Cursor loads them on-demand when relevant.

**Codex CLI**: All selected skills are bundled into a single `AGENTS.md` with operation maps and caveats inlined. If an existing `AGENTS.md` is found, the output is saved as `AGENTS-birdeye.md` to avoid conflicts.

**ChatGPT / OpenAI API**: All skills and ALL references are bundled into a single self-contained prompt file. Copy the content into ChatGPT Custom Instructions or inject as a system message via the API.

See [`SYSTEM-PROMPTS.md`](./SYSTEM-PROMPTS.md) for detailed integration architecture.

---

## Usage

Once installed, skills are automatically available in your AI assistant. Just describe what you want:

```
"Get the current price of SOL"
→ birdeye-router → birdeye-market-data → GET /defi/price

"Find trending tokens on Solana"
→ birdeye-router → birdeye-token-discovery → GET /defi-token_trending

"Analyze this token for security risks: <address>"
→ birdeye-router → birdeye-security-analysis → GET /defi-token_security

"Build a token screener with smart money signals"
→ birdeye-router → birdeye-token-screener-builder (workflow)

"Generate a research report for this token"
→ birdeye-router → birdeye-research-assistant (workflow)
```

### API Key Setup

Set your Birdeye API key before using:

```bash
export BIRDEYE_API_KEY=your-api-key
```

Get one at https://bds.birdeye.so

---

## Updating Skills

### When Birdeye adds new APIs

When Birdeye releases new endpoints, update the skills:

```bash
# Method 1: Git pull + reinstall
cd birdeye-skills
git pull
./install.sh

# Method 2: CLI
birdeye-skills pull          # Pull latest + reinstall

# Method 3: Check first, then update
birdeye-skills check         # See what's changed
birdeye-skills update        # Apply updates
```

### Cache & Version Management

Skills include version metadata. The CLI tracks:
- **Installed versions** in `~/.birdeye/skills-config.json`
- **Available versions** in `versions.json`
- **Cache TTL**: 24 hours — after that, `birdeye-skills install` will suggest running `pull`

```bash
birdeye-skills list          # Show installed vs available versions
birdeye-skills check         # Check for updates
birdeye-skills cache clear   # Force fresh install
```

### Adding a New API Endpoint

When a new Birdeye API endpoint is released:

1. Identify which domain skill it belongs to (see mapping table below)
2. Edit the skill's `references/operation-map.md` — add the new endpoint
3. Update `references/caveats.md` if there are gotchas
4. Bump version in `versions.json`
5. Run `./install.sh` to deploy or `npx tsx scripts/compile-skills.ts` for plugin

```bash
birdeye-skills docs sync     # Shows guide for syncing new endpoints
```

---

## Architecture

```
Tier 1: Router
└── birdeye-router                    Intent dispatcher → routes to correct skill

Tier 2: Domain Skills (API-focused)
├── birdeye-market-data               Price, OHLCV, stats, historical data
├── birdeye-token-discovery            Token lists, search, trending, meme
├── birdeye-transaction-flow           Trades, transfers, balance changes
├── birdeye-wallet-intelligence        Portfolio, PnL, top traders
├── birdeye-holder-analysis            Holder distribution, concentration
├── birdeye-security-analysis          Token security, risk assessment
├── birdeye-smart-money                Smart money tracking, signals
└── birdeye-realtime-streams           WebSocket subscriptions (9 channels)

Tier 3: Workflow Skills (Multi-domain)
├── birdeye-wallet-dashboard-builder   Portfolio monitors, whale trackers
├── birdeye-token-screener-builder     Token screeners, alpha finders
├── birdeye-alert-agent                Real-time alerting pipelines
└── birdeye-research-assistant         Research reports, token briefs
```

## API Group → Skill Mapping

| API Group | Domain Skill | Endpoints |
|---|---|---|
| Price & OHLCV | birdeye-market-data | 12 endpoints |
| Stats | birdeye-market-data | 13 endpoints |
| Alltime & History | birdeye-market-data | 2 endpoints |
| Token/Market List | birdeye-token-discovery | 5 endpoints |
| Creation & Trending | birdeye-token-discovery | 2 endpoints |
| Meme | birdeye-token-discovery | 2 endpoints |
| Search & Utils | birdeye-token-discovery | 2 endpoints |
| Transactions | birdeye-transaction-flow | 10 endpoints |
| Balance & Transfer | birdeye-transaction-flow | 7 endpoints |
| Blockchain | birdeye-transaction-flow | 2 endpoints |
| Wallet, Networth & PnL | birdeye-wallet-intelligence | 14 endpoints |
| Holder | birdeye-holder-analysis | 3 endpoints |
| Security | birdeye-security-analysis | 1 endpoint |
| Smart Money | birdeye-smart-money | 1 endpoint |
| WebSockets | birdeye-realtime-streams | 9 channels |
| **Total** | | **85+ endpoints** |

## Supported Chains

Solana, Ethereum, BSC, Arbitrum, Optimism, Polygon, Avalanche, Base, zkSync, Sui

## Skill File Structure

Each domain skill:

```
birdeye-<skill-name>/
├── SKILL.md              # Main skill definition (trigger, routing, rules)
└── references/
    ├── operation-map.md   # Endpoint details (path, params, docs URL, key fields)
    ├── caveats.md         # Common mistakes and edge cases
    ├── preflight.md       # Pre-request checklist (optional)
    └── templates.md       # Code templates (optional)
```

Each workflow skill:

```
birdeye-<workflow-name>/
├── SKILL.md              # Workflow definition (steps, composition, patterns)
└── references/           # (optional)
```

## Rate Limits by Tier

| Tier | Rate Limit | WebSocket |
|---|---|---|
| Standard | 1 rps | No |
| Lite | 15 rps | No |
| Starter | 15 rps | No |
| Premium | 50 rps / 1000 rpm | No |
| Business | 100 rps / 1500 rpm | Yes |
| Enterprise | Custom | Yes |

**Wallet API group**: 30 rpm hard limit regardless of tier.

## Version Management

Versions are tracked in `versions.json`. Bump a version, then:

```bash
# Update canonical SKILL.md + plugin copies
npx tsx scripts/compile-skills.ts

# Reinstall to Claude Code
./install.sh
```

---

## CLI Reference

```
birdeye-skills <command> [options]

Commands:
  install [options]       Install skills to AI assistants

  Platform targets:
    --claude              Install for Claude Code (default)
    --cursor              Install for Cursor (.cursor/rules/*.mdc)
    --codex               Generate AGENTS.md for OpenAI Codex CLI
    --bundle [file]       Generate bundled prompt for ChatGPT / OpenAI API
    --chatgpt             Alias for --bundle

  Skill selection:
    --all                 Install all 13 skills
    --domain              Install domain skills only (router + 8)
    --workflow            Install workflow skills only (4)
    <skill-name>          Install a specific skill

  Target:
    --project <dir>       Install to a specific project
    --path <dir>          Install to custom directory

  update                  Update all installed skills to latest version
  pull                    Pull latest from git/npm and update
  check                   Check for available updates
  list                    Show installed skills and versions
  info <skill-name>       Show details about a specific skill
  docs sync               Guide for syncing new API endpoints
  cache clear             Clear cached metadata
```
