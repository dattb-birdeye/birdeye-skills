# Token Discovery — Request Templates

Base URL: `https://public-api.birdeye.so`
Required headers: `X-API-KEY: <key>` | `x-chain: solana` | `accept: application/json`

---

## 1) Search tokens by keyword

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/search?keyword=bonk&target=token&limit=5" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.items[].result[].{ address, name, symbol, liquidity, volume24hUSD, marketCap, network }`

---

## 2) Token list — top by volume with filters

```typescript
const params = new URLSearchParams({
  sort_by: 'volume24h',
  sort_type: 'desc',
  limit: '50',
  min_liquidity: '10000',
  min_volume_24h: '5000',
});

const res = await fetch(
  `https://public-api.birdeye.so/defi/v3/token/list?${params}`,
  {
    headers: {
      'X-API-KEY': process.env.BIRDEYE_API_KEY!,
      'x-chain': 'solana',
      'accept': 'application/json',
    },
  }
);
const data = await res.json();
// data.data.tokens[] → { address, name, symbol, price, volume24h, liquidity, marketCap, holder }
```

---

## 3) Trending tokens (right now)

```bash
curl -sS "https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&interval=24h&limit=20" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

Note: `sort_by` and `sort_type` are **required**. Valid `sort_by` values: `rank`, `volumeUSD`, `liquidity`.

---

## 4) New listings — last 24 hours

```typescript
const res = await fetch(
  'https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=50&meme_platform_enabled=true',
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

## 5) Meme token detail (pump.fun status)

```bash
curl -sS "https://public-api.birdeye.so/defi/v3/token/meme/detail/single?address=<TOKEN_ADDRESS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

---

## 6) Token creation info (who deployed it)

```bash
curl -sS "https://public-api.birdeye.so/defi/token_creation_info?address=<TOKEN_ADDRESS>" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

**Response key fields**: `data.{ deployer, owner, txHash, blockUnixTime, slot }`

---

## 7) Markets / DEX pools for a token

```bash
curl -sS "https://public-api.birdeye.so/defi/v2/markets?address=<TOKEN_ADDRESS>&sort_by=liquidity&sort_type=desc&limit=10" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```
