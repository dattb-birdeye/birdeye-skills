# Session Preflight

Run these checks before making API calls in a new session.

---

## 1. Network validation (required)

Always call `/defi/networks` once per session to get the canonical list of supported chains:

```bash
curl -sS "https://public-api.birdeye.so/defi/networks" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "accept: application/json"
```

**Current chains** (as of spec):
`solana`, `ethereum`, `arbitrum`, `avalanche`, `bsc`, `optimism`, `polygon`, `base`, `zksync`, `sui`

⚠️ Not all endpoints support all chains — see per-endpoint chain column in `canonical-endpoint-dictionary.md`.

### Chain-restricted endpoints (important)

| Restriction | Endpoints |
|---|---|
| **Solana only** | `/defi/v3/token/holder`, `/holder/v1/distribution`, `/token/v1/holder/batch`, `/defi/token_creation_info`, `/defi/v3/pair/overview/*`, `/defi/v3/token/mint-burn-txs`, `/smart-money/v1/token/list`, all `/wallet/v2/*`, all `/v1/wallet/*` |
| **Base only** | `/defi/v3/token/exit-liquidity`, `/defi/v3/token/exit-liquidity/multiple` |
| **SOL + BSC + monad** | `/defi/v3/token/meme/*` |
| **Multi-chain** | Most price, OHLCV, stats, and transaction endpoints |

---

## 2. Auth headers

```
X-API-KEY: <your-api-key>        # required on ALL endpoints
x-chain: solana                   # required on chain-specific endpoints; omitting defaults to solana
accept: application/json          # always include
```

Get an API key at https://bds.birdeye.so

---

## 3. Address format by chain (checksum)

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

## 4. `ui_amount_mode` — raw vs scaled

Many endpoints support `ui_amount_mode` to control how token amounts are returned:

| Mode | Behavior | Use case |
|---|---|---|
| `raw` | Returns raw on-chain amounts (integer, not divided by decimals) | When you handle decimals yourself |
| `scaled` | Returns human-readable amounts (divided by decimals) | Default for display |
| `both` | Returns both `raw` and `scaled` (some endpoints) | Auditing / comparison |

**Endpoints that support `ui_amount_mode`**: `/defi/v3/token/txs`, `/defi/v3/token/txs-by-volume`, `/defi/v2/tokens/top_traders`, `/defi/token_trending`, `/defi/v3/search`, `/defi/history_price`, `/defi/price_volume/single`, `/defi/v3/all-time/trades/single`

If omitted, default behavior is typically `scaled` for display-oriented endpoints.

---

## 5. Rate limits by tier

| Tier | Requests/sec | Wallet API | WebSocket |
|---|---|---|---|
| Standard | 1 rps | 30 rpm | ✗ |
| Lite/Starter | 15 rps | 30 rpm | ✗ |
| Premium | 50 rps | 30 rpm | ✗ |
| Business | 100 rps | 30 rpm | ✓ |
| Enterprise | Custom | Custom | ✓ |

**Wallet API** (`/wallet/v2/*`, `/v1/wallet/*`) has a hard **30 RPM** limit on all tiers — sequence these calls.
