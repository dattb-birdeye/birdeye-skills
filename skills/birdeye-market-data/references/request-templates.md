# Market Data — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`

---

## 1) Current price — single token

```bash
curl -sS "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.value` (price USD), `data.priceChange24h`, `data.updateUnixTime`

---

## 2) Current prices — batch (up to 100 tokens)

```bash
curl -sS "https://public-api.birdeye.so/defi/multi_price?list_address=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data[address].value`, `data[address].priceChange24h`

---

## 3) Token overview — price + volume + liquidity + supply in one call

```bash
curl -sS "https://public-api.birdeye.so/defi/token_overview?address=So11111111111111111111111111111111111111112" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.{ price, priceChange24h, volume24h, liquidity, marketCap, holder, supply, name, symbol }`

---

## 4) OHLCV — last 24 hours at 1H candles

```typescript
const now = Math.floor(Date.now() / 1000);
const from = now - 86400; // 24h ago

const url = `https://public-api.birdeye.so/defi/v3/ohlcv?address=So11111111111111111111111111111111111111112&type=1H&time_from=${from}&time_to=${now}`;

const res = await fetch(url, {
  headers: {
    'X-API-KEY': process.env.BIRDEYE_API_KEY!,
    'x-chain': 'solana',
    'accept': 'application/json',
  },
});
const data = await res.json();
// data.data.items[] → { o, h, l, c, v, unixTime }
```

---

## 5) Price at a specific past timestamp

```typescript
const targetTimestamp = 1700000000; // Unix seconds

const res = await fetch(
  `https://public-api.birdeye.so/defi/historical_price_unix?address=So11111111111111111111111111111111111111112&unixtime=${targetTimestamp}`,
  {
    headers: {
      'X-API-KEY': process.env.BIRDEYE_API_KEY!,
      'x-chain': 'solana',
      'accept': 'application/json',
    },
  }
);
const data = await res.json();
// data.data.value → price USD at that timestamp
```

---

## 6) Pair OHLCV — specific DEX pool candles

```typescript
const now = Math.floor(Date.now() / 1000);
const from = now - 7 * 86400; // 7 days

const url = `https://public-api.birdeye.so/defi/v3/ohlcv/pair?address=<PAIR_ADDRESS>&type=4H&time_from=${from}&time_to=${now}`;
```

---

## 7) Batch metadata — name/symbol/logo for N tokens

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/meta-data/multiple?list_address=addr1,addr2,addr3" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## Auth note

All requests require:
```
X-API-KEY: <your-api-key>
x-chain: solana          # or: ethereum, bsc, base, arbitrum, etc.
accept: application/json
```

Omitting `x-chain` defaults to `solana`. This is the #1 cause of "token not found" on EVM chains.
