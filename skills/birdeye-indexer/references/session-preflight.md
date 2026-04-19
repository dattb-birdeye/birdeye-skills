# Session Preflight

Run these checks before making API calls in a new session.

## How to call the Birdeye API

**Always call the Birdeye REST API directly** using curl or fetch — do NOT route through the official `birdeye-mcp` MCP tool.

The official MCP is just a proxy to the same REST API. Direct calls are faster, have no extra hop, and work even when `mcp.birdeye.so` is unavailable.

```bash
# Direct API call (preferred)
curl -sS "https://public-api.birdeye.so/defi/price?address=<TOKEN>" \
  -H "X-API-KEY: YOUR_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

The `birdeye-api-docs` local MCP is useful for dynamic endpoint discovery (listing endpoints, searching params) — use it when you need to look up an endpoint not covered in the skill files.

---

---

## 1. Network validation

**Use the hardcoded list below — do not call `/defi/networks` or `/v1/wallet/list_supported_chain` via MCP.** These endpoints change rarely and MCP calls for them regularly time out (120s+).

**REST API chains**: `solana`, `ethereum`, `arbitrum`, `avalanche`, `bsc`, `optimism`, `polygon`, `base`, `zksync`, `sui`

**Wallet API chains** (`/wallet/v2/*`, `/v1/wallet/*`): **Solana only**

Only call `/defi/networks` if the user explicitly asks to verify the live chain list:

```bash
curl -sS "https://public-api.birdeye.so/defi/networks" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" -H "accept: application/json"
```

⚠️ Not all endpoints support all chains — see per-endpoint chain column in `canonical-endpoint-dictionary.md`.

### Chain-restricted endpoints (important)

| Restriction | Endpoints |
|---|---|
| **Solana only** | `/defi/v3/token/holder`, `/holder/v1/distribution`, `/token/v1/holder/batch`, `/defi/token_creation_info`, `/defi/v3/pair/overview/*`, `/defi/v3/token/mint-burn-txs`, `/smart-money/v1/token/list`, all `/wallet/v2/*`, all `/v1/wallet/*` |
| **Base only** | `/defi/v3/token/exit-liquidity`, `/defi/v3/token/exit-liquidity/multiple` |
| **SOL + BSC + monad** | `/defi/v3/token/meme/*` |
| **Multi-chain** | Most price, OHLCV, stats, and transaction endpoints |

---

## 2. API key — where to find it

**Do NOT search for `BIRDEYE_API_KEY` env var or `.mcp.json` files.** The key is stored in the MCP config.

Priority order:
1. **`~/.claude/settings.json`** → `mcpServers["birdeye-mcp"].args` → last element after `x-api-key:` (e.g. `"x-api-key:abc123"` → key is `abc123`)
2. **User-provided** — ask the user directly if not found above

```bash
# Read key from settings.json (run this if key is not already known)
node -e "
const s = JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.claude/settings.json','utf8'));
const args = s?.mcpServers?.['birdeye-mcp']?.args || [];
const h = args.find(a => a.startsWith('x-api-key:'));
console.log(h ? h.replace('x-api-key:','') : 'NOT FOUND');
"
```

If not found: ask the user to run `npx birdeye-skills install --api-key YOUR_KEY` (get key at https://bds.birdeye.so).

**Do NOT stop the task** — proceed with the key you found, or ask the user once and continue.

## 3. Auth headers

```
X-API-KEY: <your-api-key>        # required on ALL endpoints
x-chain: solana                   # required on chain-specific endpoints; omitting defaults to solana
accept: application/json          # always include
```

---

## 4. Address format by chain (checksum)

Always validate address format before passing to API — wrong format returns empty results, not an error.

| Chain | Format | Example | Notes |
|---|---|---|---|
| **Solana** | Base58, 32–44 chars | `So11111111111111111111111111111111111111112` | Case-sensitive. No 0x prefix. Validate with base58 decode |
| **Ethereum** | `0x` + 40 hex chars (EIP-55) | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Birdeye accepts lowercase; EIP-55 mixed-case is optional |
| **BSC** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **Base** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **Arbitrum** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **Optimism** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **Polygon** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **Avalanche** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **zkSync** | Same as Ethereum | `0x...` 42 chars | Same format as ETH |
| **Sui** | Hex, `0x` + 64 chars | `0x2::sui::SUI` (struct) or `0x...` | Sui uses object IDs |

```typescript
// Address validation helpers
function isSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

function isEvmAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function normalizeEvmAddress(addr: string): string {
  return addr.toLowerCase(); // Birdeye accepts lowercase EVM addresses
}
```

---

## 5. `ui_amount_mode` — raw vs scaled

Many endpoints support `ui_amount_mode` to control how token amounts are returned:

| Mode | Behavior | Use case |
|---|---|---|
| `raw` | Returns raw on-chain amounts (integer, not divided by decimals) | When you handle decimals yourself |
| `scaled` | Returns human-readable amounts (divided by decimals) | Default for display |
| `both` | Returns both `raw` and `scaled` (some endpoints) | Auditing / comparison |

**Endpoints that support `ui_amount_mode`**: `/defi/v3/token/txs`, `/defi/v3/token/txs-by-volume`, `/defi/v2/tokens/top_traders`, `/defi/token_trending`, `/defi/v3/search`, `/defi/history_price`, `/defi/price_volume/single`, `/defi/v3/all-time/trades/single`

If omitted, default behavior is typically `scaled` for display-oriented endpoints.

---

## 6. Rate limits by tier

| Tier | Global RPS | Wallet endpoints | Scroll endpoint | WebSocket |
|---|---|---|---|---|
| Standard | 1 rps | 30 RPS / 150 RPM | 2 RPS | ✗ |
| Lite/Starter | 15 rps | 30 RPS / 150 RPM | 2 RPS | ✗ |
| Premium | 50 rps | 30 RPS / 150 RPM | 2 RPS | ✗ |
| Business | 100 rps | 30 RPS / 150 RPM | 2 RPS | ✓ |
| Enterprise | Custom | Custom | 2 RPS | ✓ |

**Wallet API** (`/wallet/v2/*`, `/v1/wallet/*`): per-endpoint cap of **30 RPS burst / 150 RPM sustained**, in addition to the tier's global rps. On Standard (1 rps global), the tier limit binds first. On Business+, sequence wallet calls to stay under 150 RPM (≈ 1 call per 400ms).

**Token List Scroll** (`/defi/v3/token/list/scroll`): hard limit of **2 RPS** — add 500ms delay between scroll calls.

Source: https://docs.birdeye.so/docs/per-api-rate-limit
