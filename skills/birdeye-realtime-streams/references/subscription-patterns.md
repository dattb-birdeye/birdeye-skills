# Realtime Streams — Subscription Patterns

> **Note**: Code examples below reference WebSocket event fields illustratively. Before implementing, WebFetch the Docs URL for each channel in `stream-map.md` to verify the actual event schema.

## Basic Connection Pattern

```typescript
const WebSocket = require('ws');

const API_KEY = process.env.BIRDEYE_API_KEY;

// Chain name goes in the URL path: /socket/solana, /socket/ethereum, /socket/bsc, etc.
const chain = 'solana';

const ws = new WebSocket(
  `wss://public-api.birdeye.so/socket/${chain}?x-api-key=${API_KEY}`,
  'echo-protocol',  // Required: Sec-WebSocket-Protocol header
  {
    headers: {
      'Origin': 'ws://public-api.birdeye.so',  // Required header
    },
  }
);

ws.on('open', () => {
  console.log('Connected to Birdeye WebSocket');

  // Subscribe to desired channels
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_PRICE',
    data: {
      queryType: 'simple',
      chartType: '1m',
      address: 'So11111111111111111111111111111111111111112',
      currency: 'usd',
    },
  }));

  // Keep-alive ping
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);
});

ws.on('message', (rawData: Buffer) => {
  const msg = JSON.parse(rawData.toString());

  switch (msg.type) {
    case 'PRICE_DATA':
      handlePriceUpdate(msg.data);
      break;
    case 'TXS_DATA':
      handleTransaction(msg.data);
      break;
    case 'TOKEN_NEW_LISTING_DATA':
      handleNewListing(msg.data);
      break;
    // ... handle other event types
  }
});

ws.on('close', () => console.log('Disconnected'));
ws.on('error', (err: Error) => console.error('WebSocket error:', err));
```

## Multi-Channel Subscription

Subscribe to multiple channels on the same connection:

```typescript
ws.on('open', () => {
  // Channel 1: Price updates for SOL
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_PRICE',
    data: {
      queryType: 'simple',
      chartType: '1m',
      address: 'So11111111111111111111111111111111111111112',
      currency: 'usd',
    },
  }));

  // Channel 2: Transactions for SOL
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_TXS',
    data: {
      address: 'So11111111111111111111111111111111111111112',
    },
  }));

  // Channel 3: New listings — NO data wrapper, params are top-level
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_TOKEN_NEW_LISTING',
    min_liquidity: 5000,  // optional filter
  }));

  // Channel 4: Large trades — NO data wrapper, param is min_volume (not minVolumeUSD), no address param
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_LARGE_TRADE_TXS',
    min_volume: 50000,
  }));
});
```

## Whale Alert Pattern

Monitor large trades and wallet activity:

```typescript
function setupWhaleAlert(ws: WebSocket, config: {
  minVolumeUSD: number;    // Note: SUBSCRIBE_LARGE_TRADE_TXS has no address filter — it's chain-wide
  whaleWallets: string[];
}) {
  // Track large trades chain-wide — NO data wrapper, param is min_volume
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_LARGE_TRADE_TXS',
    min_volume: config.minVolumeUSD,
  }));

  // Track specific whale wallets
  for (const wallet of config.whaleWallets) {
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_WALLET_TXS',
      data: { address: wallet },
    }));
  }
}
```

## New Token Sniper Pattern

Monitor new listings and quickly analyze:

```typescript
ws.on('message', async (rawData: Buffer) => {
  const msg = JSON.parse(rawData.toString());

  if (msg.type === 'TOKEN_NEW_LISTING_DATA') {
    const token = msg.data;

    console.log(`New token: ${token.symbol} (${token.address})`);
    console.log(`DEX: ${token.source}, Liquidity: $${token.liquidity}`);  // field: liquidity (not initialLiquidity)

    // Quick security check via REST API
    const securityRes = await fetch(
      `https://public-api.birdeye.so/defi/token_security?address=${token.address}`,
      { headers: { 'X-API-KEY': API_KEY, 'x-chain': 'solana' } }
    );
    const security = await securityRes.json();

    if (security.data?.mintAuthority) {
      console.log('WARNING: Mint authority active — skip');
      return;
    }

    if (token.liquidity < 5000) {
      console.log('WARNING: Low liquidity — skip');
      return;
    }

    console.log('PASSED initial checks — monitor');

    // Subscribe to price updates for this token
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE_PRICE',
      data: {
        queryType: 'simple',
        chartType: '1m',
        address: token.address,
        currency: 'usd',
      },
    }));
  }
});
```

## Dashboard Price Feed

Stream prices for a portfolio of tokens:

```typescript
function setupDashboardFeed(ws: WebSocket, tokenAddresses: string[]) {
  if (tokenAddresses.length > 100) {
    throw new Error('Max 100 addresses per complex subscription');
  }

  // Build complex query for all tokens
  const queryParts = tokenAddresses.map(
    addr => `(address = ${addr} AND chartType = 1m AND currency = usd)`
  );
  const query = queryParts.join(' OR ');

  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_PRICE',
    data: {
      queryType: 'complex',
      query,
    },
  }));
}
```

## Python WebSocket Pattern

```python
import asyncio
import websockets
import json

API_KEY = "your_api_key"

async def birdeye_stream():
    chain = "solana"
    uri = f"wss://public-api.birdeye.so/socket/{chain}?x-api-key={API_KEY}"

    async with websockets.connect(
        uri,
        subprotocols=["echo-protocol"],
        extra_headers={
            "Origin": "ws://public-api.birdeye.so",
        }
    ) as ws:
        # Subscribe
        await ws.send(json.dumps({
            "type": "SUBSCRIBE_PRICE",
            "data": {
                "queryType": "simple",
                "chartType": "1m",
                "address": "So11111111111111111111111111111111111111112",
                "currency": "usd"
            }
        }))

        # Keep-alive
        async def ping():
            while True:
                await asyncio.sleep(30)
                await ws.ping()

        asyncio.create_task(ping())

        # Listen
        async for message in ws:
            data = json.loads(message)
            print(f"[{data['type']}] {data['data']}")

asyncio.run(birdeye_stream())
```
