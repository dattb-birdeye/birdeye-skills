# Market Data — Preflight Checklist

Before making any market data API call, run through this checklist:

## 1. Identify Chain

```
User says "ETH price" → x-chain: ethereum, address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (WETH)
User says "SOL price" → x-chain: solana, address: So11111111111111111111111111111111111111112
User says "BNB price" → x-chain: bsc, address: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c (WBNB)
```

If chain is ambiguous, ask the user. Default to `solana`.

## 2. Resolve Token Address

- If user provides a symbol (e.g., "SOL", "BONK"), use `GET /defi/v3-search?keyword=<symbol>` to resolve the address first.
- If user provides an address, validate format:
  - Solana: base58 string, typically 32-44 characters
  - EVM: 0x-prefixed hex, 42 characters

## 3. Determine Data Type Needed

| User wants... | Best endpoint | CU |
|---|---|---|
| Current price only | `/defi/price` | 10 |
| Current price + volume | `/defi/price_volume-single` | 15 |
| Multiple current prices | `/defi/multi_price` | 10/token |
| Chart/candle data | `/defi/v3-ohlcv` | Dynamic |
| Full token stats | `/defi/token_overview` | 30 |
| Just metadata (name, symbol) | `/defi/v3-token-meta-data-single` | 5 |
| Just market data (mcap, liquidity) | `/defi/v3-token-market-data` | 15 |
| Just trade metrics | `/defi/v3-token-trade-data-single` | 15 |
| Price at specific time | `/defi/historical_price_unix` | 10 |
| Price history over range | `/defi/history_price` | 60 |
| Pair-specific data | `/defi/v3-pair-overview-single` | 20 |

## 4. Set Time Range (for OHLCV/History)

Convert human-readable time to Unix timestamps:

```typescript
const now = Math.floor(Date.now() / 1000);
const time_ranges = {
  "1h":  { time_from: now - 3600, time_to: now },
  "4h":  { time_from: now - 14400, time_to: now },
  "24h": { time_from: now - 86400, time_to: now },
  "7d":  { time_from: now - 604800, time_to: now },
  "30d": { time_from: now - 2592000, time_to: now },
};
```

Choose interval based on range:
- 1h range → `1m` or `5m` interval
- 4h range → `5m` or `15m` interval
- 24h range → `15m` or `1H` interval
- 7d range → `1H` or `4H` interval
- 30d range → `4H` or `1D` interval

## 5. Validate Request

- [ ] `X-API-KEY` header set
- [ ] `x-chain` header set
- [ ] Token/pair address is valid for the specified chain
- [ ] Time range (if applicable) uses Unix seconds, not milliseconds
- [ ] Not exceeding 1000 records for OHLCV
- [ ] Not exceeding 100 addresses for batch endpoints

## 6. Request Template

```typescript
const response = await fetch(
  `https://public-api.birdeye.so/defi/price?address=${tokenAddress}`,
  {
    headers: {
      'X-API-KEY': process.env.BIRDEYE_API_KEY,
      'x-chain': chain, // 'solana' | 'ethereum' | 'bsc' | etc.
      'accept': 'application/json',
    },
  }
);

const data = await response.json();
if (!data.success) {
  throw new Error(data.message || 'Birdeye API error');
}
```
