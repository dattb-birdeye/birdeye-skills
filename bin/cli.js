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
  'birdeye-x402',
];


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
  'birdeye-x402': 'pay per request, x402, no API key, USDC payment, micropayment, agent wallet',
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

function installSkillClaude(skillName, targetBase, mode = 'personal', skipGlobalConfig = false, platform = 'claude') {
  const srcDir = join(LOCAL_SKILLS_DIR, skillName);
  const skillMdPath = join(srcDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.error(`  Error: ${skillName}/SKILL.md not found at ${srcDir}`);
    return false;
  }

  const target = join(targetBase, skillName);
  mkdirSync(target, { recursive: true });

  // Rewrite <skill-dir> placeholder to the absolute install path so the agent
  // never has to guess. Different platforms anchor to different roots.
  const platformRoot = platform === 'codex' ? '~/.codex/skills' : '~/.claude/skills';
  const absSkillDir = `${platformRoot}/${skillName}`;
  const rewrite = (s) => s.replace(/<skill-dir>/g, absSkillDir);

  writeFileSync(join(target, 'SKILL.md'), rewrite(readFileSync(skillMdPath, 'utf-8')));

  const refsDir = join(srcDir, 'references');
  if (existsSync(refsDir)) {
    mkdirSync(join(target, 'references'), { recursive: true });
    for (const file of readdirSync(refsDir)) {
      const src = join(refsDir, file);
      const dst = join(target, 'references', file);
      if (file.endsWith('.md')) {
        writeFileSync(dst, rewrite(readFileSync(src, 'utf-8')));
      } else {
        cpSync(src, dst, { recursive: true });
      }
    }
  }

  // Optional skill assets — scripts, runtime package.json, env template.
  // Skills like birdeye-x402 ship executable signer/payment scripts that the
  // agent needs to run; copy them along with SKILL.md so the install is usable.
  const optionalAssets = ['scripts', 'package.json', '.env.example', '.gitignore'];
  for (const asset of optionalAssets) {
    const srcPath = join(srcDir, asset);
    if (existsSync(srcPath)) {
      cpSync(srcPath, join(target, asset), { recursive: true });
    }
  }

  // Write install metadata
  const versions = loadVersions();
  const meta = {
    skill: skillName,
    version: versions[skillName] || '1.0.0',
    installedAt: new Date().toISOString(),
    source: 'local',
    platform,
  };
  writeFileSync(join(target, '.birdeye-meta.json'), JSON.stringify(meta, null, 2));

  // Update global config (skipped for project installs — project path is tracked locally via .birdeye-meta.json)
  if (!skipGlobalConfig) {
    const config = loadConfig();
    config.installed = config.installed || {};
    config.installed[`${platform}:${skillName}`] = {
      version: meta.version,
      installedAt: meta.installedAt,
      path: target,
      mode,
      platform,
    };
    saveConfig(config);
  }

  ok(skillName);
  return true;
}

// ---------------------------------------------------------------------------
// Platform Install: Cursor (.mdc rules)
// ---------------------------------------------------------------------------

// Cursor's standard global skills dir per cursor.com/docs/skills. Cursor
// auto-discovers any SKILL.md under here recursively. We install the full
// skill layout natively, and also emit a legacy .mdc rule into
// ~/.cursor/rules/ for older Cursor versions that only support rules.
const CURSOR_SKILLS_DIR = join(HOME, '.cursor', 'skills');

function installSkillCursor(skillName, rulesBase) {
  const srcDir = join(LOCAL_SKILLS_DIR, skillName);
  const skillMdPath = join(srcDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.error(`  Error: ${skillName}/SKILL.md not found`);
    return false;
  }

  // 1) Native install — full skill dir at ~/.cursor/skills/<name>/.
  installSkillClaude(skillName, CURSOR_SKILLS_DIR, 'personal', false, 'cursor');

  // 2) Legacy .mdc rule fallback at ~/.cursor/rules/<name>.mdc.
  mkdirSync(rulesBase, { recursive: true });

  const cursorSkillDir = `~/.cursor/skills/${skillName}`;
  const rewrite = (s) => s
    .replace(/<skill-dir>/g, cursorSkillDir)
    .replace(/~\/\.claude\/skills\/([a-z0-9-]+)/g, `~/.cursor/skills/$1`);

  const content = readFileSync(skillMdPath, 'utf-8');
  const description = CURSOR_TRIGGERS[skillName] || extractDescription(content);
  const alwaysApply = skillName === 'birdeye-router' ? 'true' : 'false';
  const body = rewrite(stripFrontmatter(content));

  let mdc = `---\ndescription: ${description}\nglobs: \nalwaysApply: ${alwaysApply}\n---\n\n${body}`;

  const refsDir = join(srcDir, 'references');
  if (existsSync(refsDir)) {
    mdc += '\n\n---\n\n## References\n';
    for (const file of readdirSync(refsDir).filter(f => f.endsWith('.md'))) {
      const refContent = rewrite(readFileSync(join(refsDir, file), 'utf-8'));
      const refName = file.replace('.md', '');
      mdc += `\n### ${refName}\n\n${refContent}\n`;
    }
  }

  writeFileSync(join(rulesBase, `${skillName}.mdc`), mdc);
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

> **Codex CLI runtime paths**: Skill scripts and \`.env\` files for any skill referenced below live in \`~/.codex/skills/<skill-name>/\`. When a section says "this skill's directory" or shows \`<skill-dir>\`, resolve it to \`~/.codex/skills/<skill-name>/\` — never \`~/.claude/skills/...\` (that's for Claude Code). Write \`.env\` and run scripts only inside \`~/.codex/skills/\`.

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
    // Rewrite skill-dir placeholders + Claude paths so a Codex agent reading
    // this never falls back to ~/.claude/skills/... when both platforms are
    // installed side by side.
    const codexSkillDir = `~/.codex/skills/${skillName}`;
    const body = stripFrontmatter(raw)
      .replace(/<skill-dir>/g, codexSkillDir)
      .replace(/~\/\.claude\/skills\/([a-z0-9-]+)/g, '~/.codex/skills/$1');
    content += `\n\n---\n\n## ${skillName}\n\n${body}`;

    // Inline ALL reference files (not just operation-map + caveats)
    const refsDir = join(srcDir, 'references');
    if (existsSync(refsDir)) {
      for (const file of readdirSync(refsDir).filter(f => f.endsWith('.md')).sort()) {
        const refRaw = readFileSync(join(refsDir, file), 'utf-8')
          .replace(/<skill-dir>/g, codexSkillDir)
          .replace(/~\/\.claude\/skills\/([a-z0-9-]+)/g, '~/.codex/skills/$1');
        content += `\n\n### ${file.replace('.md', '')}\n\n${refRaw}`;
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

function makeBirdeyeMcpConfig(apiKey = '<YOUR_BIRDEYE_API_KEY>') {
  return {
    command: 'npx',
    args: [
      '-y',
      'mcp-remote@0.1.38',
      'https://mcp.birdeye.so/mcp',
      '--header',
      `x-api-key:${apiKey}`,
    ],
  };
}

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

  const mcpEntry = makeBirdeyeMcpConfig(apiKey || '<YOUR_BIRDEYE_API_KEY>');
  const fileName = configFile.split('/').pop();

  let existing = {};
  if (existsSync(configFile)) {
    existing = JSON.parse(readFileSync(configFile, 'utf-8'));
  }

  const alreadyExists = existing.mcpServers && existing.mcpServers['birdeye-mcp'];

  if (alreadyExists && !apiKey) {
    ok(`MCP: birdeye-mcp already configured (${fileName})`);
    return;
  }

  existing.mcpServers = existing.mcpServers || {};
  existing.mcpServers['birdeye-mcp'] = mcpEntry;
  writeFileSync(configFile, JSON.stringify(existing, null, 2) + '\n');

  if (alreadyExists) {
    ok(`MCP: birdeye-mcp API key updated (${fileName})`);
  } else {
    ok(`MCP: birdeye-mcp configured (${fileName})`);
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
  console.log(`  ${C.bold}birdeye-skills v${pkgVersion}${C.reset}  ${C.dim}(${sourceLabel}: ${PKG_ROOT})${C.reset}`);
  console.log('');

  if (!config.installedAt) {
    warn('No install record found.');
    info('Run: npx birdeye-skills install');
    console.log('');
    return;
  }

  // TTL check
  const ageDays = Math.floor((Date.now() - new Date(config.installedAt).getTime()) / 86400000);
  if (ageDays >= SKILL_TTL_DAYS) {
    warn(`Skills are ${ageDays} days old (TTL: ${SKILL_TTL_DAYS} days) — update recommended`);
    info('Run: npx birdeye-skills@latest install');
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

  // Native skill directories — same layout for Claude, Codex, Cursor.
  const skillDirs = [
    { label: 'Claude', dir: CLAUDE_SKILLS_DIR },
    { label: 'Codex',  dir: join(CODEX_DIR, 'skills') },
    { label: 'Cursor', dir: CURSOR_SKILLS_DIR },
  ];
  for (const { label, dir } of skillDirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('birdeye-')) {
        rmSync(join(dir, entry), { recursive: true, force: true });
        ok(`Removed ${label} skill: ${entry}`);
        removed++;
      }
    }
  }

  // Cursor legacy .mdc rules
  if (existsSync(CURSOR_RULES_DIR)) {
    for (const entry of readdirSync(CURSOR_RULES_DIR)) {
      if (entry.startsWith('birdeye-') && entry.endsWith('.mdc')) {
        rmSync(join(CURSOR_RULES_DIR, entry), { force: true });
        ok(`Removed Cursor rule: ${entry}`);
        removed++;
      }
    }
  }

  // Codex AGENTS.md fallback files
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

  // Legacy ~/.birdeye/skills/ from older versions (pre-cursor-skills-dir).
  const legacyBirdeyeDir = join(HOME, '.birdeye', 'skills');
  if (existsSync(legacyBirdeyeDir)) {
    for (const entry of readdirSync(legacyBirdeyeDir)) {
      if (entry.startsWith('birdeye-')) {
        rmSync(join(legacyBirdeyeDir, entry), { recursive: true, force: true });
        ok(`Removed legacy: ~/.birdeye/skills/${entry}`);
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
    info("Run: birdeye-skills install");
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
    info("Run: birdeye-skills install");
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
    execSync('npx birdeye-skills@latest install', { stdio: 'inherit' });
  } catch (err) {
    console.error('');
    console.error(`  ${C.red}✗${C.reset}  Update failed: ${err.message}`);
    info('Manual: npx birdeye-skills@latest install');
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
// API Caller
// ---------------------------------------------------------------------------

const BIRDEYE_BASE = 'https://public-api.birdeye.so';

function getApiKey() {
  if (process.env.BIRDEYE_API_KEY) return process.env.BIRDEYE_API_KEY;
  const settingsPath = join(HOME, '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const s = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      const h = (s?.mcpServers?.['birdeye-mcp']?.args || []).find(a => a.startsWith('x-api-key:'));
      if (h) return h.replace('x-api-key:', '');
    } catch {}
  }
  return null;
}

async function callBirdeye(path, params = {}, chain = 'solana') {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === '<YOUR_BIRDEYE_API_KEY>') {
    console.error('No API key. Run: npx birdeye-skills install --api-key YOUR_KEY');
    process.exit(1);
  }
  const url = new URL(BIRDEYE_BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': apiKey, 'x-chain': chain, 'accept': 'application/json' },
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

function parseApiArgs(args) {
  const result = { _: null, chain: 'solana' };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      result[args[i].slice(2)] = args[i + 1] ?? true;
      i++;
    } else if (!result._) {
      result._ = args[i];
    }
  }
  return result;
}

async function runApiCommand(subArgs) {
  const sub = subArgs[0];
  const p = parseApiArgs(subArgs.slice(1));
  const chain = p.chain || 'solana';
  const limit = p.limit || '20';
  const addr = p.token || p.address || p._;

  switch (sub) {
    case 'price':
      if (!addr) { console.error('Usage: api price <token_address> [--chain solana]'); process.exit(1); }
      return callBirdeye('/defi/price', { address: addr, include_liquidity: 'true' }, chain);

    case 'overview':
      if (!addr) { console.error('Usage: api overview <token_address> [--chain solana]'); process.exit(1); }
      return callBirdeye('/defi/token_overview', { address: addr }, chain);

    case 'trending':
      return callBirdeye('/defi/token_trending', { sort_by: 'rank', sort_type: 'asc', offset: '0', limit }, chain);

    case 'security':
      if (!addr) { console.error('Usage: api security <token_address>'); process.exit(1); }
      return callBirdeye('/defi/token_security', { address: addr }, chain);

    case 'search': {
      const query = p.query || p._;
      if (!query) { console.error('Usage: api search <query> [--chain solana]'); process.exit(1); }
      return callBirdeye('/defi/v3/search', { keyword: query, target: 'token', chain }, chain);
    }

    case 'holders':
      if (!addr) { console.error('Usage: api holders <token_address> [--limit 20]'); process.exit(1); }
      return callBirdeye('/defi/v3/token/holder', { address: addr, limit }, chain);

    case 'wallet':
      if (!addr) { console.error('Usage: api wallet <wallet_address> [--chain solana]'); process.exit(1); }
      return callBirdeye('/v1/wallet/portfolio', { wallet: addr }, chain);

    case 'trades':
      if (!addr) { console.error('Usage: api trades <token_address> [--limit 20]'); process.exit(1); }
      return callBirdeye('/defi/txs/token', { address: addr, tx_type: 'all', limit }, chain);

    case 'ohlcv':
      if (!addr) { console.error('Usage: api ohlcv <token_address> [--interval 1H] [--chain solana]'); process.exit(1); }
      return callBirdeye('/defi/ohlcv', { address: addr, type: p.interval || '1H', time_from: p.from, time_to: p.to }, chain);

    case 'top-traders':
      if (!addr) { console.error('Usage: api top-traders <token_address> [--limit 10]'); process.exit(1); }
      return callBirdeye('/defi/v2/tokens/top_traders', { address: addr, time_frame: p.timeframe || '24h', sort_type: 'desc', sort_by: 'volume', limit }, chain);

    case 'chart': {
      if (!addr) { console.error('Usage: api chart <token_address> [--interval 1H] [--from <unix>] [--to <unix>] [--chain solana]'); process.exit(1); }
      const now = Math.floor(Date.now() / 1000);
      const from = p.from || String(now - 86400);
      const to = p.to || String(now);
      return callBirdeye('/defi/v3/ohlcv', { address: addr, type: p.interval || '1H', time_from: from, time_to: to }, chain);
    }

    case 'chart-pair': {
      if (!addr) { console.error('Usage: api chart-pair <pair_address> [--interval 1H] [--from <unix>] [--to <unix>] [--chain solana]'); process.exit(1); }
      const now = Math.floor(Date.now() / 1000);
      const from = p.from || String(now - 86400);
      const to = p.to || String(now);
      return callBirdeye('/defi/v3/ohlcv/pair', { address: addr, type: p.interval || '1H', time_from: from, time_to: to }, chain);
    }

    case 'history-price': {
      if (!addr) { console.error('Usage: api history-price <token_address> [--interval 1H] [--from <unix>] [--to <unix>]'); process.exit(1); }
      const now = Math.floor(Date.now() / 1000);
      const from = p.from || String(now - 86400);
      const to = p.to || String(now);
      return callBirdeye('/defi/history_price', { address: addr, address_type: 'token', type: p.interval || '1H', time_from: from, time_to: to }, chain);
    }

    case 'smart-money':
      return callBirdeye('/smart-money/v1/token/list', {
        sort_by: p['sort-by'] || 'net_flow',
        sort_type: 'desc',
        interval: p.interval || '1d',
        trader_style: p.style || 'all',
        limit,
        offset: p.offset || '0',
      }, 'solana');

    case 'gainers':
    case 'losers':
    case 'gainers-losers':
      return callBirdeye('/trader/gainers-losers', {
        type: p.type || 'today',
        sort_by: 'PnL',
        sort_type: sub === 'losers' ? 'asc' : 'desc',
        limit,
        offset: p.offset || '0',
      }, chain);

    default:
      console.error(`Unknown api command: ${sub || '(none)'}`);
      console.log(`
Commands:
  api price        <token>           Token price
  api overview     <token>           Full token overview
  api trending     [--limit N]       Trending tokens
  api security     <token>           Security analysis
  api search       <query>           Search tokens by name/symbol
  api holders      <token>           Top token holders (Solana only)
  api wallet       <address>         Wallet portfolio (Solana only)
  api trades       <token>           Recent trades
  api ohlcv        <token>           OHLCV candle data (legacy)
  api chart        <token>           OHLCV v3 chart data
  api chart-pair   <pair>            OHLCV v3 by pair address
  api history-price <token>          Historical price line data
  api smart-money  [--interval 1d]   Smart money token list (Solana only)
  api gainers      [--type today]    Top gainers by PnL
  api losers       [--type today]    Top losers by PnL
  api top-traders  <token>           Top traders by volume

Options:
  --chain <chain>     Chain (default: solana)
  --limit <N>         Result limit (default: 20)
  --interval <tf>     Candle timeframe: 1m 5m 15m 1H 4H 1D 1W (default: 1H)
  --from <unix>       Start time (unix timestamp)
  --to <unix>         End time (unix timestamp)
  --type <period>     gainers/losers period: today yesterday 1W (default: today)
  --sort-by <field>   smart-money sort: net_flow smart_traders_no market_cap
  --style <style>     smart-money trader style: all risk_averse trenchers
      `);
      process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
Birdeye Skills — AI skills for Claude Code, Cursor, and Codex CLI

Usage:
  npx birdeye-skills install [--claude|--cursor|--codex|--bundle] [--api-key KEY]

  No flags         Install for all platforms (Claude Code + Cursor + Codex)
  --claude         Install for Claude Code only  (~/.claude/skills/)
  --cursor         Install for Cursor only        (~/.cursor/rules/)
  --codex          Install for Codex CLI only     (~/.codex/AGENTS.md)
  --bundle [file]  Generate bundled prompt file   (ChatGPT / OpenAI API)
  --api-key KEY    Set Birdeye API key in MCP config

Other commands:
  uninstall        Remove all installed skills and config
  update           Update installed skills to latest version
  check            Check version and update status
  list             List installed skills
  api <sub>        Call Birdeye API directly

API sub-commands:
  api price        <token>           Token price
  api overview     <token>           Full token overview
  api trending     [--limit N]       Trending tokens
  api security     <token>           Security analysis
  api search       <query>           Search tokens by name/symbol
  api holders      <token>           Top token holders (Solana only)
  api wallet       <address>         Wallet portfolio (Solana only)
  api trades       <token>           Recent trades
  api chart        <token>           OHLCV v3 chart data
  api chart-pair   <pair>            OHLCV v3 by pair address
  api history-price <token>          Historical price line
  api smart-money  [--interval 1d]   Smart money list (Solana only)
  api gainers      [--type today]    Top PnL gainers
  api losers       [--type today]    Top PnL losers
  api top-traders  <token>           Top traders by volume

  Options: --chain  --limit  --interval  --from  --to  --type  --sort-by

Examples:
  npx birdeye-skills install                        # All platforms
  npx birdeye-skills install --claude               # Claude Code only
  npx birdeye-skills install --api-key YOUR_KEY     # With API key
  npx birdeye-skills install --bundle               # ChatGPT prompt file
  npx birdeye-skills uninstall                      # Remove everything
  npx birdeye-skills api price So11111111111111111111111111111111111111112
  npx birdeye-skills api trending --limit 10
  npx birdeye-skills api chart <token> --interval 4H
  npx birdeye-skills api smart-money --interval 7d
  npx birdeye-skills api gainers --type today
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
      let platform = 'all';
      let bundleOutput = 'birdeye-system-prompt.md';
      let apiKey = '';

      for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
          case '--claude':  platform = 'claude'; break;
          case '--cursor':  platform = 'cursor'; break;
          case '--codex':   platform = 'codex';  break;
          case '--bundle':
            platform = 'bundle';
            if (args[i + 1] && !args[i + 1].startsWith('-')) bundleOutput = args[++i];
            break;
          case '--api-key':
            if (!args[i + 1] || args[i + 1].startsWith('-')) {
              console.error('Error: --api-key requires a key argument.');
              return;
            }
            apiKey = args[++i];
            break;
          default:
            console.error(`Unknown option: ${args[i]}`);
            printHelp();
            return;
        }
      }

      const skillsToInstall = [...ALL_SKILLS];
      const projectDir = '';
      const claudeTarget = CLAUDE_SKILLS_DIR;
      const cursorTarget = CURSOR_RULES_DIR;
      const codexTarget  = CODEX_DIR;

      let mode;
      switch (platform) {
        case 'all':    mode = 'all agents — global'; break;
        case 'claude': mode = 'claude — global'; break;
        case 'cursor': mode = 'cursor — global'; break;
        case 'codex':  mode = 'codex — global'; break;
        case 'bundle': mode = `bundle → ${bundleOutput}`; break;
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

        // Codex — install both as skills/ directory AND AGENTS.md fallback
        let cxd = 0;
        const codexSkillsDir = join(CODEX_DIR, 'skills');
        console.log('');
        for (const skill of skillsToInstall) {
          if (installSkillClaude(skill, codexSkillsDir, mode, false, 'codex')) cxd++;
        }
        const cx = installSkillsCodex(skillsToInstall, codexTarget);
        console.log('');
        cxd === n ? ok(`Codex   ${cxd}/${n} → ~/.codex/skills/`) : warn(`Codex   ${cxd}/${n}`);
        cx > 0 ? ok(`Codex   AGENTS.md generated`) : warn(`Codex   AGENTS.md failed`);

        installed = c + cu + cxd + (cx ? 1 : 0);
      } else {
        switch (platform) {
          case 'claude':
            for (const skill of skillsToInstall) {
              if (installSkillClaude(skill, claudeTarget, mode, false)) installed++;
            }
            break;
          case 'cursor':
            for (const skill of skillsToInstall) {
              if (installSkillCursor(skill, cursorTarget)) installed++;
            }
            break;
          case 'codex': {
            const codexSkillsDir = join(CODEX_DIR, 'skills');
            for (const skill of skillsToInstall) {
              if (installSkillClaude(skill, codexSkillsDir, mode, false, 'codex')) installed++;
            }
            installSkillsCodex(skillsToInstall, codexTarget);
            break;
          }
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

      // Set up MCP config
      if (platform !== 'bundle') {
        console.log('');
        if (platform === 'all' || platform === 'claude') {
          const claudeMcp = join(HOME, '.claude', 'settings.json');
          setupMcpConfig(claudeMcp, apiKey);
          setupDocsMcp(claudeMcp);
        }
        if (platform === 'all' || platform === 'cursor') {
          const cursorMcp = join(HOME, '.cursor', 'mcp.json');
          setupMcpConfig(cursorMcp, apiKey);
          setupDocsMcp(cursorMcp);
        }
        if (platform === 'all' || platform === 'codex') {
          info('Codex MCP: add birdeye-mcp to ~/.codex/config.toml manually');
        }
      }

      // Interactive API key prompt when none was supplied
      if (!apiKey && !process.env.BIRDEYE_API_KEY && platform !== 'bundle') {
        console.log('');
        info('Get a free API key: https://bds.birdeye.so → Usages → Security → Generate key');
        const enteredKey = await readApiKey();
        if (enteredKey) {
          // Write entered key to all relevant MCP configs
          const mcpFiles = [];
          if (platform === 'all' || platform === 'claude') mcpFiles.push(join(HOME, '.claude', 'settings.json'));
          if (platform === 'all' || platform === 'cursor') mcpFiles.push(join(HOME, '.cursor', 'mcp.json'));
          for (const f of mcpFiles) {
            try {
              let cfg = {};
              if (existsSync(f)) cfg = JSON.parse(readFileSync(f, 'utf8'));
              cfg.mcpServers = cfg.mcpServers || {};
              cfg.mcpServers['birdeye-mcp'] = makeBirdeyeMcpConfig(enteredKey);
              writeFileSync(f, JSON.stringify(cfg, null, 2));
              ok(`API key saved → ${f}`);
            } catch (e) {
              warn(`Could not write API key to ${f}: ${e.message}`);
            }
          }
        } else {
          console.log('');
          info('To set your API key later:');
          console.log(`       npx birdeye-skills install --api-key YOUR_KEY`);
        }
      }

      const pkgPath = join(PKG_ROOT, 'package.json');
      const pkgVersion = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf-8')).version : 'unknown';
      console.log('');
      console.log(`  ${C.dim}Version:            birdeye-skills v${pkgVersion}${C.reset}`);
      console.log(`  ${C.dim}Update when needed: npx birdeye-skills@latest install${C.reset}`);
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

    case 'api':
      await runApiCommand(args.slice(1));
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
