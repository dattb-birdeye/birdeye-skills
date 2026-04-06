#!/usr/bin/env node

/**
 * Birdeye API Docs — MCP Fallback Server
 *
 * Fallback when the official Birdeye MCP (mcp.birdeye.so) is unavailable.
 * Provides endpoint discovery, parameter lookup, and docs URLs by reading
 * the official Birdeye OpenAPI spec — fetched at startup with a 24h local cache.
 *
 * Does NOT make Birdeye API calls — purely docs/discovery.
 *
 * Tools:
 *   birdeye_list_endpoints    — List all endpoints grouped by tag
 *   birdeye_search_endpoints  — Search endpoints by keyword
 *   birdeye_get_endpoint_info — Get full docs for a specific endpoint path
 *
 * MCP config (Claude / Cursor):
 *   {
 *     "mcpServers": {
 *       "birdeye-api-docs": {
 *         "command": "node",
 *         "args": ["/path/to/birdeye-skills/birdeye-mcp/index.js"]
 *       }
 *     }
 *   }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENAPI_URL = 'https://assets.birdeye.so/bds/docs/openapi_docs.json';
const CACHE_DIR = join(process.env.HOME || process.env.USERPROFILE || '~', '.birdeye');
const CACHE_FILE = join(CACHE_DIR, 'openapi-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Cache + fetch
// ---------------------------------------------------------------------------

async function loadSpec() {
  // Try cache first
  if (existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
      const age = Date.now() - (cached._cachedAt || 0);
      if (age < CACHE_TTL_MS) {
        return cached.spec;
      }
    } catch {
      // corrupt cache — fall through to fetch
    }
  }

  // Fetch fresh
  try {
    const res = await fetch(OPENAPI_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spec = await res.json();
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify({ _cachedAt: Date.now(), spec }));
    return spec;
  } catch (err) {
    // Fetch failed — fall back to stale cache if available
    if (existsSync(CACHE_FILE)) {
      try {
        const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
        process.stderr.write(`[birdeye-api-docs] fetch failed (${err.message}), using stale cache\n`);
        return cached.spec;
      } catch {
        // cache also corrupt
      }
    }
    throw new Error(`Cannot load OpenAPI spec: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Parser — OpenAPI spec → flat endpoint list
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Endpoint
 * @property {string} method
 * @property {string} path
 * @property {string} tag
 * @property {string} summary
 * @property {string} description
 * @property {string} operationId
 * @property {string} docsUrl
 * @property {Array<{name:string, in:string, type:string, required:boolean, description:string, enum?:string[]}>} params
 */

function parseSpec(spec) {
  const endpoints = [];
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op || typeof op !== 'object' || !op.operationId) continue;
      const tag = (op.tags || ['other'])[0];
      const params = (op.parameters || []).map(p => ({
        name: p.name,
        in: p.in,
        type: p.schema?.type || 'string',
        enum: p.schema?.enum,
        required: p.required === true,
        description: p.description || '',
      }));
      endpoints.push({
        method: method.toUpperCase(),
        path,
        tag,
        summary: op.summary || '',
        description: op.description || '',
        operationId: op.operationId,
        docsUrl: `https://docs.birdeye.so/reference/${op.operationId}`,
        params,
      });
    }
  }
  return endpoints;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function listEndpoints(endpoints, args) {
  const { tag } = args || {};
  let items = endpoints;
  if (tag) {
    items = items.filter(e => e.tag.toLowerCase().includes(tag.toLowerCase()));
  }

  const groups = {};
  for (const e of items) {
    if (!groups[e.tag]) groups[e.tag] = [];
    groups[e.tag].push(e);
  }

  const lines = [`Total: ${items.length} endpoint(s)\n`];
  for (const [t, eps] of Object.entries(groups)) {
    lines.push(`## ${t} (${eps.length})`);
    for (const e of eps) {
      lines.push(`  ${e.method} ${e.path}`);
      if (e.summary) lines.push(`    ${e.summary}`);
    }
    lines.push('');
  }

  if (items.length === 0) return `No endpoints found${tag ? ` for tag "${tag}"` : ''}.`;
  return lines.join('\n');
}

function searchEndpoints(endpoints, args) {
  const { query } = args || {};
  if (!query) return 'Provide a query string.';

  const q = query.toLowerCase();
  const results = endpoints.filter(e =>
    e.path.toLowerCase().includes(q) ||
    e.summary.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.tag.toLowerCase().includes(q) ||
    e.operationId.toLowerCase().includes(q) ||
    e.params.some(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );

  if (results.length === 0) return `No endpoints found matching "${query}".`;

  const lines = [`Found ${results.length} endpoint(s) matching "${query}":\n`];
  for (const e of results) {
    lines.push(`${e.method} ${e.path} [${e.tag}]`);
    if (e.summary) lines.push(`  ${e.summary}`);
    lines.push(`  Docs: ${e.docsUrl}`);
    lines.push('');
  }
  return lines.join('\n');
}

function getEndpointInfo(endpoints, args) {
  const { path: reqPath, method } = args || {};
  if (!reqPath) return 'Provide a path (e.g., /defi/price).';

  let matches = endpoints.filter(e =>
    e.path.toLowerCase() === reqPath.toLowerCase()
  );
  if (method) {
    matches = matches.filter(e => e.method === method.toUpperCase());
  }

  if (matches.length === 0) {
    const fuzzy = endpoints.filter(e => e.path.toLowerCase().includes(reqPath.toLowerCase()));
    if (fuzzy.length === 0) return `No endpoint found for "${reqPath}".`;
    if (fuzzy.length === 1) return renderEndpoint(fuzzy[0]);
    return (
      `Multiple endpoints match "${reqPath}":\n` +
      fuzzy.map(e => `  ${e.method} ${e.path}`).join('\n') +
      '\n\nUse exact path or add method filter.'
    );
  }

  return matches.map(renderEndpoint).join('\n\n---\n\n');
}

function renderEndpoint(e) {
  const lines = [];
  lines.push(`## ${e.method} ${e.path}`);
  lines.push(`**Tag**: ${e.tag}`);
  if (e.summary) lines.push(`**Summary**: ${e.summary}`);
  if (e.description && e.description !== e.summary) lines.push(`**Description**: ${e.description}`);
  lines.push(`**Docs**: ${e.docsUrl}`);

  const queryParams = e.params.filter(p => p.in === 'query');
  const headerParams = e.params.filter(p => p.in === 'header');

  if (queryParams.length > 0) {
    lines.push('');
    lines.push('**Query Parameters**:');
    lines.push('| Name | Type | Required | Description |');
    lines.push('|---|---|---|---|');
    for (const p of queryParams) {
      const type = p.enum ? `string (${p.enum.join('|')})` : p.type;
      lines.push(`| \`${p.name}\` | ${type} | ${p.required ? 'Yes' : 'No'} | ${p.description} |`);
    }
  }

  if (headerParams.length > 0) {
    lines.push('');
    lines.push('**Headers**:');
    for (const p of headerParams) {
      const enumNote = p.enum ? ` (${p.enum.join('|')})` : '';
      lines.push(`- \`${p.name}\`${enumNote}: ${p.description}`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const spec = await loadSpec();
const ENDPOINTS = parseSpec(spec);

const server = new Server(
  { name: 'birdeye-api-docs', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'birdeye_list_endpoints',
      description:
        'List all Birdeye API endpoints grouped by tag (e.g., "Price & OHLCV", "Wallet/Networth/PnL"). ' +
        'Use when the official Birdeye MCP is unavailable.',
      inputSchema: {
        type: 'object',
        properties: {
          tag: {
            type: 'string',
            description:
              'Filter by tag (e.g., "price", "wallet", "security", "holder"). Omit for all.',
          },
        },
      },
    },
    {
      name: 'birdeye_search_endpoints',
      description:
        'Search Birdeye API endpoints by keyword — matches path, summary, params. ' +
        'Use when the official Birdeye MCP is unavailable.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Keyword (e.g., "price", "ohlcv", "holder", "wallet pnl")',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'birdeye_get_endpoint_info',
      description:
        'Get full documentation for a specific Birdeye API endpoint — params, types, required flags, and docs URL. ' +
        'Use when the official Birdeye MCP is unavailable.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'API path (e.g., "/defi/price", "/defi/v3/ohlcv")',
          },
          method: {
            type: 'string',
            description: 'HTTP method filter. Omit to return all methods.',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          },
        },
        required: ['path'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let text;
  switch (name) {
    case 'birdeye_list_endpoints':
      text = listEndpoints(ENDPOINTS, args);
      break;
    case 'birdeye_search_endpoints':
      text = searchEndpoints(ENDPOINTS, args);
      break;
    case 'birdeye_get_endpoint_info':
      text = getEndpointInfo(ENDPOINTS, args);
      break;
    default:
      text = `Unknown tool: ${name}`;
  }
  return { content: [{ type: 'text', text }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
