# Birdeye Skills — System Prompt Integration Guide

## 3-Layer Architecture

Birdeye skills operate in a 3-layer system:

### Layer A: Harness (Runtime)
The harness is the AI assistant runtime (Claude Code, Cursor, etc.). It handles:
- User interaction
- Tool execution
- File I/O
- MCP server communication

### Layer B: Skills (Domain Knowledge)
Skills contain canonical Birdeye API expertise in SKILL.md files. They provide:
- Endpoint routing tables
- Operation maps with exact parameters
- Output schemas
- Code templates
- Caveats and common mistakes

### Layer C: Task (User Request)
The user's specific request, processed by the harness using skill knowledge.

## Skill Loading Strategy

### Router-First Approach
1. Load `birdeye-router/SKILL.md` at conversation start
2. When user intent is identified, load the relevant domain skill
3. For complex use cases, load the appropriate workflow skill

### Lazy Loading
- Don't load all 14 skills at once — too many tokens
- Load domain skills on-demand based on router disambiguation
- Reference files are loaded only when the specific endpoint is needed

## Integration Patterns

### Claude Code (Plugin)

```
birdeye-plugin/
├── .claude-plugin
└── skills/
    ├── router/
    │   └── SKILL.md
    ├── market-data/
    │   ├── SKILL.md
    │   └── references/
    ├── token-discovery/
    │   ├── SKILL.md
    │   └── references/
    ... (all 14 skills)
```

### CLI Agent

```
.agents/
└── skills/
    ├── birdeye-router/
    │   ├── SKILL.md
    │   └── prompts/
    │       ├── claude.system.md
    │       ├── openai.developer.md
    │       └── full.md
    ├── birdeye-market-data/
    │   ├── SKILL.md
    │   ├── references/
    │   └── prompts/
    ... (all 14 skills)
```

### Cursor

```
<project>/.cursor/rules/
├── birdeye-router.mdc           # alwaysApply: true — intent dispatcher
├── birdeye-market-data.mdc      # on-demand — price, OHLCV, stats
├── birdeye-token-discovery.mdc  # on-demand — search, trending, meme
├── birdeye-transaction-flow.mdc # on-demand — trades, transfers
├── birdeye-wallet-intelligence.mdc
├── birdeye-holder-analysis.mdc
├── birdeye-security-analysis.mdc
├── birdeye-smart-money.mdc
├── birdeye-realtime-streams.mdc
├── birdeye-wallet-dashboard-builder.mdc
├── birdeye-token-screener-builder.mdc
├── birdeye-alert-agent.mdc
└── birdeye-research-assistant.mdc
```

Each `.mdc` file has Cursor frontmatter with `description` (trigger keywords) and `alwaysApply`.
References are inlined into the `.mdc` for self-contained rules.

Install: `./install.sh --cursor --project /path/to/your-project`

### OpenAI Codex CLI

```
<project>/
└── AGENTS.md    # All skills bundled with all reference files + shared birdeye-indexer references
```

Single `AGENTS.md` file with all Birdeye API knowledge. Codex CLI reads this automatically.
If an existing `AGENTS.md` is found, output is saved as `AGENTS-birdeye.md`.

Install: `./install.sh --codex --project /path/to/your-project`

### ChatGPT / OpenAI API

```
birdeye-system-prompt.md    # Complete bundled prompt with all skills + all references
```

Self-contained prompt file for pasting into ChatGPT Custom Instructions or injecting as
an OpenAI API system message.

Install: `./install.sh --bundle` or `./install.sh --bundle custom-name.md`

### npm Package (MCP Server)

```typescript
import { loadBirdeyeSkill } from 'birdeye-mcp';

// Load skill content for system prompt injection
const marketDataSkill = loadBirdeyeSkill('birdeye-market-data');
const routerSkill = loadBirdeyeSkill('birdeye-router');

// Use in system prompt
const systemPrompt = `${routerSkill}\n\n${marketDataSkill}`;
```

## Skill Description Format for Triggers

When registering skills with a harness, use these descriptions:

```yaml
birdeye-router:
  trigger: "Birdeye API, blockchain data, DeFi analytics, token data, wallet analysis"

birdeye-market-data:
  trigger: "token price, OHLCV, candles, chart, volume, liquidity, market cap, historical price"

birdeye-token-discovery:
  trigger: "find token, search token, trending, new listing, meme token, token list, gainers, losers"

birdeye-transaction-flow:
  trigger: "trades, transactions, swaps, transfers, balance change, mint, burn"

birdeye-wallet-intelligence:
  trigger: "wallet portfolio, net worth, PnL, profit loss, top traders, wallet history"

birdeye-holder-analysis:
  trigger: "holder distribution, top holders, concentration, holder count"

birdeye-security-analysis:
  trigger: "token security, rug pull, risk, audit, mint authority, freeze authority"

birdeye-smart-money:
  trigger: "smart money, whale tracking, money flow, smart wallet"

birdeye-realtime-streams:
  trigger: "real-time, live, stream, WebSocket, price feed, new listing alert, large trade"

birdeye-wallet-dashboard-builder:
  trigger: "wallet dashboard, portfolio monitor, whale monitor, wallet report"

birdeye-token-screener-builder:
  trigger: "token screener, trending board, alpha finder, filter tokens"

birdeye-alert-agent:
  trigger: "alert, notification, price alert, whale alert, volume spike, monitor"

birdeye-research-assistant:
  trigger: "research report, token brief, analysis, due diligence, compare tokens"
```
