#!/usr/bin/env node

/**
 * Birdeye Skills CLI
 *
 * Install, update, and manage Birdeye AI skills for Claude Code, Cursor,
 * Codex CLI, ChatGPT, and other AI assistants.
 *
 * Usage:
 *   birdeye-skills install [--all | skill-name]   Install skills
 *   birdeye-skills install --cursor --project DIR  Install as Cursor rules
 *   birdeye-skills install --codex --project DIR   Generate AGENTS.md
 *   birdeye-skills install --bundle                Generate bundled prompt
 *   birdeye-skills update                          Update all installed skills
 *   birdeye-skills list                            List installed skills
 *   birdeye-skills check                           Check for updates
 *   birdeye-skills info <skill-name>               Show skill details
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PKG_ROOT = resolve(__dirname, '..');
const LOCAL_SKILLS_DIR = join(PKG_ROOT, 'skills');
const HOME = process.env.HOME || process.env.USERPROFILE || '~';
const CONFIG_DIR = join(HOME, '.birdeye');
const CONFIG_FILE = join(CONFIG_DIR, 'skills-config.json');
const SKILL_TTL_DAYS = 7;    // agent warns user to update after this many days

// Colors & icons (disabled when not a TTY)
const isTTY = process.stdout.isTTY;
const C = {
  green:  isTTY ? '\x1b[0;32m' : '', red:    isTTY ? '\x1b[0;31m' : '',
  yellow: isTTY ? '\x1b[1;33m' : '', cyan:   isTTY ? '\x1b[0;36m' : '',
  bold:   isTTY ? '\x1b[1m'    : '', dim:    isTTY ? '\x1b[2m'    : '',
  reset:  isTTY ? '\x1b[0m'    : '',
};
const ok   = (m) => console.log(`  ${C.green}✓${C.reset}  ${m}`);
const warn = (m) => console.log(`  ${C.yellow}⚠${C.reset}  ${m}`);
const info = (m) => console.log(`  ${C.cyan}→${C.reset}  ${m}`);
const skip = (m) => console.log(`  ${C.dim}–  ${m}${C.reset}`);

const CLAUDE_SKILLS_DIR    = join(HOME, '.claude', 'skills');
const CURSOR_RULES_DIR     = join(HOME, '.cursor', 'rules');
const CODEX_DIR            = join(HOME, '.codex');
const DOCS_MCP_DIR         = join(PKG_ROOT, 'birdeye-mcp');
const DOCS_MCP_INDEX       = join(DOCS_MCP_DIR, 'index.js');

const ALL_SKILLS = [
  'birdeye-router',
  'birdeye-indexer',
  'birdeye-market-data',
  'birdeye-token-discovery',
  'birdeye-transaction-flow',
  'birdeye-wallet-intelligence',
  'birdeye-holder-analysis',
  'birdeye-security-analysis',
  'birdeye-smart-money',
  'birdeye-realtime-streams',
  'birdeye-wallet-dashboard-builder',
  'birdeye-token-screener-builder',
  'birdeye-alert-agent',
  'birdeye-research-assistant',
];

const DOMAIN_SKILLS = ALL_SKILLS.filter(s => !s.includes('builder') && !s.includes('agent') && !s.includes('assistant') && s !== 'birdeye-router');
const WORKFLOW_SKILLS = ALL_SKILLS.filter(s => s.includes('builder') || s.includes('agent') || s.includes('assistant'));

// Cursor trigger descriptions for .mdc frontmatter
const CURSOR_TRIGGERS = {
  'birdeye-router': 'Birdeye API, blockchain data, DeFi analytics, token data, wallet analysis',
  'birdeye-market-data': 'token price, OHLCV, candles, chart, volume, liquidity, market cap, historical price',
  'birdeye-token-discovery': 'find token, search token, trending, new listing, meme token, token list, gainers, losers',
  'birdeye-transaction-flow': 'trades, transactions, swaps, transfers, balance change, mint, burn',
  'birdeye-wallet-intelligence': 'wallet portfolio, net worth, PnL, profit loss, top traders, wallet history',
  'birdeye-holder-analysis': 'holder distribution, top holders, concentration, holder count',
  'birdeye-security-analysis': 'token security, rug pull, risk, audit, mint authority, freeze authority',
  'birdeye-smart-money': 'smart money, whale tracking, money flow, smart wallet',
  'birdeye-realtime-streams': 'real-time, live, stream, WebSocket, price feed, new listing alert, large trade',
  'birdeye-wallet-dashboard-builder': 'wallet dashboard, portfolio monitor, whale monitor, wallet report',
  'birdeye-token-screener-builder': 'token screener, trending board, alpha finder, filter tokens',
  'birdeye-alert-agent': 'alert, notification, price alert, whale alert, volume spike, monitor',
  'birdeye-research-assistant': 'research report, token brief, analysis, due diligence, compare tokens',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripFrontmatter(content) {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[1] : content;
}

function extractDescription(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return '';
  const fmMatch = match[1].match(/^description:\s*["']?(.+?)["']?\s*$/m);
  return fmMatch ? fmMatch[1] : '';
}

// ---------------------------------------------------------------------------
// Config Management
// ---------------------------------------------------------------------------

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { installed: {}, lastCheck: null };
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadVersions() {
  const versionsPath = join(LOCAL_SKILLS_DIR, 'versions.json');
  if (!existsSync(versionsPath)) return {};
  return JSON.parse(readFileSync(versionsPath, 'utf-8'));
}

// ---------------------------------------------------------------------------
// Platform Install: Claude Code
// ---------------------------------------------------------------------------

function installSkillClaude(skillName, targetBase, mode = 'personal', skipGlobalConfig = false) {
  const srcDir = join(LOCAL_SKILLS_DIR, skillName);
  const skillMdPath = join(srcDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.error(`  Error: ${skillName}/SKILL.md not found at ${srcDir}`);
    return false;
  }

  const target = join(targetBase, skillName);
  mkdirSync(target, { recursive: true });

  cpSync(skillMdPath, join(target, 'SKILL.md'));

  const refsDir = join(srcDir, 'references');
  if (existsSync(refsDir)) {
    cpSync(refsDir, join(target, 'references'), { recursive: true });
  }

  // Write install metadata
  const versions = loadVersions();
  const meta = {
    skill: skillName,
    version: versions[skillName] || '1.0.0',
    installedAt: new Date().toISOString(),
    source: 'local',
    platform: 'claude',
  };
  writeFileSync(join(target, '.birdeye-meta.json'), JSON.stringify(meta, null, 2));

  // Update global config (skipped for project installs — project path is tracked locally via .birdeye-meta.json)
  if (!skipGlobalConfig) {
    const config = loadConfig();
    config.installed = config.installed || {};
    config.installed[skillName] = {
      version: meta.version,
      installedAt: meta.installedAt,
      path: target,
      mode,
      platform: 'claude',
    };
    saveConfig(config);
  }

  ok(skillName);
  return true;
}

// ---------------------------------------------------------------------------
// Platform Install: Cursor (.mdc rules)
// ---------------------------------------------------------------------------

function installSkillCursor(skillName, targetBase) {
  const srcDir = join(LOCAL_SKILLS_DIR, skillName);
  const skillMdPath = join(srcDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.error(`  Error: ${skillName}/SKILL.md not found`);
    return false;
  }

  mkdirSync(targetBase, { recursive: true });

  const content = readFileSync(skillMdPath, 'utf-8');
  const description = CURSOR_TRIGGERS[skillName] || extractDescription(content);
  const alwaysApply = skillName === 'birdeye-router' ? 'true' : 'false';
  const body = stripFrontmatter(content);

  // Build .mdc content
  let mdc = `---\ndescription: ${description}\nglobs: \nalwaysApply: ${alwaysApply}\n---\n\n${body}`;

  // Inline references
  const refsDir = join(srcDir, 'references');
  if (existsSync(refsDir)) {
    mdc += '\n\n---\n\n## References\n';
    for (const file of readdirSync(refsDir).filter(f => f.endsWith('.md'))) {
      const refContent = readFileSync(join(refsDir, file), 'utf-8');
      const refName = file.replace('.md', '');
      mdc += `\n### ${refName}\n\n${refContent}\n`;
    }
  }

  writeFileSync(join(targetBase, `${skillName}.mdc`), mdc);
  ok(`${skillName} → ${skillName}.mdc`);
  return true;
}

// ---------------------------------------------------------------------------
// Platform Install: Codex (AGENTS.md)
// ---------------------------------------------------------------------------

function installSkillsCodex(skillNames, targetBase) {
  const outputPath = existsSync(join(targetBase, 'AGENTS.md'))
    ? join(targetBase, 'AGENTS-birdeye.md')
    : join(targetBase, 'AGENTS.md');

  if (outputPath.endsWith('AGENTS-birdeye.md')) {
    warn('AGENTS.md already exists — saving to AGENTS-birdeye.md instead');
    info('Merge into your AGENTS.md or rename to use.');
    console.log('');
  }

  let content = `# Birdeye DeFi Analytics Agent

You are an expert in Birdeye's multi-chain DeFi analytics API. All domain skills are bundled in this file — use the relevant section directly without routing or delegation.

## Prerequisites

- **Base URL**: \`https://public-api.birdeye.so\`
- **Auth**: Include \`X-API-KEY: <key>\` header in all requests
- **Chain**: Include \`x-chain: <chain>\` header (default: \`solana\`)
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

## Intent → Section Map

| User asks about | Go to section |
|---|---|
| token price, OHLCV, candles, chart | birdeye-market-data |
| find token, trending, new listing, search | birdeye-token-discovery |
| trades, transactions, balance change, mint/burn | birdeye-transaction-flow |
| wallet portfolio, net worth, PnL, top traders | birdeye-wallet-intelligence |
| holder distribution, top holders, concentration | birdeye-holder-analysis |
| rug pull, security risk, mint/freeze authority | birdeye-security-analysis |
| smart money, whale flow, smart wallets | birdeye-smart-money |
| real-time, live stream, WebSocket | birdeye-realtime-streams |
| wallet dashboard, portfolio monitor | birdeye-wallet-dashboard-builder |
| token screener, alpha finder | birdeye-token-screener-builder |
| price/whale alert, volume spike monitor | birdeye-alert-agent |
| research report, due diligence | birdeye-research-assistant |
`;

  // Inline birdeye-indexer as Shared References (source of truth for all endpoints)
  const indexerDir = join(LOCAL_SKILLS_DIR, 'birdeye-indexer');
  const indexerRefsDir = join(indexerDir, 'references');
  if (existsSync(indexerRefsDir)) {
    content += `\n\n---\n\n## Shared References (birdeye-indexer)\n\n`;
    content += `> Canonical endpoint dictionary and shared policies used by all skills below.\n`;
    for (const file of readdirSync(indexerRefsDir).filter(f => f.endsWith('.md')).sort()) {
      content += `\n\n### ${file.replace('.md', '')}\n\n${readFileSync(join(indexerRefsDir, file), 'utf-8')}`;
    }
    ok('birdeye-indexer (shared references)');
  }

  let installed = 0;
  // Skip router (routing meta-instructions are noise in a flat file) and indexer (already inlined above)
  const CODEX_SKIP = new Set(['birdeye-router', 'birdeye-indexer']);

  for (const skillName of skillNames) {
    if (CODEX_SKIP.has(skillName)) continue;

    const srcDir = join(LOCAL_SKILLS_DIR, skillName);
    const skillMdPath = join(srcDir, 'SKILL.md');

    if (!existsSync(skillMdPath)) {
      skip(`${skillName} (SKILL.md not found)`);
      continue;
    }

    const raw = readFileSync(skillMdPath, 'utf-8');
    content += `\n\n---\n\n## ${skillName}\n\n${stripFrontmatter(raw)}`;

    // Inline ALL reference files (not just operation-map + caveats)
    const refsDir = join(srcDir, 'references');
    if (existsSync(refsDir)) {
      for (const file of readdirSync(refsDir).filter(f => f.endsWith('.md')).sort()) {
        content += `\n\n### ${file.replace('.md', '')}\n\n${readFileSync(join(refsDir, file), 'utf-8')}`;
      }
    }

    ok(skillName);
    installed++;
  }

  writeFileSync(outputPath, content);
  console.log(`\n  Generated: ${outputPath}`);
  // Count includes CODEX_SKIP skills (router replaced by intent map, indexer inlined as shared refs)
  return installed + CODEX_SKIP.size;
}

// ---------------------------------------------------------------------------
// Platform Install: Bundle (ChatGPT / OpenAI API)
// ---------------------------------------------------------------------------

function installSkillsBundle(skillNames, outputPath) {
  let content = `# Birdeye DeFi Analytics — System Prompt

You are an expert in Birdeye's multi-chain DeFi analytics API. You can help users with token prices, OHLCV data, wallet analysis, smart money tracking, security analysis, and real-time streaming data across 10+ blockchains.

## Prerequisites

- **Base URL**: \`https://public-api.birdeye.so\`
- **Authentication**: Include \`X-API-KEY: <key>\` header in all requests
- **Chain Selection**: Include \`x-chain: <chain>\` header (default: \`solana\`)
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
`;

  let installed = 0;
  for (const skillName of skillNames) {
    const srcDir = join(LOCAL_SKILLS_DIR, skillName);
    const skillMdPath = join(srcDir, 'SKILL.md');

    if (!existsSync(skillMdPath)) {
      skip(`${skillName} (SKILL.md not found)`);
      continue;
    }

    const raw = readFileSync(skillMdPath, 'utf-8');
    content += `\n\n---\n\n## ${skillName}\n\n${stripFrontmatter(raw)}`;

    // Inline ALL references for complete prompt
    const refsDir = join(srcDir, 'references');
    if (existsSync(refsDir)) {
      for (const file of readdirSync(refsDir).filter(f => f.endsWith('.md'))) {
        const refContent = readFileSync(join(refsDir, file), 'utf-8');
        const refName = file.replace('.md', '');
        content += `\n\n### ${refName}\n\n${refContent}`;
      }
    }

    ok(skillName);
    installed++;
  }

  writeFileSync(outputPath, content);
  console.log('');
  ok(`Generated: ${outputPath}`);
  return installed;
}

// ---------------------------------------------------------------------------
// MCP Config Setup
// ---------------------------------------------------------------------------

const BIRDEYE_MCP_CONFIG = {
  command: 'npx',
  args: [
    '-y',
    'mcp-remote@0.1.38',
    'https://mcp.birdeye.so/mcp',
    '--header',
    'x-api-key:${API_KEY}',
  ],
  env: {
    API_KEY: '<YOUR_BIRDEYE_API_KEY>',
  },
};

function readApiKey() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) { resolve(''); return; }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(`  ${C.cyan}?${C.reset}  Enter API key now (hidden, Enter to skip): `);
    let muted = true;
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk, ...rest) => {
      if (muted && typeof chunk === 'string' && chunk !== '\n' && chunk !== '\r\n') return true;
      return origWrite(chunk, ...rest);
    };
    rl.once('line', (line) => {
      muted = false;
      process.stdout.write = origWrite;
      origWrite('\n');
      rl.close();
      resolve(line.trim());
    });
  });
}

function setupMcpConfig(configFile, apiKey) {
  const configDir = dirname(configFile);
  mkdirSync(configDir, { recursive: true });

  const mcpEntry = { ...BIRDEYE_MCP_CONFIG };
  if (apiKey) {
    mcpEntry.env = { API_KEY: apiKey };
  }

  if (existsSync(configFile)) {
    const existing = JSON.parse(readFileSync(configFile, 'utf-8'));
    if (existing.mcpServers && existing.mcpServers['birdeye-mcp']) {
      ok('MCP: birdeye-mcp already configured');
      return;
    }
    existing.mcpServers = existing.mcpServers || {};
    existing.mcpServers['birdeye-mcp'] = mcpEntry;
    writeFileSync(configFile, JSON.stringify(existing, null, 2) + '\n');
    ok(`MCP: Added birdeye-mcp to ${configFile.split('/').pop()}`);
  } else {
    const config = { mcpServers: { 'birdeye-mcp': mcpEntry } };
    writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');
    ok(`MCP: Created ${configFile.split('/').pop()}`);
  }
}

function setupDocsMcp(configFile) {
  if (!existsSync(DOCS_MCP_INDEX)) {
    skip('birdeye-api-docs: birdeye-mcp/index.js not found — skipping');
    return;
  }

  // npm install if node_modules missing
  const nodeModules = join(DOCS_MCP_DIR, 'node_modules');
  if (!existsSync(nodeModules)) {
    info('birdeye-api-docs: running npm install in birdeye-mcp/ ...');
    try {
      execSync('npm install --prefer-offline', { cwd: DOCS_MCP_DIR, stdio: 'pipe' });
    } catch (e) {
      warn(`birdeye-api-docs: npm install failed — ${e.message}`);
      return;
    }
  }

  // Patch MCP config
  const configDir = dirname(configFile);
  mkdirSync(configDir, { recursive: true });

  let cfg = {};
  if (existsSync(configFile)) {
    try { cfg = JSON.parse(readFileSync(configFile, 'utf-8')); } catch { cfg = {}; }
    if (cfg.mcpServers?.['birdeye-api-docs']) {
      ok('MCP: birdeye-api-docs already configured');
      return;
    }
  }

  cfg.mcpServers = cfg.mcpServers || {};
  cfg.mcpServers['birdeye-api-docs'] = { command: 'node', args: [DOCS_MCP_INDEX] };
  writeFileSync(configFile, JSON.stringify(cfg, null, 2) + '\n');
  ok(`MCP: Added birdeye-api-docs to ${configFile.split('/').pop()}`);
}

// ---------------------------------------------------------------------------
// Skill Updates
// ---------------------------------------------------------------------------

function checkForUpdates() {
  const config = loadConfig();
  const versions = loadVersions();
  const installed = config.installed || {};

  // Read package version
  const pkgPath = join(PKG_ROOT, 'package.json');
  const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf-8')) : {};
  const pkgVersion = pkg.version || 'unknown';

  // Detect source: local project install vs global/npx cache
  const isGlobal = PKG_ROOT.includes('node_modules/.bin') || PKG_ROOT.includes('/.npm/') ||
    PKG_ROOT.includes('/lib/node_modules/') || !existsSync(join(PKG_ROOT, 'package.json'));
  const sourceLabel = isGlobal ? 'global/npx' : 'local project';

  console.log('');
  console.log(`  ${C.bold}dattb-bds-skills v${pkgVersion}${C.reset}  ${C.dim}(${sourceLabel}: ${PKG_ROOT})${C.reset}`);
  console.log('');

  if (!config.installedAt) {
    warn('No install record found.');
    info('Run: npx dattb-bds-skills install --all');
    console.log('');
    return;
  }

  // TTL check
  const ageDays = Math.floor((Date.now() - new Date(config.installedAt).getTime()) / 86400000);
  if (ageDays >= SKILL_TTL_DAYS) {
    warn(`Skills are ${ageDays} days old (TTL: ${SKILL_TTL_DAYS} days) — update recommended`);
    info('Run: npx dattb-bds-skills@latest install --all');
  } else {
    ok(`Skills are fresh — installed ${ageDays} day(s) ago (TTL: ${SKILL_TTL_DAYS} days)`);
  }
  console.log('');

  // Version check
  let updatesAvailable = 0;
  for (const [skill, skillInfo] of Object.entries(installed)) {
    const latestVersion = versions[skill];
    if (!latestVersion) continue;
    if (skillInfo.version !== latestVersion) {
      info(`${skill}: ${skillInfo.version} → ${latestVersion}`);
      updatesAvailable++;
    } else {
      ok(`${skill}: ${skillInfo.version}`);
    }
  }

  if (updatesAvailable > 0) {
    console.log('');
    warn(`${updatesAvailable} update(s) available — run: birdeye-skills update`);
  }

  config.lastCheck = new Date().toISOString();
  saveConfig(config);
  console.log('');
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstall() {
  console.log('');

  let removed = 0;

  // 1. Claude Code skills (~/.claude/skills/birdeye-*)
  if (existsSync(CLAUDE_SKILLS_DIR)) {
    for (const entry of readdirSync(CLAUDE_SKILLS_DIR)) {
      if (entry.startsWith('birdeye-')) {
        const target = join(CLAUDE_SKILLS_DIR, entry);
        rmSync(target, { recursive: true, force: true });
        ok(`Removed Claude skill: ${entry}`);
        removed++;
      }
    }
  }

  // 2. Cursor rules (~/.cursor/rules/birdeye-*.mdc)
  if (existsSync(CURSOR_RULES_DIR)) {
    for (const entry of readdirSync(CURSOR_RULES_DIR)) {
      if (entry.startsWith('birdeye-') && entry.endsWith('.mdc')) {
        rmSync(join(CURSOR_RULES_DIR, entry), { force: true });
        ok(`Removed Cursor rule: ${entry}`);
        removed++;
      }
    }
  }

  // 3. Codex AGENTS files (~/.codex/AGENTS.md or AGENTS-birdeye.md)
  for (const file of ['AGENTS.md', 'AGENTS-birdeye.md']) {
    const target = join(CODEX_DIR, file);
    if (existsSync(target)) {
      const content = readFileSync(target, 'utf-8');
      if (content.includes('Birdeye')) {
        rmSync(target, { force: true });
        ok(`Removed Codex file: ${target}`);
        removed++;
      }
    }
  }

  // 4. Wipe config
  if (existsSync(CONFIG_FILE)) {
    rmSync(CONFIG_FILE, { force: true });
    ok(`Removed config: ${CONFIG_FILE}`);
  }

  console.log('');
  if (removed === 0) {
    info('Nothing to uninstall — no Birdeye skills found.');
  } else {
    ok(`Uninstalled ${removed} item(s).`);
  }
  console.log('');
}

function updateAll() {
  const config = loadConfig();
  const installed = config.installed || {};

  if (Object.keys(installed).length === 0) {
    warn('No skills installed.');
    info("Run: birdeye-skills install --all");
    return;
  }

  console.log('');
  let updated = 0;
  for (const [skill, skillInfo] of Object.entries(installed)) {
    const platform = skillInfo.platform || 'claude';
    const targetBase = platform === 'claude' ? dirname(skillInfo.path) : skillInfo.path;
    if (platform === 'cursor') {
      if (installSkillCursor(skill, targetBase)) updated++;
    } else {
      if (installSkillClaude(skill, targetBase, skillInfo.mode)) updated++;
    }
  }

  console.log('');
  ok(`${updated} skill(s) updated`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

function listSkills() {
  const config = loadConfig();
  const installed = config.installed || {};
  const versions = loadVersions();

  console.log('');
  if (Object.keys(installed).length === 0) {
    warn('No skills installed.');
    info("Run: birdeye-skills install --all");
    console.log('');
    return;
  }

  for (const [skill, skillInfo] of Object.entries(installed)) {
    const latest = versions[skill] || '?';
    const outdated = skillInfo.version !== latest ? ` ${C.yellow}→ ${latest}${C.reset}` : '';
    const platform = skillInfo.platform ? ` ${C.dim}[${skillInfo.platform}]${C.reset}` : '';
    const ageDays = Math.floor((Date.now() - new Date(skillInfo.installedAt).getTime()) / 86400000);
    const aged = ageDays >= SKILL_TTL_DAYS ? ` ${C.yellow}(${ageDays}d old)${C.reset}` : '';
    ok(`${skill} v${skillInfo.version}${outdated}${platform}${aged}`);
  }

  console.log('');
  for (const skill of ALL_SKILLS) {
    if (!installed[skill]) skip(skill);
  }

  if (config.lastCheck) {
    console.log('');
    console.log(`  ${C.dim}Last check: ${new Date(config.lastCheck).toLocaleString()}${C.reset}`);
  }
}

function showSkillInfo(skillName) {
  const srcDir = join(LOCAL_SKILLS_DIR, skillName);
  const skillMdPath = join(srcDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.error(`Skill '${skillName}' not found.`);
    console.log('\nAvailable skills:');
    ALL_SKILLS.forEach(s => console.log(`  - ${s}`));
    return;
  }

  const content = readFileSync(skillMdPath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (match) {
    console.log(`\n${match[1]}`);
  }

  const refsDir = join(srcDir, 'references');
  if (existsSync(refsDir)) {
    const refs = readdirSync(refsDir).filter(f => f.endsWith('.md'));
    console.log(`\nReference files (${refs.length}):`);
    refs.forEach(r => console.log(`  - ${r}`));
  }
}


function pullLatest() {
  console.log('');
  info('Fetching latest birdeye-skills from npm...');
  console.log('');
  try {
    execSync('npx birdeye-skills@latest install --all', { stdio: 'inherit' });
  } catch (err) {
    console.error('');
    console.error(`  ${C.red}✗${C.reset}  Update failed: ${err.message}`);
    info('Manual: npx birdeye-skills@latest install --all');
  }
}

// ---------------------------------------------------------------------------
// Docs Sync
// ---------------------------------------------------------------------------

function docsSync() {
  console.log('\n=== Birdeye API Docs Sync ===\n');
  console.log('This command checks for new Birdeye API endpoints and updates skill references.\n');

  const versionsPath = join(LOCAL_SKILLS_DIR, 'versions.json');
  if (!existsSync(versionsPath)) {
    console.error('Error: versions.json not found. Make sure you\'re in the birdeye-skills directory.');
    return;
  }

  console.log('Steps to sync new API endpoints:\n');
  console.log('  1. Check https://docs.birdeye.so/reference for new endpoints');
  console.log('  2. Identify which domain skill the endpoint belongs to');
  console.log('  3. Update the skill\'s references/operation-map.md');
  console.log('  4. Bump version in versions.json');
  console.log('  5. Run: birdeye-skills update');
  console.log('');
  console.log('Skill → API Group mapping:');
  console.log('  birdeye-market-data        → Price, OHLCV, Stats, History');
  console.log('  birdeye-token-discovery    → Token List, Search, Trending, Meme');
  console.log('  birdeye-transaction-flow   → Transactions, Transfers, Blockchain');
  console.log('  birdeye-wallet-intelligence → Wallet, PnL, Top Traders');
  console.log('  birdeye-holder-analysis    → Holder');
  console.log('  birdeye-security-analysis  → Security');
  console.log('  birdeye-smart-money        → Smart Money');
  console.log('  birdeye-realtime-streams   → WebSocket channels');
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
Birdeye Skills CLI — Manage Birdeye AI skills

Usage:
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
    --all                 Install all 14 skills (default when no selection flag given)
    --domain              Install domain skills only (router + indexer + 8)
    --workflow            Install workflow skills only (4)
    <skill-name>          Install a specific skill

  Target:
    --project <dir>       Install to a specific project
    --path <dir>          Install to custom directory

  MCP config:
    --api-key <key>       Set Birdeye API key in MCP config
    --skip-mcp            Skip auto MCP config generation

  uninstall               Remove all installed skills (Claude, Cursor, Codex) and config
  update                  Update all installed skills to latest version
  pull                    Pull latest skills from registry and update
  check                   Check for available updates
  list                    List all skills and their install status
  info <skill-name>       Show details about a specific skill
  docs sync               Show guide for syncing new API endpoints
  cache clear             Clear cached metadata

Examples:
  birdeye-skills install --all                              # Claude Code personal
  birdeye-skills install --all --project /path/to/app       # Claude Code project
  birdeye-skills install --cursor --all --project /path     # Cursor rules
  birdeye-skills install --codex --all --project /path      # Codex AGENTS.md
  birdeye-skills install --bundle                           # Bundled prompt file
  birdeye-skills install --bundle my-prompt.md --domain     # Custom file, domain only
  birdeye-skills install birdeye-market-data                # Single skill
  birdeye-skills install --all --project . --api-key KEY    # With API key in MCP config
  birdeye-skills install --all --project . --skip-mcp       # Skip MCP config setup
  birdeye-skills update                                     # Update installed skills
  birdeye-skills pull                                       # Pull latest + update
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'install': {
      let targetBase = CLAUDE_SKILLS_DIR;
      let mode = 'personal';
      let platform = 'all';       // default: install for all agents
      let skillsToInstall = [];
      let projectDir = '';
      let bundleOutput = 'birdeye-system-prompt.md';
      let apiKey = '';
      let skipMcp = false;

      for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
          case '--all':
            skillsToInstall = [...ALL_SKILLS];
            break;
          case '--domain':
            skillsToInstall = ['birdeye-router', ...DOMAIN_SKILLS];
            break;
          case '--workflow':
            skillsToInstall = [...WORKFLOW_SKILLS];
            break;
          case '--claude':
            platform = 'claude';
            break;
          case '--cursor':
            platform = 'cursor';
            break;
          case '--codex':
            platform = 'codex';
            break;
          case '--bundle':
            platform = 'bundle';
            if (args[i + 1] && !args[i + 1].startsWith('-')) {
              bundleOutput = args[++i];
            }
            break;
          case '--chatgpt':
            platform = 'bundle';
            break;
          case '--api-key':
            if (!args[i + 1] || args[i + 1].startsWith('-')) {
              console.error('Error: --api-key requires a key argument.');
              return;
            }
            apiKey = args[++i];
            break;
          case '--skip-mcp':
            skipMcp = true;
            break;
          case '--project':
            if (!args[i + 1] || args[i + 1].startsWith('-')) {
              console.error('Error: --project requires a directory argument.');
              console.error('Usage: birdeye-skills install --all --project /path/to/your-project');
              return;
            }
            projectDir = resolve(args[++i]);
            if (!existsSync(projectDir)) {
              console.error(`Error: project directory does not exist: ${projectDir}`);
              return;
            }
            break;
          case '--path':
            targetBase = resolve(args[++i]);
            mode = 'custom';
            break;
          default:
            if (ALL_SKILLS.includes(args[i])) {
              skillsToInstall.push(args[i]);
            } else {
              console.error(`Unknown option or skill: ${args[i]}`);
              console.log('Available skills:', ALL_SKILLS.join(', '));
              return;
            }
        }
      }

      // Default: install all skills
      if (skillsToInstall.length === 0) {
        skillsToInstall = [...ALL_SKILLS];
      }

      // Resolve targets
      const claudeTarget = projectDir ? join(projectDir, '.claude', 'skills') : CLAUDE_SKILLS_DIR;
      const cursorTarget = projectDir ? join(projectDir, '.cursor', 'rules') : CURSOR_RULES_DIR;
      const codexTarget  = projectDir || CODEX_DIR;

      switch (platform) {
        case 'all':
          mode = projectDir ? `all agents — project (${projectDir})` : 'all agents — global';
          break;
        case 'claude':
          if (mode !== 'custom') {
            targetBase = claudeTarget;
            mode = projectDir ? `claude project (${projectDir})` : 'claude personal';
          }
          break;
        case 'cursor':
          targetBase = cursorTarget;
          mode = projectDir ? `cursor project (${projectDir})` : 'cursor global';
          break;
        case 'codex':
          targetBase = codexTarget;
          mode = projectDir ? `codex project (${projectDir})` : 'codex global';
          break;
        case 'bundle':
          mode = `bundle → ${bundleOutput}`;
          break;
      }

      console.log('');
      console.log(`${C.bold}Birdeye Skills${C.reset}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (platform === 'all') {
        console.log(`  ${C.dim}Claude${C.reset}   → ${claudeTarget}`);
        console.log(`  ${C.dim}Cursor${C.reset}   → ${cursorTarget}`);
        console.log(`  ${C.dim}Codex${C.reset}    → ${join(codexTarget, 'AGENTS.md')}`);
      } else {
        console.log(`  ${C.dim}Platform${C.reset}  ${C.cyan}${platform}${C.reset}`);
        console.log(`  ${C.dim}Target${C.reset}    ${C.cyan}${mode}${C.reset}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      let installed = 0;
      const n = skillsToInstall.length;

      if (platform === 'all') {
        // Claude
        let c = 0;
        for (const skill of skillsToInstall) {
          if (installSkillClaude(skill, claudeTarget, 'claude', !!projectDir)) c++;
        }
        console.log('');
        c === n ? ok(`Claude  ${c}/${n}`) : warn(`Claude  ${c}/${n}`);

        // Cursor
        let cu = 0;
        console.log('');
        for (const skill of skillsToInstall) {
          if (installSkillCursor(skill, cursorTarget)) cu++;
        }
        console.log('');
        cu === n ? ok(`Cursor  ${cu}/${n}`) : warn(`Cursor  ${cu}/${n}`);

        // Codex
        console.log('');
        const cx = installSkillsCodex(skillsToInstall, codexTarget);
        console.log('');
        cx > 0 ? ok(`Codex   ${cx}/${n} → AGENTS.md`) : warn(`Codex   failed`);

        installed = c + cu + (cx ? 1 : 0);
      } else {
        switch (platform) {
          case 'claude':
            for (const skill of skillsToInstall) {
              if (installSkillClaude(skill, targetBase, mode, !!projectDir)) installed++;
            }
            break;
          case 'cursor':
            for (const skill of skillsToInstall) {
              if (installSkillCursor(skill, targetBase)) installed++;
            }
            break;
          case 'codex':
            installed = installSkillsCodex(skillsToInstall, targetBase);
            break;
          case 'bundle':
            installed = installSkillsBundle(skillsToInstall, bundleOutput);
            break;
        }
      }

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (platform !== 'all') {
        if (installed === n) {
          ok(`${C.bold}${installed}/${n} skills installed${C.reset}`);
        } else {
          warn(`${installed}/${n} skills installed`);
        }
      } else {
        ok(`${C.bold}All agents configured${C.reset}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Write install timestamp to config (global installs only — project installs don't touch global state)
      if (!projectDir) {
        const cfg = loadConfig();
        cfg.installedAt = new Date().toISOString();
        saveConfig(cfg);
      }

      // Set up MCP config for project installs
      let mcpConfigFile = null;
      if (!skipMcp && platform !== 'bundle') {
        console.log('');
        if (platform === 'all' || platform === 'claude') {
          const claudeMcp = projectDir
            ? join(projectDir, '.mcp.json')
            : join(HOME, '.claude', 'settings.json');
          setupMcpConfig(claudeMcp, apiKey);
          setupDocsMcp(claudeMcp);
        }
        if (platform === 'all' || platform === 'cursor') {
          const cursorMcp = projectDir
            ? join(projectDir, '.cursor', 'mcp.json')
            : join(HOME, '.cursor', 'mcp.json');
          setupMcpConfig(cursorMcp, apiKey);
          setupDocsMcp(cursorMcp);
        }
        if (platform === 'all' || platform === 'codex') {
          info('Codex MCP: add birdeye-mcp to ~/.codex/config.toml manually');
        }
      }

      // Interactive API key prompt when none was supplied
      if (!apiKey && !process.env.BIRDEYE_API_KEY && !skipMcp && platform !== 'bundle') {
        console.log('');
        info('Get a free API key: https://bds.birdeye.so → Usages → Security → Generate key');
        const enteredKey = await readApiKey();
        if (enteredKey) {
          if (mcpConfigFile) {
            try {
              let cfg = {};
              if (existsSync(mcpConfigFile)) cfg = JSON.parse(readFileSync(mcpConfigFile, 'utf8'));
              cfg.mcpServers = cfg.mcpServers || {};
              cfg.mcpServers['birdeye-mcp'] = cfg.mcpServers['birdeye-mcp'] || {};
              cfg.mcpServers['birdeye-mcp'].env = cfg.mcpServers['birdeye-mcp'].env || {};
              cfg.mcpServers['birdeye-mcp'].env.API_KEY = enteredKey;
              writeFileSync(mcpConfigFile, JSON.stringify(cfg, null, 2));
              ok(`API key saved → ${mcpConfigFile}`);
            } catch (e) {
              warn(`Could not write API key: ${e.message}`);
            }
          }
        } else {
          console.log('');
          info('  To set your API key later:');
          if (mcpConfigFile) {
            console.log(`       File: ${mcpConfigFile}`);
            console.log('');
            console.log(`       sed -i '' 's|<YOUR_BIRDEYE_API_KEY>|YOUR_KEY|' "${mcpConfigFile}"`);
          } else {
            info('  Run: npx birdeye-skills install --all --api-key YOUR_KEY');
          }
        }
      }

      console.log('');
      console.log(`  ${C.dim}Update when needed: npx birdeye-skills@latest install --all${C.reset}`);
      console.log(`  ${C.dim}Next TTL check:     ${new Date(Date.now() + SKILL_TTL_DAYS * 86400000).toLocaleDateString()}${C.reset}`);
      console.log('');
      break;
    }

    case 'update':
      updateAll();
      break;

    case 'pull':
      pullLatest();
      break;

    case 'uninstall':
      uninstall();
      break;

    case 'check':
      checkForUpdates();
      break;

    case 'list':
      listSkills();
      break;

    case 'info':
      if (args[1]) {
        showSkillInfo(args[1]);
      } else {
        console.log('Usage: birdeye-skills info <skill-name>');
      }
      break;

    case 'docs':
      if (args[1] === 'sync') {
        docsSync();
      } else {
        console.log('Usage: birdeye-skills docs sync');
      }
      break;

    case 'cache':
      if (args[1] === 'clear') {
        const config = loadConfig();
        config.lastCheck = null;
        saveConfig(config);
        console.log('Cache cleared.');
      } else {
        console.log('Usage: birdeye-skills cache clear');
      }
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
  }
}

main();
