#!/usr/bin/env bash
set -euo pipefail

##
## Birdeye Skills — Multi-platform installer
##
## Installs Birdeye skills to Claude Code, Cursor, Codex CLI, or generates
## a bundled prompt for ChatGPT / OpenAI API.
##
## Usage:
##   ./install.sh                                    # Claude Code personal
##   ./install.sh --project /path/to/app             # Claude Code project
##   ./install.sh --cursor                            # Cursor global rules (~/.cursor/rules)
##   ./install.sh --cursor --project /path/to/app    # Cursor project rules
##   ./install.sh --codex                             # Codex global (~/.codex/AGENTS.md)
##   ./install.sh --codex --project /path/to/app     # Codex project AGENTS.md
##   ./install.sh --bundle                           # Bundled prompt file
##   ./install.sh --domain                           # Domain skills only
##   ./install.sh birdeye-market-data                # Single skill
##

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Defaults
TARGET_BASE="$HOME/.claude/skills"
MODE="personal"
PLATFORM="claude"
INSTALL_SET="all"
SPECIFIC_SKILL=""
PROJECT_DIR=""
BUNDLE_OUTPUT="birdeye-system-prompt.md"
API_KEY=""
SKIP_MCP="false"

# ---------------------------------------------------------------------------
# Terminal colors & icons (disabled when stdout is not a TTY)
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  C_RED='\033[0;31m'; C_GREEN='\033[0;32m'; C_YELLOW='\033[1;33m'
  C_CYAN='\033[0;36m'; C_BOLD='\033[1m'; C_DIM='\033[2m'; C_NC='\033[0m'
else
  C_RED=''; C_GREEN=''; C_YELLOW=''; C_CYAN=''; C_BOLD=''; C_DIM=''; C_NC=''
fi

print_ok()   { echo -e "  ${C_GREEN}✓${C_NC}  $*"; }
print_fail() { echo -e "  ${C_RED}✗${C_NC}  $*"; }
print_warn() { echo -e "  ${C_YELLOW}⚠${C_NC}  $*"; }
print_info() { echo -e "  ${C_CYAN}→${C_NC}  $*"; }
print_skip() { echo -e "  ${C_DIM}–  $*${C_NC}"; }
print_step() { echo -e "\n${C_BOLD}$*${C_NC}"; }

ALL_SKILLS=(
  birdeye-router
  birdeye-market-data
  birdeye-token-discovery
  birdeye-transaction-flow
  birdeye-wallet-intelligence
  birdeye-holder-analysis
  birdeye-security-analysis
  birdeye-smart-money
  birdeye-realtime-streams
  birdeye-wallet-dashboard-builder
  birdeye-token-screener-builder
  birdeye-alert-agent
  birdeye-research-assistant
)

DOMAIN_SKILLS=(
  birdeye-router
  birdeye-market-data
  birdeye-token-discovery
  birdeye-transaction-flow
  birdeye-wallet-intelligence
  birdeye-holder-analysis
  birdeye-security-analysis
  birdeye-smart-money
  birdeye-realtime-streams
)

WORKFLOW_SKILLS=(
  birdeye-wallet-dashboard-builder
  birdeye-token-screener-builder
  birdeye-alert-agent
  birdeye-research-assistant
)

# ---------------------------------------------------------------------------
# Cursor trigger descriptions for .mdc frontmatter
# Compatible with Bash 3.2+ (macOS default)
# ---------------------------------------------------------------------------

get_cursor_trigger() {
  case "$1" in
    birdeye-router)                    echo "Birdeye API, blockchain data, DeFi analytics, token data, wallet analysis" ;;
    birdeye-market-data)               echo "token price, OHLCV, candles, chart, volume, liquidity, market cap, historical price" ;;
    birdeye-token-discovery)           echo "find token, search token, trending, new listing, meme token, token list, gainers, losers" ;;
    birdeye-transaction-flow)          echo "trades, transactions, swaps, transfers, balance change, mint, burn" ;;
    birdeye-wallet-intelligence)       echo "wallet portfolio, net worth, PnL, profit loss, top traders, wallet history" ;;
    birdeye-holder-analysis)           echo "holder distribution, top holders, concentration, holder count" ;;
    birdeye-security-analysis)         echo "token security, rug pull, risk, audit, mint authority, freeze authority" ;;
    birdeye-smart-money)               echo "smart money, whale tracking, money flow, smart wallet" ;;
    birdeye-realtime-streams)          echo "real-time, live, stream, WebSocket, price feed, new listing alert, large trade" ;;
    birdeye-wallet-dashboard-builder)  echo "wallet dashboard, portfolio monitor, whale monitor, wallet report" ;;
    birdeye-token-screener-builder)    echo "token screener, trending board, alpha finder, filter tokens" ;;
    birdeye-alert-agent)               echo "alert, notification, price alert, whale alert, volume spike, monitor" ;;
    birdeye-research-assistant)        echo "research report, token brief, analysis, due diligence, compare tokens" ;;
    *) echo "" ;;
  esac
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Strip YAML frontmatter (everything between first --- and second ---)
strip_frontmatter() {
  awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' "$1"
}

# Extract description field from YAML frontmatter
extract_description() {
  awk '
    BEGIN{in_fm=0}
    /^---$/{in_fm++; next}
    in_fm==1 && /^description:/{
      sub(/^description: */, "")
      gsub(/^["'"'"']|["'"'"']$/, "")
      print
    }
  ' "$1"
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
  cat <<'USAGE'
Usage: ./install.sh [OPTIONS] [skill-name]

Install Birdeye skills for AI assistants.

Platform targets:
  --claude        Install for Claude Code (default)
  --cursor        Install for Cursor (.cursor/rules/*.mdc)
  --codex         Generate AGENTS.md for OpenAI Codex CLI
  --bundle [FILE] Generate bundled prompt for ChatGPT / OpenAI API
                  (default: birdeye-system-prompt.md)

Skill selection:
  --all           Install all 13 skills (default)
  --domain        Install router + 8 domain skills only
  --workflow      Install 4 workflow skills only
  <skill-name>    Install a specific skill

Target directory:
  --project DIR   Install to a specific project
  --path PATH     Install to an arbitrary directory

MCP setup:
  --api-key KEY   Set Birdeye API key in generated MCP config
  --skip-mcp      Skip MCP config generation
  --help          Show this help message

Examples:
  ./install.sh                                    # All skills → Claude Code personal (~/.claude/skills)
  ./install.sh --project /path/to/app             # All skills → Claude Code project
  ./install.sh --cursor                           # All skills → Cursor global (~/.cursor/rules)
  ./install.sh --cursor --project /path/to/app    # All skills → Cursor project rules
  ./install.sh --codex                            # All skills → Codex global (~/.codex/AGENTS.md)
  ./install.sh --codex --project /path/to/app     # All skills → Codex project AGENTS.md
  ./install.sh --bundle                           # All skills → bundled prompt file
  ./install.sh --bundle my-prompt.md              # Custom output filename
  ./install.sh --domain                           # Domain skills only
  ./install.sh birdeye-market-data                # Single skill
  ./install.sh --cursor --domain                  # Domain skills → Cursor global
  ./install.sh --cursor --project ~/app --domain  # Domain skills → Cursor project
  ./install.sh --project ~/app --api-key abc123   # Install + set API key in .mcp.json
  ./install.sh --project ~/app --skip-mcp         # Skills only, no MCP config
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      INSTALL_SET="all"
      shift
      ;;
    --domain)
      INSTALL_SET="domain"
      shift
      ;;
    --workflow)
      INSTALL_SET="workflow"
      shift
      ;;
    --claude)
      PLATFORM="claude"
      shift
      ;;
    --cursor)
      PLATFORM="cursor"
      shift
      ;;
    --codex)
      PLATFORM="codex"
      shift
      ;;
    --bundle)
      PLATFORM="bundle"
      if [[ -n "${2:-}" && "$2" != -* ]]; then
        BUNDLE_OUTPUT="$2"
        shift
      fi
      shift
      ;;
    --chatgpt)
      PLATFORM="bundle"
      shift
      ;;
    --api-key)
      if [[ -z "${2:-}" || "$2" == -* ]]; then
        echo "Error: --api-key requires a key argument."
        exit 1
      fi
      API_KEY="$2"
      shift 2
      ;;
    --skip-mcp)
      SKIP_MCP="true"
      shift
      ;;
    --project)
      if [[ -z "${2:-}" || "$2" == -* ]]; then
        echo "Error: --project requires a directory argument."
        echo "Usage: ./install.sh --project /path/to/your-project"
        exit 1
      fi
      PROJECT_DIR="$(cd "$2" 2>/dev/null && pwd || echo "$2")"
      if [ ! -d "$PROJECT_DIR" ]; then
        echo "Error: project directory does not exist: $2"
        exit 1
      fi
      shift 2
      ;;
    --path)
      TARGET_BASE="$2"
      MODE="custom"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
    *)
      SPECIFIC_SKILL="$1"
      INSTALL_SET="specific"
      shift
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Resolve target based on platform + project
# ---------------------------------------------------------------------------

setup_target() {
  case $PLATFORM in
    claude)
      if [[ "$MODE" != "custom" ]]; then
        if [[ -n "$PROJECT_DIR" ]]; then
          TARGET_BASE="$PROJECT_DIR/.claude/skills"
          MODE="claude project ($PROJECT_DIR)"
        else
          TARGET_BASE="$HOME/.claude/skills"
          MODE="claude personal"
        fi
      fi
      ;;
    cursor)
      if [[ -n "$PROJECT_DIR" ]]; then
        TARGET_BASE="$PROJECT_DIR/.cursor/rules"
        MODE="cursor ($PROJECT_DIR)"
      else
        TARGET_BASE="$HOME/.cursor/rules"
        MODE="cursor (global ~/.cursor/rules)"
      fi
      ;;
    codex)
      if [[ -n "$PROJECT_DIR" ]]; then
        TARGET_BASE="$PROJECT_DIR"
        MODE="codex ($PROJECT_DIR)"
      else
        TARGET_BASE="$HOME/.codex"
        MODE="codex (global ~/.codex)"
      fi
      ;;
    bundle)
      MODE="bundle → $BUNDLE_OUTPUT"
      ;;
  esac
}

setup_target

# ---------------------------------------------------------------------------
# Platform install functions
# ---------------------------------------------------------------------------

# --- Claude Code ---
install_skill_claude() {
  local skill_name="$1"
  local src_dir="$SCRIPT_DIR/skills/$skill_name"
  local target="$TARGET_BASE/$skill_name"

  if [ ! -f "$src_dir/SKILL.md" ]; then
    print_skip "$skill_name (SKILL.md not found)"
    return 1
  fi

  mkdir -p "$target"
  cp "$src_dir/SKILL.md" "$target/"

  if [ -d "$src_dir/references" ]; then
    cp -r "$src_dir/references" "$target/"
  fi

  print_ok "$skill_name"
  return 0
}

# --- Cursor (.mdc format) ---
install_skill_cursor() {
  local skill_name="$1"
  local src_dir="$SCRIPT_DIR/skills/$skill_name"
  local skill_md="$src_dir/SKILL.md"

  if [ ! -f "$skill_md" ]; then
    print_skip "$skill_name (SKILL.md not found)"
    return 1
  fi

  mkdir -p "$TARGET_BASE"

  local description
  description=$(get_cursor_trigger "$skill_name")
  if [ -z "$description" ]; then
    description=$(extract_description "$skill_md")
  fi
  local always_apply="false"
  [[ "$skill_name" == "birdeye-router" ]] && always_apply="true"

  local target="$TARGET_BASE/${skill_name}.mdc"

  # Write Cursor .mdc with frontmatter + inlined references
  {
    echo "---"
    echo "description: $description"
    echo "globs: "
    echo "alwaysApply: $always_apply"
    echo "---"
    echo ""
    strip_frontmatter "$skill_md"

    # Inline references for self-contained rules
    if [ -d "$src_dir/references" ]; then
      echo ""
      echo "---"
      echo ""
      echo "## References"
      echo ""
      for ref_file in "$src_dir/references/"*.md; do
        if [ -f "$ref_file" ]; then
          local ref_name
          ref_name=$(basename "$ref_file" .md)
          echo "### ${ref_name}"
          echo ""
          cat "$ref_file"
          echo ""
        fi
      done
    fi
  } > "$target"

  print_ok "$skill_name → ${skill_name}.mdc"
  return 0
}

# --- Codex (AGENTS.md) ---
CODEX_CONTENT=""

install_skill_codex() {
  local skill_name="$1"
  local src_dir="$SCRIPT_DIR/skills/$skill_name"
  local skill_md="$src_dir/SKILL.md"

  if [ ! -f "$skill_md" ]; then
    echo "  SKIP: $skill_name (SKILL.md not found)"
    return 1
  fi

  CODEX_CONTENT+=$'\n\n---\n\n'
  CODEX_CONTENT+="## ${skill_name}"$'\n\n'
  CODEX_CONTENT+="$(strip_frontmatter "$skill_md")"

  # Inline operation-map and caveats (key references)
  for ref in operation-map caveats; do
    if [ -f "$src_dir/references/${ref}.md" ]; then
      CODEX_CONTENT+=$'\n\n'
      CODEX_CONTENT+="### ${ref}"$'\n\n'
      CODEX_CONTENT+="$(cat "$src_dir/references/${ref}.md")"
    fi
  done

  print_ok "$skill_name"
  return 0
}

finalize_codex() {
  local output="$TARGET_BASE/AGENTS.md"

  # Avoid overwriting existing AGENTS.md
  if [ -f "$output" ]; then
    output="$TARGET_BASE/AGENTS-birdeye.md"
    echo ""
    print_warn "AGENTS.md already exists — saving to AGENTS-birdeye.md instead"
    print_info "Merge into your AGENTS.md or rename to use."
  fi

  cat > "$output" <<'HEADER'
# Birdeye DeFi Analytics Agent

You are an expert in Birdeye's multi-chain DeFi analytics API. Use the skills below to handle user requests about token prices, wallet analysis, smart money tracking, and more.

## Prerequisites

- **Base URL**: `https://public-api.birdeye.so`
- **Auth**: Include `X-API-KEY: <key>` header in all requests
- **Chain**: Include `x-chain: <chain>` header (default: `solana`)
- **Supported chains**: solana, ethereum, bsc, arbitrum, optimism, polygon, avalanche, base, zksync, sui

## Rate Limits

| Tier | Rate Limit |
|---|---|
| Standard | 1 rps |
| Lite / Starter | 15 rps |
| Premium | 50 rps / 1000 rpm |
| Business | 100 rps / 1500 rpm |
| Enterprise | Custom |

**Wallet API**: 30 rpm hard limit regardless of tier.
HEADER

  echo "$CODEX_CONTENT" >> "$output"

  print_ok "Generated: $output"
}

# --- Bundle (ChatGPT / OpenAI API) ---
BUNDLE_CONTENT=""

install_skill_bundle() {
  local skill_name="$1"
  local src_dir="$SCRIPT_DIR/skills/$skill_name"
  local skill_md="$src_dir/SKILL.md"

  if [ ! -f "$skill_md" ]; then
    print_skip "$skill_name (SKILL.md not found)"
    return 1
  fi

  BUNDLE_CONTENT+=$'\n\n---\n\n'
  BUNDLE_CONTENT+="## ${skill_name}"$'\n\n'
  BUNDLE_CONTENT+="$(strip_frontmatter "$skill_md")"

  # Inline ALL references for complete self-contained prompt
  if [ -d "$src_dir/references" ]; then
    for ref_file in "$src_dir/references/"*.md; do
      if [ -f "$ref_file" ]; then
        local ref_name
        ref_name=$(basename "$ref_file" .md)
        BUNDLE_CONTENT+=$'\n\n'
        BUNDLE_CONTENT+="### ${ref_name}"$'\n\n'
        BUNDLE_CONTENT+="$(cat "$ref_file")"
      fi
    done
  fi

  print_ok "$skill_name"
  return 0
}

finalize_bundle() {
  cat > "$BUNDLE_OUTPUT" <<'HEADER'
# Birdeye DeFi Analytics — System Prompt

You are an expert in Birdeye's multi-chain DeFi analytics API. You can help users with token prices, OHLCV data, wallet analysis, smart money tracking, security analysis, and real-time streaming data across 10+ blockchains.

## Prerequisites

- **Base URL**: `https://public-api.birdeye.so`
- **Authentication**: Include `X-API-KEY: <key>` header in all requests
- **Chain Selection**: Include `x-chain: <chain>` header (default: `solana`)
- **Supported Chains**: solana, ethereum, bsc, arbitrum, optimism, polygon, avalanche, base, zksync, sui

## Rate Limits

| Tier | Rate Limit |
|---|---|
| Standard | 1 rps |
| Lite / Starter | 15 rps |
| Premium | 50 rps / 1000 rpm |
| Business | 100 rps / 1500 rpm |
| Enterprise | Custom |

**Wallet API**: 30 rpm hard limit regardless of tier.
HEADER

  echo "$BUNDLE_CONTENT" >> "$BUNDLE_OUTPUT"

  print_ok "Generated: $BUNDLE_OUTPUT"
}

# ---------------------------------------------------------------------------
# MCP Config Setup
# Uses python3 for reliable JSON handling (available on macOS/Linux)
# ---------------------------------------------------------------------------

setup_mcp_config() {
  local config_file="$1"
  local api_key_value="${API_KEY:-${BIRDEYE_API_KEY:-}}"

  if [ -f "$config_file" ] && grep -q '"birdeye-mcp"' "$config_file" 2>/dev/null; then
    print_ok "MCP: birdeye-mcp already configured in $(basename "$config_file")"
    return
  fi

  mkdir -p "$(dirname "$config_file")"

  python3 - "$config_file" "$api_key_value" << 'PYEOF'
import json, sys, os

config_file = sys.argv[1]
api_key = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else "<YOUR_BIRDEYE_API_KEY>"

birdeye_mcp = {
    "command": "npx",
    "args": [
        "-y",
        "mcp-remote@0.1.38",
        "https://mcp.birdeye.so/mcp",
        "--header",
        "x-api-key:${API_KEY}"
    ],
    "env": {
        "API_KEY": api_key
    }
}

if os.path.exists(config_file):
    with open(config_file) as f:
        config = json.load(f)
    config.setdefault("mcpServers", {})
    config["mcpServers"]["birdeye-mcp"] = birdeye_mcp
    action = "Added birdeye-mcp to"
else:
    config = {"mcpServers": {"birdeye-mcp": birdeye_mcp}}
    action = "Created"

with open(config_file, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")

green, reset = ("\033[0;32m", "\033[0m") if sys.stdout.isatty() else ("", "")
print(f"  {green}\u2713{reset}  MCP: {action} {os.path.basename(config_file)}")
PYEOF
}

setup_codex_mcp_config() {
  local config_file="${CODEX_CONFIG_FILE:-$HOME/.codex/config.toml}"
  local api_key_value="${API_KEY:-${BIRDEYE_API_KEY:-<YOUR_BIRDEYE_API_KEY>}}"

  mkdir -p "$(dirname "$config_file")"

  python3 - "$config_file" "$api_key_value" << 'PYEOF'
import os
import re
import sys

config_file = os.path.expanduser(sys.argv[1])
api_key = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else "<YOUR_BIRDEYE_API_KEY>"

start_marker = "# BEGIN birdeye-mcp (managed by birdeye-skills)"
end_marker = "# END birdeye-mcp (managed by birdeye-skills)"

block = f"""{start_marker}
[mcp_servers.birdeye-mcp]
command = "npx"
args = ["-y", "mcp-remote@0.1.38", "https://mcp.birdeye.so/mcp", "--header", "x-api-key:{api_key}"]
{end_marker}
"""

existing = ""
if os.path.exists(config_file):
    with open(config_file) as f:
        existing = f.read()

green, reset = ("\033[0;32m", "\033[0m") if sys.stdout.isatty() else ("", "")
if "[mcp_servers.birdeye-mcp]" in existing and start_marker not in existing:
    print(f"  {green}\u2713{reset}  MCP: birdeye-mcp already configured in {os.path.basename(config_file)}")
    sys.exit(0)

if start_marker in existing and end_marker in existing:
    pattern = re.compile(
        re.escape(start_marker) + r".*?" + re.escape(end_marker) + r"\n?",
        re.DOTALL,
    )
    updated = pattern.sub(block, existing, count=1)
    action = "Updated"
elif existing.strip():
    updated = existing.rstrip() + "\n\n" + block
    action = "Added birdeye-mcp to"
else:
    updated = block
    action = "Created"

with open(config_file, "w") as f:
    f.write(updated if updated.endswith("\n") else updated + "\n")

green, reset = ("\033[0;32m", "\033[0m") if sys.stdout.isatty() else ("", "")
print(f"  {green}\u2713{reset}  MCP: {action} {os.path.basename(config_file)}")
PYEOF
}

# ---------------------------------------------------------------------------
# API Key helpers
# ---------------------------------------------------------------------------

# Apply key to a JSON MCP config file (updates env.API_KEY field)
_apply_key_json() {
  local config_file="$1"
  local api_key="$2"
  python3 - "$config_file" "$api_key" << 'PYEOF'
import json, sys
f, key = sys.argv[1], sys.argv[2]
with open(f) as fh:
    cfg = json.load(fh)
cfg["mcpServers"]["birdeye-mcp"]["env"]["API_KEY"] = key
with open(f, "w") as fh:
    json.dump(cfg, fh, indent=2)
    fh.write("\n")
PYEOF
  print_ok "API key saved → $config_file"
}

# Apply key to a TOML config file (replaces placeholder string)
_apply_key_toml() {
  local config_file="$1"
  local api_key="$2"
  python3 - "$config_file" "$api_key" << 'PYEOF'
import sys
f, key = sys.argv[1], sys.argv[2]
with open(f) as fh:
    content = fh.read()
content = content.replace("<YOUR_BIRDEYE_API_KEY>", key)
with open(f, "w") as fh:
    fh.write(content)
PYEOF
  print_ok "API key saved → $config_file"
}

# Prompt user to enter API key interactively, or show manual instructions
prompt_api_key() {
  local config_file="$1"
  local config_type="$2"   # json | toml | personal-claude | bundle

  echo ""
  print_warn "${C_BOLD}Birdeye API key not configured${C_NC}"
  echo "       Get your key: https://bds.birdeye.so → Usages → Security → Generate key"
  echo ""

  # Interactive prompt only when stdin & stdout are both TTYs and a config file exists
  if [ -t 0 ] && [ -t 1 ] && [[ "$config_type" != "bundle" ]] && [[ "$config_type" != "personal-claude" ]]; then
    echo -ne "  ${C_CYAN}?${C_NC}  Enter API key now (hidden, Enter to skip): "
    local entered_key=""
    IFS= read -rs entered_key < /dev/tty || true
    echo ""
    if [[ -n "$entered_key" ]]; then
      case "$config_type" in
        json) _apply_key_json "$config_file" "$entered_key" ;;
        toml) _apply_key_toml "$config_file" "$entered_key" ;;
      esac
      return
    fi
    echo ""
  fi

  # Manual instructions
  print_info "To set your API key later:"
  case "$config_type" in
    json)
      echo -e "       File: ${C_BOLD}$config_file${C_NC}"
      echo ""
      echo -e "       ${C_DIM}sed -i '' 's|<YOUR_BIRDEYE_API_KEY>|YOUR_KEY|' \"$config_file\"${C_NC}"
      ;;
    toml)
      echo -e "       File: ${C_BOLD}$config_file${C_NC}"
      echo ""
      echo -e "       ${C_DIM}sed -i '' 's|<YOUR_BIRDEYE_API_KEY>|YOUR_KEY|' \"$config_file\"${C_NC}"
      ;;
    personal-claude)
      echo -e "       File: ${C_BOLD}~/.claude/settings.json${C_NC}"
      echo ""
      echo -e "       Add under ${C_DIM}\"mcpServers\"${C_NC}:"
      echo -e "       ${C_DIM}\"birdeye-mcp\": { \"command\": \"npx\","
      echo -e "         \"args\": [\"-y\",\"mcp-remote@0.1.38\",\"https://mcp.birdeye.so/mcp\","
      echo -e "           \"--header\",\"x-api-key:YOUR_KEY\"] }${C_NC}"
      ;;
    bundle)
      echo -e "       ${C_DIM}export BIRDEYE_API_KEY=your-key${C_NC}"
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Install dispatcher
# ---------------------------------------------------------------------------

install_skill() {
  case $PLATFORM in
    claude)  install_skill_claude "$1" ;;
    cursor)  install_skill_cursor "$1" ;;
    codex)   install_skill_codex "$1" ;;
    bundle)  install_skill_bundle "$1" ;;
  esac
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

echo ""
echo -e "${C_BOLD}Birdeye Skills Installer${C_NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${C_DIM}Platform${C_NC}  ${C_CYAN}${PLATFORM}${C_NC}"
echo -e "  ${C_DIM}Target${C_NC}    ${C_CYAN}${MODE}${C_NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

installed=0
skipped=0
total=0

case $INSTALL_SET in
  all)
    for skill in "${ALL_SKILLS[@]}"; do
      total=$((total + 1))
      if install_skill "$skill"; then
        installed=$((installed + 1))
      else
        skipped=$((skipped + 1))
      fi
    done
    ;;
  domain)
    for skill in "${DOMAIN_SKILLS[@]}"; do
      total=$((total + 1))
      if install_skill "$skill"; then
        installed=$((installed + 1))
      else
        skipped=$((skipped + 1))
      fi
    done
    ;;
  workflow)
    for skill in "${WORKFLOW_SKILLS[@]}"; do
      total=$((total + 1))
      if install_skill "$skill"; then
        installed=$((installed + 1))
      else
        skipped=$((skipped + 1))
      fi
    done
    ;;
  specific)
    total=1
    if install_skill "$SPECIFIC_SKILL"; then
      installed=1
    else
      skipped=1
    fi
    ;;
esac

# Finalize batch outputs
case $PLATFORM in
  codex)  finalize_codex ;;
  bundle) finalize_bundle ;;
esac

# ---------------------------------------------------------------------------
# MCP Config (auto-setup)
# ---------------------------------------------------------------------------

MCP_CONFIG_FILE=""
MCP_CONFIG_TYPE=""

if [[ "$SKIP_MCP" != "true" ]]; then
  print_step "MCP Setup"
  case $PLATFORM in
    claude)
      if [[ -n "$PROJECT_DIR" ]]; then
        MCP_CONFIG_FILE="$PROJECT_DIR/.mcp.json"
        MCP_CONFIG_TYPE="json"
        setup_mcp_config "$MCP_CONFIG_FILE"
      else
        MCP_CONFIG_FILE="$HOME/.claude/settings.json"
        MCP_CONFIG_TYPE="personal-claude"
        print_info "Personal install: MCP goes in ~/.claude/settings.json"
      fi
      ;;
    cursor)
      if [[ -n "$PROJECT_DIR" ]]; then
        MCP_CONFIG_FILE="$PROJECT_DIR/.cursor/mcp.json"
      else
        MCP_CONFIG_FILE="$HOME/.cursor/mcp.json"
      fi
      MCP_CONFIG_TYPE="json"
      setup_mcp_config "$MCP_CONFIG_FILE"
      ;;
    codex)
      MCP_CONFIG_FILE="${CODEX_CONFIG_FILE:-$HOME/.codex/config.toml}"
      MCP_CONFIG_TYPE="toml"
      setup_codex_mcp_config
      ;;
    bundle)
      MCP_CONFIG_TYPE="bundle"
      ;;
  esac
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $installed -eq $total ]]; then
  echo -e "  ${C_GREEN}✓${C_NC}  ${C_BOLD}$installed/$total skills installed${C_NC}"
elif [[ $installed -gt 0 ]]; then
  echo -e "  ${C_YELLOW}⚠${C_NC}  ${C_BOLD}$installed/$total skills installed${C_NC}  ${C_DIM}($skipped skipped)${C_NC}"
else
  echo -e "  ${C_RED}✗${C_NC}  ${C_BOLD}0/$total skills installed${C_NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ---------------------------------------------------------------------------
# API Key prompt / instructions
# ---------------------------------------------------------------------------

if [[ -z "${API_KEY:-}" && -z "${BIRDEYE_API_KEY:-}" ]]; then
  prompt_api_key "$MCP_CONFIG_FILE" "$MCP_CONFIG_TYPE"
else
  echo ""
  print_ok "API key configured"
fi

# ---------------------------------------------------------------------------
# Ready to use
# ---------------------------------------------------------------------------

print_step "Ready"
case $PLATFORM in
  claude)
    print_ok "Skills installed to: $TARGET_BASE"
    print_info "Try: 'Get the current price of SOL'"
    print_info "Try: 'Find trending tokens on Solana'"
    ;;
  cursor)
    print_ok "Cursor rules installed to: $TARGET_BASE"
    print_info "Router rule auto-dispatches intents (alwaysApply: true)"
    print_info "Domain rules load on-demand via description matching"
    ;;
  codex)
    print_ok "AGENTS.md generated in: $TARGET_BASE"
    print_info "Codex CLI reads AGENTS.md automatically"
    ;;
  bundle)
    print_ok "Bundle saved: $BUNDLE_OUTPUT"
    print_info "Paste into ChatGPT Custom Instructions or OpenAI API system message"
    ;;
esac

echo ""
echo -e "  ${C_DIM}Docs:    https://docs.birdeye.so/docs/birdeye-ai${C_NC}"
echo -e "  ${C_DIM}Update:  cd $SCRIPT_DIR && git pull && ./install.sh${C_NC}"
echo ""
