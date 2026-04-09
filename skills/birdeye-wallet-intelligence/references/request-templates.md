# Wallet Intelligence — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`
Rate limit: **30 RPM** for wallet endpoints — sequence calls, do not burst.

---

## 1) Current net worth

```bash
# sort_type is required
curl -sS "https://public-api.birdeye.so/wallet/v2/current-net-worth?wallet=<WALLET_ADDRESS>&sort_type=desc" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.{ wallet, totalUsd, solBalance, solUsdValue, tokenCount, updateTime }`

---

## 2) Portfolio breakdown (token-by-token)

```bash
# sort_type is required
curl -sS "https://public-api.birdeye.so/wallet/v2/net-worth-details?wallet=<WALLET_ADDRESS>&sort_type=desc" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## 3) PnL summary

```bash
curl -sS "https://public-api.birdeye.so/wallet/v2/pnl/summary?wallet=<WALLET_ADDRESS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.{ totalPnl, totalPnlPercent, realizedPnl, unrealizedPnl, winRate, totalTrades }`

---

## 4) PnL per token

```typescript
// token_addresses is REQUIRED (comma-separated)
const tokens = 'So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const res = await fetch(
  `https://public-api.birdeye.so/wallet/v2/pnl?wallet=<WALLET_ADDRESS>&token_addresses=${tokens}`,
  {
    headers: {
      'X-API-KEY': process.env.BIRDEYE_API_KEY!,
      'x-chain': 'solana',
      'accept': 'application/json',
    },
  }
);
```

---

## 5) Top traders for a token

```typescript
// time_frame, sort_by, sort_type are ALL required
const params = new URLSearchParams({
  address: 'So11111111111111111111111111111111111111112',
  time_frame: '24h',   // 30m | 1h | 2h | 4h | 6h | 8h | 12h | 24h
  sort_by: 'volume',   // volume | trade
  sort_type: 'desc',
  limit: '20',
});

const res = await fetch(
  `https://public-api.birdeye.so/defi/v2/tokens/top_traders?${params}`,
  {
    headers: {
      'X-API-KEY': process.env.BIRDEYE_API_KEY!,
      'x-chain': 'solana',
      'accept': 'application/json',
    },
  }
);
```

---

## 6) Gainers / losers today

```typescript
// type, sort_by, sort_type are ALL required
const params = new URLSearchParams({
  type: 'today',     // today | yesterday | 1W
  sort_by: 'PnL',
  sort_type: 'desc',
  limit: '20',
});

const res = await fetch(
  `https://public-api.birdeye.so/trader/gainers-losers?${params}`,
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY!, 'x-chain': 'solana', 'accept': 'application/json' } }
);
```

---

## 7) Batch net worth for multiple wallets

```bash
curl -sS -X POST "https://public-api.birdeye.so/wallet/v2/net-worth-summary/multiple" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"wallets": ["wallet1", "wallet2", "wallet3"]}'
```
