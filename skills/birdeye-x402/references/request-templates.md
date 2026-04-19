# x402 — Request Templates

Base URL: `https://public-api.birdeye.so/x402`
Required headers: `x-chain: solana` | `accept: application/json`
No `X-API-KEY` — payment via USDC on Solana.

**Setup** (run once per process):

```typescript
import { withPaymentInterceptor } from '@x402/fetch';
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY!))
);
const fetch402 = withPaymentInterceptor(globalThis.fetch, { wallet: keypair });
```

---

## 1) Token price

```typescript
const res  = await fetch402(
  'https://public-api.birdeye.so/x402/defi/price?address=So11111111111111111111111111111111111111112',
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json = await res.json() as any;
const price = json.data.value;  // number
```

---

## 2) Multi-token price (GET, up to ~20 addresses)

```typescript
const addresses = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
].join(',');

const res  = await fetch402(
  `https://public-api.birdeye.so/x402/defi/multi_price?list_address=${addresses}`,
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json = await res.json() as any;
// json.data['So111...'].value, json.data['EPjF...'].value
```

---

## 3) Token overview (fundamentals)

```typescript
const res  = await fetch402(
  `https://public-api.birdeye.so/x402/defi/token_overview?address=${tokenAddress}`,
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json = await res.json() as any;
const { marketCap, volume24h, holder, priceChange24hPercent } = json.data;
```

---

## 4) Token security check

```typescript
const res  = await fetch402(
  `https://public-api.birdeye.so/x402/defi/token_security?address=${tokenAddress}`,
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json = await res.json() as any;
const sec  = json.data;

const isHighRisk = sec.mintable || sec.freezeable || sec.creatorPercentage > 0.20;
const isMedRisk  = sec.top10HolderPercent > 0.50;
```

---

## 5) OHLCV candles

```typescript
const now  = Math.floor(Date.now() / 1000);
const from = now - 86400;  // last 24h

const url = new URL('https://public-api.birdeye.so/x402/defi/v3/ohlcv');
url.searchParams.set('address', tokenAddress);
url.searchParams.set('type', '1H');        // 1m 5m 15m 1H 4H 1D
url.searchParams.set('time_from', String(from));
url.searchParams.set('time_to',   String(now));

const res  = await fetch402(url.toString(), {
  headers: { 'x-chain': 'solana', 'accept': 'application/json' },
});
const json = await res.json() as any;
const candles = json.data.items;  // [{ o, h, l, c, v, unixTime }]
```

---

## 6) Trending tokens

```typescript
const res  = await fetch402(
  'https://public-api.birdeye.so/x402/defi/token_trending?sort_by=rank&sort_type=asc&limit=20',
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json   = await res.json() as any;
const tokens = json.data.tokens ?? json.data;
```

---

## 7) Top traders for a token

```typescript
const res  = await fetch402(
  `https://public-api.birdeye.so/x402/defi/v2/tokens/top_traders?address=${tokenAddress}&time_frame=24h&sort_by=volume&sort_type=desc&limit=10`,
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json    = await res.json() as any;
const traders = json.data.items;
```

---

## 8) Holder distribution

```typescript
// ⚠️ param is token_address (not address)
const res  = await fetch402(
  `https://public-api.birdeye.so/x402/holder/v1/distribution?token_address=${tokenAddress}`,
  { headers: { 'x-chain': 'solana', 'accept': 'application/json' } }
);
const json = await res.json() as any;
const { summary, holders } = json.data;
```

---

## 9) Generic helper (reusable)

```typescript
async function x402Get(fetch402: typeof fetch, path: string, params: Record<string, string> = {}, chain = 'solana') {
  const url = new URL(`https://public-api.birdeye.so/x402${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch402(url.toString(), {
    headers: { 'x-chain': chain, 'accept': 'application/json' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as any;
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// Usage
const data = await x402Get(fetch402, '/defi/price', { address: 'So111...' });
```
