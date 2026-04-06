---
name: birdeye-realtime-streams
description: Real-time WebSocket streaming for Birdeye — price/OHLCV updates, live transactions, new token listings, new pairs, large trade tracking, wallet monitoring, token stats, and meme stats. Covers all 9 WebSocket subscription channels.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Realtime Streams — WebSocket Subscriptions

You are an expert at building real-time data pipelines using Birdeye WebSocket API. This skill covers all 9 subscription channels for live market data.

> ⚠️ Requires **Business tier+** | URL: `wss://public-api.birdeye.so/socket/{chain}?x-api-key=KEY` (chain in path, not header) | Headers: `Origin: ws://public-api.birdeye.so`, `Sec-WebSocket-Protocol: echo-protocol`

## Routing

| Intent | Reference |
|---|---|
| Live price/OHLCV stream | `references/stream-map.md` → SUBSCRIBE_PRICE |
| Live transaction stream | `references/stream-map.md` → SUBSCRIBE_TXS |
| Base/quote price stream | `references/stream-map.md` → SUBSCRIBE_BASE_QUOTE_PRICE |
| New token listing alerts | `references/stream-map.md` → SUBSCRIBE_TOKEN_NEW_LISTING |
| New pair discovery | `references/stream-map.md` → SUBSCRIBE_NEW_PAIR |
| Large trade monitoring | `references/stream-map.md` → SUBSCRIBE_LARGE_TRADE_TXS |
| Wallet activity stream | `references/stream-map.md` → SUBSCRIBE_WALLET_TXS |
| Token stats stream | `references/stream-map.md` → SUBSCRIBE_TOKEN_STATS |
| Meme token stats | `references/stream-map.md` → SUBSCRIBE_MEME |
| Connection patterns | `references/subscription-patterns.md` |
| Reconnection handling | `references/reconnection-handling.md` |
| Common mistakes & gotchas | `references/caveats.md` |

## Rules

### Connection Management
- URL: `wss://public-api.birdeye.so/socket/solana?x-api-key=<KEY>` — replace `solana` with target chain
- MUST include headers: `Origin: ws://public-api.birdeye.so`, `Sec-WebSocket-Protocol: echo-protocol`
- Implement ping-pong heartbeat to keep connection alive
- ALWAYS implement auto-reconnection with exponential backoff
- One WebSocket connection supports multiple subscriptions

### Subscription Format
Most subscriptions use a `data` wrapper:
```json
{ "type": "SUBSCRIBE_<CHANNEL>", "data": { ... } }
```

**Exception**: `TOKEN_NEW_LISTING`, `NEW_PAIR`, `LARGE_TRADE_TXS` put params at top level (no `data` wrapper). See `stream-map.md` for exact format per channel.

Unsubscribe: replace `SUBSCRIBE` with `UNSUBSCRIBE`.

### Available Channels (9 total)

| Channel | Description | CU/byte |
|---|---|---|
| `SUBSCRIBE_PRICE` | Token/pair OHLCV price updates | 0.003 |
| `SUBSCRIBE_TXS` | Token/pair trade transactions | 0.0004 |
| `SUBSCRIBE_BASE_QUOTE_PRICE` | Base/quote pair price updates | 0.003 |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | New token listings on DEXs | 0.08 |
| `SUBSCRIBE_NEW_PAIR` | New trading pair creation | 0.05 |
| `SUBSCRIBE_LARGE_TRADE_TXS` | Large trade monitoring (event: `TXS_LARGE_TRADE_DATA`) | 0.006 |
| `SUBSCRIBE_WALLET_TXS` | Specific wallet activity | 0.004 |
| `SUBSCRIBE_TOKEN_STATS` | Token statistics updates | 0.005 |
| `SUBSCRIBE_MEME` | Meme token stats updates | varies |

### CU Billing
- WebSocket CU is charged per byte received, not per message
- Different channels have different per-byte costs
- High-volume channels (TXS) are cheapest per byte
- Rare event channels (NEW_LISTING) are most expensive per byte
