---
name: birdeye-alert-agent
description: Build alert systems for volume spikes, whale trades, new token listings, large transactions, and custom conditions by composing Birdeye domain skills — realtime-streams, market-data, smart-money, and transaction-flow.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
  type: workflow
---

# Birdeye Alert Agent — Real-Time Alerting System

You are an expert at building real-time alert systems using Birdeye WebSocket streams and REST APIs. This workflow skill orchestrates realtime-streams, market-data, smart-money, and transaction-flow to create comprehensive alerting pipelines.

## When To Use

- User wants to build **price alerts** (threshold, percentage change)
- User wants to build **volume spike alerts**
- User wants to build **whale trade alerts**
- User wants to build **new listing alerts** with auto-analysis
- User wants to build **smart money movement alerts**
- User wants a **custom alert pipeline** combining multiple signals

## Skills Used

| Skill | Purpose |
|---|---|
| `birdeye-realtime-streams` | Core streaming infrastructure for all real-time alerts |
| `birdeye-market-data` | REST API fallback for price/volume context |
| `birdeye-smart-money` | Smart money token list for cross-referencing |
| `birdeye-transaction-flow` | Trade data enrichment |
| `birdeye-security-analysis` | Auto-screening new tokens |

> ⚠️ Key fields in operation maps are hints only — verify via docs before parsing responses. Code templates below reference response fields illustratively — verify actual field names via docs before use.
## Alert Types

### 1. Price Alert
Trigger when a token price crosses a threshold or changes by X%.

**Stream**: `SUBSCRIBE_PRICE`
**Logic**: Compare incoming price to threshold or baseline.

```typescript
interface PriceAlert {
  type: 'price_threshold' | 'price_change';
  tokenAddress: string;
  // For threshold
  threshold?: number;
  direction?: 'above' | 'below';
  // For percentage change
  changePercent?: number;
  timeWindow?: number;  // seconds
}

function createPriceAlertHandler(alert: PriceAlert) {
  const priceHistory: Array<{ price: number; time: number }> = [];

  return (data: any) => {
    if (data.address !== alert.tokenAddress) return null;

    const currentPrice = data.c; // Close price from OHLCV

    if (alert.type === 'price_threshold') {
      if (alert.direction === 'above' && currentPrice >= alert.threshold!) {
        return { triggered: true, price: currentPrice, message: `${data.symbol} crossed above $${alert.threshold}` };
      }
      if (alert.direction === 'below' && currentPrice <= alert.threshold!) {
        return { triggered: true, price: currentPrice, message: `${data.symbol} dropped below $${alert.threshold}` };
      }
    }

    if (alert.type === 'price_change') {
      priceHistory.push({ price: currentPrice, time: data.unixTime });
      // Remove old entries
      const cutoff = data.unixTime - (alert.timeWindow || 300);
      while (priceHistory.length > 0 && priceHistory[0].time < cutoff) {
        priceHistory.shift();
      }
      if (priceHistory.length > 1) {
        const oldPrice = priceHistory[0].price;
        const changePct = ((currentPrice - oldPrice) / oldPrice) * 100;
        if (Math.abs(changePct) >= alert.changePercent!) {
          return { triggered: true, changePct, message: `${data.symbol} moved ${changePct.toFixed(1)}% in ${alert.timeWindow}s` };
        }
      }
    }

    return null;
  };
}
```

### 2. Volume Spike Alert
Trigger when volume exceeds a baseline by X multiplier.

**Stream**: `SUBSCRIBE_TOKEN_STATS`
**Logic**: Compare current volume to rolling average.

```typescript
interface VolumeSpikeAlert {
  tokenAddress: string;
  multiplier: number;      // e.g., 3x normal volume
  baselineWindow: number;  // hours for baseline calculation
}
```

### 3. Whale Trade Alert
Trigger on large trades above threshold.

**Stream**: `SUBSCRIBE_LARGE_TRADE_TXS`
**Logic**: Direct — stream only sends trades above `minVolumeUSD`.

```typescript
function setupWhaleAlert(ws: BirdeyeWebSocket, config: {
  tokenAddress: string;
  minVolumeUSD: number;
  onAlert: (trade: any) => void;
}) {
  ws.subscribe('SUBSCRIBE_LARGE_TRADE_TXS', {
    address: config.tokenAddress,
    minVolumeUSD: config.minVolumeUSD,
  });

  ws.onMessage((msg) => {
    if (msg.type === 'TXS_LARGE_TRADE_DATA') {
      config.onAlert({
        type: 'whale_trade',
        token: msg.data.to?.symbol || msg.data.from?.symbol,
        side: msg.data.side,
        volumeUSD: msg.data.volumeUSD,
        wallet: msg.data.owner,
        txHash: msg.data.txHash,
        timestamp: msg.data.blockUnixTime,
      });
    }
  });
}
```

### 4. New Listing Alert
Trigger on new token listings with auto security screening.

**Stream**: `SUBSCRIBE_TOKEN_NEW_LISTING`
**Enrichment**: REST API for security check.

```typescript
async function setupNewListingAlert(ws: BirdeyeWebSocket, config: {
  apiKey: string;
  minLiquidity: number;
  requireNoMintAuthority: boolean;
  onAlert: (listing: any) => void;
}) {
  ws.subscribe('SUBSCRIBE_TOKEN_NEW_LISTING', {});

  ws.onMessage(async (msg) => {
    if (msg.type !== 'TOKEN_NEW_LISTING_DATA') return;

    const token = msg.data;

    // Quick filters
    if (token.initialLiquidity < config.minLiquidity) return;

    // Security check via REST
    try {
      const secRes = await fetch(
        `https://public-api.birdeye.so/defi-token_security?address=${token.address}`,
        { headers: { 'X-API-KEY': config.apiKey, 'x-chain': 'solana' } }
      );
      const secData = await secRes.json();

      if (config.requireNoMintAuthority && secData.data?.mintAuthority) return;

      config.onAlert({
        type: 'new_listing',
        token: {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          dex: token.dex,
          initialLiquidity: token.initialLiquidity,
          deployer: token.deployer,
        },
        security: {
          mintAuthority: secData.data?.mintAuthority || null,
          freezeAuthority: secData.data?.freezeAuthority || null,
          locked: secData.data?.lockInfo?.locked || false,
        },
        timestamp: token.blockUnixTime,
      });
    } catch (err) {
      // Security check failed — alert without security data
      config.onAlert({
        type: 'new_listing',
        token: { address: token.address, name: token.name, symbol: token.symbol },
        security: null,
        timestamp: token.blockUnixTime,
      });
    }
  });
}
```

### 5. Smart Money Movement Alert
Trigger when smart money starts accumulating a token.

**Approach**: Periodic REST polling (no WebSocket for smart money).

```typescript
async function pollSmartMoneyAlerts(config: {
  apiKey: string;
  pollIntervalMs: number;
  minNetVolume: number;
  minWalletCount: number;
  onAlert: (signal: any) => void;
}) {
  const seenTokens = new Set<string>();

  setInterval(async () => {
    const res = await fetch(
      `https://public-api.birdeye.so/smart-money-v1-token-list?sort_by=smart_net_volume&sort_type=desc&time_frame=24h&limit=20`,
      { headers: { 'X-API-KEY': config.apiKey, 'x-chain': 'solana' } }
    );
    const data = await res.json();

    for (const token of data.data.items) {
      if (
        token.smartNetVolume >= config.minNetVolume &&
        token.smartWalletCount >= config.minWalletCount &&
        !seenTokens.has(token.address)
      ) {
        seenTokens.add(token.address);
        config.onAlert({
          type: 'smart_money_accumulation',
          token: token.symbol,
          address: token.address,
          netVolume: token.smartNetVolume,
          walletCount: token.smartWalletCount,
          signal: token.signal,
        });
      }
    }
  }, config.pollIntervalMs);
}
```

## Composite Alert Pipeline

Combine multiple alert types into a unified system:

```typescript
class AlertPipeline {
  private ws: BirdeyeWebSocket;
  private handlers: Map<string, (data: any) => void> = new Map();

  constructor(apiKey: string) {
    this.ws = new BirdeyeWebSocket(apiKey);
  }

  addPriceAlert(alert: PriceAlert) { /* ... */ }
  addWhaleAlert(tokenAddress: string, minVolume: number) { /* ... */ }
  addNewListingAlert(config: any) { /* ... */ }

  onAlert(callback: (alert: AlertEvent) => void) { /* ... */ }

  start() {
    this.ws.connect();
  }

  stop() {
    this.ws.close();
  }
}
```

## Notification Integration

Alerts should be routed to user-specified channels:

```typescript
interface NotificationTarget {
  type: 'console' | 'webhook' | 'telegram' | 'discord';
  config: any;
}

async function sendNotification(target: NotificationTarget, alert: AlertEvent) {
  switch (target.type) {
    case 'console':
      console.log(`[ALERT] ${alert.message}`);
      break;
    case 'webhook':
      await fetch(target.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      break;
    case 'telegram':
      await fetch(`https://api.telegram.org/bot${target.config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: target.config.chatId,
          text: formatAlertForTelegram(alert),
          parse_mode: 'HTML',
        }),
      });
      break;
    case 'discord':
      await fetch(target.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formatAlertForDiscord(alert),
        }),
      });
      break;
  }
}
```
