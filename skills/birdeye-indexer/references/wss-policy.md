# WebSocket Policy

Birdeye WebSocket requires **Business tier or higher**.

---

## Connection

```
wss://public-api.birdeye.so/socket/{chain}?x-api-key=YOUR_API_KEY
```

Chain goes in the **URL path** — NOT a header, NOT a query param (except `x-api-key`).

| Chain | URL |
|---|---|
| Solana | `wss://public-api.birdeye.so/socket/solana?x-api-key=KEY` |
| Ethereum | `wss://public-api.birdeye.so/socket/ethereum?x-api-key=KEY` |
| BSC | `wss://public-api.birdeye.so/socket/bsc?x-api-key=KEY` |
| Base | `wss://public-api.birdeye.so/socket/base?x-api-key=KEY` |
| Arbitrum | `wss://public-api.birdeye.so/socket/arbitrum?x-api-key=KEY` |
| Optimism | `wss://public-api.birdeye.so/socket/optimism?x-api-key=KEY` |
| Polygon | `wss://public-api.birdeye.so/socket/polygon?x-api-key=KEY` |
| Avalanche | `wss://public-api.birdeye.so/socket/avalanche?x-api-key=KEY` |
| zkSync | `wss://public-api.birdeye.so/socket/zksync?x-api-key=KEY` |

### Required connection headers

```
Origin: ws://public-api.birdeye.so
Sec-WebSocket-Origin: ws://public-api.birdeye.so
Sec-WebSocket-Protocol: echo-protocol
```

---

## Subscription message format

Most channels use a `data` wrapper:
```json
{
  "type": "SUBSCRIBE_PRICE",
  "data": {
    "queryType": "simple",
    "address": "TOKEN_ADDRESS",
    "chartType": "1m",
    "currency": "usd"
  }
}
```

**Exception — channels without `data` wrapper** (params at top level):
- `SUBSCRIBE_TOKEN_NEW_LISTING`
- `SUBSCRIBE_NEW_PAIR`
- `SUBSCRIBE_LARGE_TRADE_TXS`

Example:
```json
{
  "type": "SUBSCRIBE_LARGE_TRADE_TXS",
  "min_volume": 10000,
  "max_volume": 100000
}
```

---

## Unsubscribe

Replace `SUBSCRIBE` with `UNSUBSCRIBE`. For channels with `data`, include the same data:

```json
{ "type": "UNSUBSCRIBE_PRICE" }
```

```json
{
  "type": "UNSUBSCRIBE_TOKEN_STATS",
  "data": { "address": "TOKEN_ADDRESS" }
}
```

---

## Channel capacity limits

| Channel | Max addresses per subscription |
|---|---|
| `SUBSCRIBE_PRICE` (complex) | 100 |
| `SUBSCRIBE_TXS` (complex) | 100 |
| `SUBSCRIBE_TOKEN_STATS` | 100 |
| `SUBSCRIBE_BASE_QUOTE_PRICE` | 1 (one pair per connection) |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | No address limit (filter-based) |
| `SUBSCRIBE_WALLET_TXS` | 1 address per subscription |

For `SUBSCRIBE_BASE_QUOTE_PRICE`: each unique base/quote pair requires a **separate WebSocket connection**.

---

## Heartbeat / keepalive

Birdeye WebSocket does not send server-side pings. Implement client-side keepalive:

```typescript
function keepAlive(ws: WebSocket, intervalMs = 30000): NodeJS.Timeout {
  return setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'PING' }));
    }
  }, intervalMs);
}
```

---

## Reconnect strategy

```typescript
function createWebSocket(apiKey: string, chain: string, onMessage: (msg: any) => void): WebSocket {
  const url = `wss://public-api.birdeye.so/socket/${chain}?x-api-key=${apiKey}`;
  const ws = new WebSocket(url, {
    headers: {
      'Origin': 'ws://public-api.birdeye.so',
      'Sec-WebSocket-Protocol': 'echo-protocol',
    },
  } as any);

  ws.on('message', (raw) => {
    try { onMessage(JSON.parse(raw.toString())); } catch {}
  });

  ws.on('close', () => {
    console.warn('WS closed — reconnecting in 3s');
    setTimeout(() => createWebSocket(apiKey, chain, onMessage), 3000);
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
    ws.close();
  });

  return ws;
}
```

**Reconnect backoff**: start at 1s, double on each failure, cap at 30s.

---

## CU billing

WebSocket CU is charged **per byte received** (not per message). Rates:

| Channel | CU/byte |
|---|---|
| `SUBSCRIBE_PRICE` | 0.003 |
| `SUBSCRIBE_TOKEN_STATS` | 0.005 |
| `SUBSCRIBE_LARGE_TRADE_TXS` | 0.006 |
| `SUBSCRIBE_WALLET_TXS` | 0.004 |
| `SUBSCRIBE_TXS` | 0.0004 |
| `SUBSCRIBE_NEW_PAIR` | 0.05 |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | 0.08 |
| `SUBSCRIBE_BASE_QUOTE_PRICE` | 0.003 |

**High-traffic caution**: `SUBSCRIBE_TOKEN_NEW_LISTING` and `SUBSCRIBE_NEW_PAIR` generate high volumes on Solana. Use `min_liquidity` filters to reduce noise and CU spend.

---

## Channel availability by chain

| Channel | Solana | EVM chains |
|---|---|---|
| `SUBSCRIBE_PRICE` | ✓ | ✓ |
| `SUBSCRIBE_TXS` | ✓ | ✓ |
| `SUBSCRIBE_LARGE_TRADE_TXS` | ✓ | ✓ |
| `SUBSCRIBE_WALLET_TXS` | ✓ | ✓ |
| `SUBSCRIBE_TOKEN_STATS` | ✓ | ✓ |
| `SUBSCRIBE_BASE_QUOTE_PRICE` | ✓ | ✓ |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | ✓ | ✗ |
| `SUBSCRIBE_NEW_PAIR` | ✓ | ✗ |
| `SUBSCRIBE_MEME` | ✓ | ✗ |

---

## See also

`birdeye-realtime-streams/references/stream-map.md` — full subscription message formats and event schemas for each channel.
