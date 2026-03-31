# Realtime Streams — Reconnection Handling

## Why Reconnection is Critical

WebSocket connections will drop. This is normal and expected. Reasons include:
- Server-side maintenance or upgrades
- Network interruptions
- Idle timeout
- Client-side issues

**ALWAYS implement auto-reconnection. Never assume a connection will stay alive indefinitely.**

## Reconnection Pattern (TypeScript)

```typescript
class BirdeyeWebSocket {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private chain: string;
  private subscriptions: Array<{ type: string; data: any }> = [];
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;

  constructor(apiKey: string, chain: string = 'solana') {
    this.apiKey = apiKey;
    this.chain = chain;
  }

  connect() {
    this.isIntentionalClose = false;
    // Chain name goes in the URL path: /socket/solana, /socket/ethereum, etc.
    const url = `wss://public-api.birdeye.so/socket/${this.chain}?x-api-key=${this.apiKey}`;
    this.ws = new WebSocket(url, 'echo-protocol', {
      headers: { 'Origin': 'ws://public-api.birdeye.so' },  // Required headers
    });

    this.ws.on('open', () => {
      console.log('Connected to Birdeye WebSocket');
      this.reconnectDelay = 1000; // Reset delay on successful connect

      // Re-subscribe to all channels
      for (const sub of this.subscriptions) {
        this.ws!.send(JSON.stringify(sub));
      }

      // Start ping keepalive
      this.startPing();
    });

    this.ws.on('message', (rawData: Buffer) => {
      const msg = JSON.parse(rawData.toString());
      this.handleMessage(msg);
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`Disconnected: ${code} - ${reason.toString()}`);
      this.stopPing();

      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('WebSocket error:', err.message);
      // Don't reconnect here — the 'close' event will fire after 'error'
    });
  }

  private scheduleReconnect() {
    console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
    setTimeout(() => {
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  subscribe(type: string, data: any) {
    const sub = { type, data };
    this.subscriptions.push(sub);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(sub));
    }
    // If not connected, will be sent on next connect
  }

  unsubscribe(type: string, data: any) {
    // Remove from stored subscriptions
    this.subscriptions = this.subscriptions.filter(
      s => !(s.type === type && JSON.stringify(s.data) === JSON.stringify(data))
    );

    // Send unsubscribe message
    const unsubType = type.replace('SUBSCRIBE_', 'UNSUBSCRIBE_');
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: unsubType, data }));
    }
  }

  close() {
    this.isIntentionalClose = true;
    this.stopPing();
    this.ws?.close();
  }

  private handleMessage(msg: any) {
    // Override this method or use event emitter
    console.log(`[${msg.type}]`, msg.data);
  }
}
```

## Usage

```typescript
const client = new BirdeyeWebSocket(process.env.BIRDEYE_API_KEY!);

// Subscribe before connecting — will be sent on connect
client.subscribe('SUBSCRIBE_PRICE', {
  queryType: 'simple',
  chartType: '1m',
  address: 'So11111111111111111111111111111111111111112',
  currency: 'usd',
});

client.subscribe('SUBSCRIBE_TOKEN_NEW_LISTING', {});

// Connect
client.connect();

// Later: add more subscriptions
client.subscribe('SUBSCRIBE_WALLET_TXS', {
  address: 'whale_wallet_address',
});

// Cleanup
process.on('SIGINT', () => {
  client.close();
  process.exit(0);
});
```

## Reconnection Best Practices

1. **Exponential backoff**: Start at 1s, double each attempt, cap at 30s.
2. **Reset on success**: Reset delay to 1s after successful connection.
3. **Store subscriptions**: Keep a list of active subscriptions so they can be re-sent on reconnect.
4. **Don't reconnect on intentional close**: Track whether the close was user-initiated.
5. **Handle the gap**: Data received between disconnect and reconnect is lost. If you need gapless data, supplement with REST API calls after reconnect to fill the gap.
6. **Connection health monitoring**: If pings are not acknowledged, close and reconnect proactively.

## Gap Recovery

After reconnection, you may have missed events. To recover:

```typescript
ws.on('open', () => {
  // Re-subscribe
  resubscribeAll();

  // Fill gap with REST API
  const gapStart = lastReceivedTimestamp;
  const gapEnd = Math.floor(Date.now() / 1000);

  // Example: fill price gap
  fetch(`https://public-api.birdeye.so/defi/v3-ohlcv?address=${tokenAddress}&type=1m&time_from=${gapStart}&time_to=${gapEnd}`, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': 'solana',
    },
  })
    .then(res => res.json())
    .then(data => {
      // Process missed candles
      for (const candle of data.data.items) {
        handlePriceUpdate(candle);
      }
    });
});
```

## Common Mistakes

- Not implementing ping keepalive — connection drops silently.
- Reconnecting on 'error' event instead of 'close' — causes duplicate reconnections.
- Not storing subscriptions — losing all subscriptions on reconnect.
- Not implementing exponential backoff — hammering the server during outages.
- Not handling the data gap between disconnect and reconnect.
