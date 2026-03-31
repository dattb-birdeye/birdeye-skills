# Realtime Streams — Caveats

## WebSocket URL requires chain in path

REST API uses `x-chain` header for chain selection. WebSocket is DIFFERENT — the chain is part of the URL path:

```
WRONG:  wss://public-api.birdeye.so/socket?x-api-key=KEY        ← missing chain
WRONG:  wss://public-api.birdeye.so/socket?x-chain=solana&...    ← chain is not a query param
RIGHT:  wss://public-api.birdeye.so/socket/solana?x-api-key=KEY  ← chain in URL path
```

For other chains: `/socket/ethereum`, `/socket/bsc`, `/socket/arbitrum`, `/socket/base`, etc.

## Required headers — connection will fail without them

```
Origin: ws://public-api.birdeye.so
Sec-WebSocket-Origin: ws://public-api.birdeye.so
Sec-WebSocket-Protocol: echo-protocol
```

In Node.js (ws library), pass `echo-protocol` as the second argument and Origin in headers:
```typescript
new WebSocket(url, 'echo-protocol', {
  headers: { 'Origin': 'ws://public-api.birdeye.so' }
});
```

## Some channels have NO `data` wrapper

Most channels wrap params in a `data` object. These three do NOT:
- `SUBSCRIBE_TOKEN_NEW_LISTING` — params at top level
- `SUBSCRIBE_NEW_PAIR` — params at top level
- `SUBSCRIBE_LARGE_TRADE_TXS` — params at top level

```
WRONG:  { "type": "SUBSCRIBE_TOKEN_NEW_LISTING", "data": { "min_liquidity": 5000 } }
RIGHT:  { "type": "SUBSCRIBE_TOKEN_NEW_LISTING", "min_liquidity": 5000 }
```

## Large trade event name mismatch

The subscription type is `SUBSCRIBE_LARGE_TRADE_TXS` but the response event type is `TXS_LARGE_TRADE_DATA` (not `LARGE_TRADE_TXS_DATA`).

## BASE_QUOTE_PRICE — one pair per connection

Each WebSocket connection supports only ONE base-quote pair subscription. To monitor multiple pairs, open separate connections.

## New subscription replaces old one (TXS)

Sending a new `SUBSCRIBE_TXS` replaces any existing TXS subscription on that connection. To monitor multiple tokens/pairs, use a complex query with up to 100 addresses.

## Business tier required

WebSocket access requires Business tier or higher subscription. Lower tiers will get connection refused.
