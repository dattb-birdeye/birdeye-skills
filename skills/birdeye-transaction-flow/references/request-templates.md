# Transaction Flow — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`

---

## 1) Recent trades for a token (buys only)

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/txs?address=<TOKEN_ADDRESS>&tx_type=buy&limit=20&sort_type=desc" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.items[].{ txHash, blockUnixTime, owner, from, to, volumeUSD, side }`, `data.hasNext`

---

## 2) Token trades in a time range

```typescript
const now = Math.floor(Date.now() / 1000);
const oneHourAgo = now - 3600;

const params = new URLSearchParams({
  address: '<TOKEN_ADDRESS>',
  after_time: String(oneHourAgo),
  before_time: String(now),
  tx_type: 'swap',
  limit: '50',
});

const res = await fetch(
  `https://public-api.birdeye.so/defi/v3/token/txs?${params}`,
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY!, 'x-chain': 'solana', 'accept': 'application/json' } }
);
```

---

## 3) Whale trades only (min volume filter)

```bash
# token_address, volume_type, and sort_type are all required
curl -sS "https://public-api.birdeye.so/defi/v3/token/txs-by-volume?token_address=<TOKEN_ADDRESS>&volume_type=usd&min_volume=10000&sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**volume_type**: `usd` (filter by USD value) or `amount` (filter by token amount)

---

## 4) Trades by a specific wallet

```typescript
const now = Math.floor(Date.now() / 1000);
const params = new URLSearchParams({
  address: '<WALLET_ADDRESS>',
  after_time: String(now - 86400),  // last 24h
  before_time: String(now),
  limit: '50',
});

const res = await fetch(
  `https://public-api.birdeye.so/trader/txs/seek_by_time?${params}`,
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY!, 'x-chain': 'solana', 'accept': 'application/json' } }
);
```

---

## 5) Balance changes for a wallet

```bash
# Required param is "address" (not "wallet")
curl -sS "https://public-api.birdeye.so/wallet/v2/balance-change?address=<WALLET_ADDRESS>&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.items[].{ address, symbol, amount, uiAmount, changeType, blockUnixTime, txHash }`

---

## 6) Mint/burn events for a token

```bash
# address, sort_by, sort_type, and type are all required
curl -sS "https://public-api.birdeye.so/defi/v3/token/mint-burn-txs?address=<TOKEN_ADDRESS>&type=mint&sort_by=block_time&sort_type=desc&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**type**: `all`, `mint`, or `burn`

---

## 7) Token transfer history (POST)

```bash
curl -sS -X POST "https://public-api.birdeye.so/token/v1/transfer" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"address": "<TOKEN_ADDRESS>", "offset": 0, "limit": 50}'
```

---

## Live trades (WebSocket — no polling needed)

For real-time trades, use `birdeye-realtime-streams` instead of polling:
```
SUBSCRIBE_TXS        → live token trades (pass address in data wrapper)
SUBSCRIBE_WALLET_TXS → live wallet activity
```
