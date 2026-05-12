# x402 — Request Templates

All examples assume the headless client from `scripts/x402-client.mjs`.

```js
import { createPaidFetch, x402Get, x402Post } from '../scripts/x402-client.mjs';
const { paidFetch } = await createPaidFetch();
```

`PRIVATE_KEY` env var must be set to a base58 Solana private key.
The client adds `x-chain: solana` and the Birdeye `payment-identifier` extension automatically.

---

## 1) Token price

```js
const data = await x402Get(paidFetch, '/defi/price', {
  address: 'So11111111111111111111111111111111111111112',
});
const price = data.value;
```

---

## 2) Token overview (fundamentals)

```js
const data = await x402Get(paidFetch, '/defi/token_overview', { address: tokenAddress });
const { price, marketCap, fdv, liquidity, volume24h, holder, priceChange24hPercent } = data;
```

---

## 3) Token security check

```js
const sec = await x402Get(paidFetch, '/defi/token_security', { address: tokenAddress });
const isHighRisk = sec.mintable || sec.freezeable || sec.creatorPercentage > 0.20;
const isMedRisk  = sec.top10HolderPercent > 0.50;
```

---

## 4) OHLCV candles

```js
const now  = Math.floor(Date.now() / 1000);
const data = await x402Get(paidFetch, '/defi/v3/ohlcv', {
  address: tokenAddress,
  type: '1H',                  // 1m 5m 15m 1H 4H 1D
  time_from: now - 86400,
  time_to: now,
});
const candles = data.items;    // [{ o, h, l, c, v, unixTime }]
```

---

## 5) Trending tokens

```js
const data = await x402Get(paidFetch, '/defi/token_trending', {
  sort_by: 'rank',
  sort_type: 'asc',
  limit: 20,
});
const tokens = data.tokens ?? data;
```

---

## 6) Top traders for a token

```js
const data = await x402Get(paidFetch, '/defi/v2/tokens/top_traders', {
  address: tokenAddress,
  time_frame: '24h',
  sort_by: 'volume',
  sort_type: 'desc',
  limit: 10,
});
const traders = data.items;
```

---

## 7) Holder distribution (note: `token_address`, not `address`)

```js
const data = await x402Get(paidFetch, '/holder/v1/distribution', {
  token_address: tokenAddress,
});
const { summary, holders } = data;
```

---

## 8) Search tokens / pairs

```js
const data = await x402Get(paidFetch, '/defi/v3/search', {
  keyword: 'BONK',
  chain: 'solana',
  target: 'token',
  sort_by: 'liquidity',
  sort_type: 'desc',
});
```

---

## 9) Smart-money token list

```js
const data = await x402Get(paidFetch, '/smart-money/v1/token/list', {
  interval: '1d',
  sort_by: 'smart_traders_no',
  sort_type: 'desc',
  limit: 20,
});
```

---

## 10) POST — batch holder counts

```js
const data = await x402Post(paidFetch, '/token/v1/holder/batch', {
  list_address: ['So111...', 'EPjF...'],
});
```

---

## 11) POST — token transfer history

```js
const data = await x402Post(paidFetch, '/token/v1/transfer', {
  // see Birdeye docs for body schema
});
```

---

## 12) Curl equivalent (replay after a paid request)

When using the interactive CLI (`node scripts/x402-cli.mjs`), each request prints a ready-to-replay curl with the captured `PAYMENT-SIGNATURE` header. Copy it as-is to retry the exact same paid request.

```bash
curl -X GET 'https://public-api.birdeye.so/x402/defi/price?address=So11111111111111111111111111111111111111112' \
  -H 'x-chain: solana' \
  -H 'accept: application/json' \
  -H 'PAYMENT-SIGNATURE: <captured-base64>'
```
