---
name: birdeye-wallet-dashboard-builder
description: Build wallet dashboards, portfolio monitors, whale trackers, and wallet analysis reports by composing multiple Birdeye domain skills — wallet-intelligence, transaction-flow, holder-analysis, smart-money, and realtime-streams.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
  type: workflow
---

# Birdeye Wallet Dashboard Builder — Portfolio & Whale Monitoring

You are an expert at building wallet analysis dashboards and reports using multiple Birdeye domain skills. This workflow skill orchestrates data from wallet-intelligence, transaction-flow, holder-analysis, smart-money, and realtime-streams to create comprehensive wallet monitoring tools.

## When To Use

- User wants to build a **wallet dashboard** or **portfolio monitor**
- User wants to create a **wallet analysis report**
- User wants to build a **whale monitoring panel**
- User wants to track and compare **multiple wallets**

## Skills Used

| Skill | Purpose |
|---|---|
| `birdeye-wallet-intelligence` | Portfolio, net worth, PnL, top traders |
| `birdeye-transaction-flow` | Trade history, balance changes, transfers |
| `birdeye-holder-analysis` | Holder distribution for tokens held by wallet |
| `birdeye-smart-money` | Is this wallet classified as smart money? |
| `birdeye-realtime-streams` | Live wallet activity via SUBSCRIBE_WALLET_TXS |
| `birdeye-market-data` | Current prices for portfolio valuation |

## Response Discovery

This workflow composes multiple domain skills. Before writing code that parses API responses:

1. Read the relevant domain skill's `operation-map.md` for the **Docs** URL of each endpoint
2. **If birdeye-mcp is connected** → call the endpoint directly via MCP tool, inspect the real response
3. **Otherwise** → WebFetch the Docs URL to get the full response schema from docs.birdeye.so
4. **CRITICAL**: Key fields in operation maps are approximate hints only and may contain wrong field names. **NEVER use key field names in code without first verifying them via docs**

Code templates below reference response fields illustratively — verify actual field names via docs before use.

## Workflow: Build Wallet Dashboard

### Step 1: Gather Wallet Data
```
birdeye-wallet-intelligence → GET /wallet-v2-current-net-worth
birdeye-wallet-intelligence → GET /wallet-v2-net-worth-details
birdeye-wallet-intelligence → GET /wallet-v2-pnl-summary
```

### Step 2: Get Trade History
```
birdeye-transaction-flow → GET /trader-txs-seek_by_time (recent trades)
birdeye-transaction-flow → GET /wallet-v2-balance-change (balance changes)
```

### Step 3: Analyze Holdings
For each significant token in the portfolio:
```
birdeye-market-data → GET /defi/price (current prices)
birdeye-holder-analysis → GET /defi/v3-token-holder (holder rank for this wallet)
birdeye-security-analysis → GET /defi-token_security (risk check)
```

### Step 4: Smart Money Classification
```
birdeye-smart-money → Check if wallet appears in smart money lists
birdeye-wallet-intelligence → GET /wallet-v2-pnl (per-token performance)
```

### Step 5: Set Up Live Monitoring
```
birdeye-realtime-streams → SUBSCRIBE_WALLET_TXS (live trades)
birdeye-realtime-streams → SUBSCRIBE_PRICE (portfolio token prices)
```

## Data Composition Pattern

```typescript
interface WalletDashboard {
  // Identity
  wallet: string;
  chain: string;
  timestamp: number;

  // Portfolio
  portfolio: {
    totalValueUSD: number;
    nativeBalance: number;
    nativeValueUSD: number;
    tokens: Array<{
      address: string;
      symbol: string;
      name: string;
      balance: number;
      valueUSD: number;
      pctOfPortfolio: number;
      priceChange24h: number;
      holderRank: number | null;
      securityRisk: 'low' | 'medium' | 'high' | null;
    }>;
    netWorthHistory: Array<{ time: number; valueUSD: number }>;
  };

  // Performance
  performance: {
    totalPnl: number;
    totalPnlPct: number;
    realizedPnl: number;
    unrealizedPnl: number;
    winRate: number;
    bestTrade: { token: string; pnl: number; pnlPct: number };
    worstTrade: { token: string; pnl: number; pnlPct: number };
  };

  // Activity
  activity: {
    recentTrades: Array<{
      time: number;
      token: string;
      side: 'buy' | 'sell';
      amount: number;
      valueUSD: number;
      dex: string;
    }>;
    tradeFrequency: string;
    isSmartMoney: boolean;
  };

  // Risk
  risk: {
    concentrationPct: number;       // % in single largest position
    highRiskTokenCount: number;
    lowLiquidityTokenCount: number;
  };
}
```

## Whale Monitor Pattern

```typescript
async function setupWhaleMonitor(
  apiKey: string,
  whaleWallets: string[],
  onAlert: (alert: WhaleAlert) => void
) {
  const client = new BirdeyeWebSocket(apiKey);

  // Subscribe to all whale wallets
  for (const wallet of whaleWallets) {
    client.subscribe('SUBSCRIBE_WALLET_TXS', { address: wallet });
  }

  // Get baseline portfolios
  const baselines = new Map<string, number>();
  for (const wallet of whaleWallets) {
    const netWorth = await getWalletNetWorth(apiKey, wallet);
    baselines.set(wallet, netWorth.totalUsd);
  }

  // Monitor for significant trades
  client.onMessage((msg) => {
    if (msg.type === 'WALLET_TXS_DATA') {
      const trade = msg.data;
      const baseline = baselines.get(trade.owner) || 0;

      // Alert if trade is >5% of portfolio
      if (trade.volumeUSD > baseline * 0.05) {
        onAlert({
          wallet: trade.owner,
          action: trade.side,
          token: trade.to.symbol || trade.from.symbol,
          volumeUSD: trade.volumeUSD,
          portfolioPct: (trade.volumeUSD / baseline) * 100,
          timestamp: trade.blockUnixTime,
        });
      }
    }
  });

  client.connect();
  return client;
}
```

## Rate Limit Strategy

Wallet APIs have a 30 rpm limit. For dashboards:

1. **Initial load**: Make all wallet calls sequentially (respecting 30 rpm)
2. **Cache**: Store results for 60 seconds minimum
3. **Live updates**: Use WebSocket for real-time activity (no rate limit concern)
4. **Periodic refresh**: Refresh portfolio data every 2-5 minutes, not on every user action
5. **Batch endpoints**: Use `*-multiple` endpoints when comparing wallets
