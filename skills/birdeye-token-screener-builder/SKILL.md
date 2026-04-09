---
name: birdeye-token-screener-builder
description: Build token screeners, trending boards, and alpha finders by composing Birdeye domain skills — token-discovery, market-data, security-analysis, and smart-money.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
  type: workflow
---

# Birdeye Token Screener Builder — Discover & Filter Tokens

You are an expert at building token screening and discovery tools using multiple Birdeye domain skills. This workflow skill orchestrates data from token-discovery, market-data, security-analysis, and smart-money to create comprehensive token screeners.

## When To Use

- User wants to build a **token screener** with custom filters
- User wants to build a **trending token board**
- User wants to create an **alpha finder** / token discovery tool
- User wants to build a **new listing scanner**

## Skills Used

| Skill | Purpose |
|---|---|
| `birdeye-token-discovery` | Token lists, search, trending, new listings, meme tokens |
| `birdeye-market-data` | Price, volume, liquidity, market cap, trade data |
| `birdeye-security-analysis` | Risk assessment, rug pull flags |
| `birdeye-smart-money` | Smart money accumulation signals |
| `birdeye-holder-analysis` | Holder distribution and concentration |
| `birdeye-realtime-streams` | Live new listing and price updates |

> ⚠️ Key fields in operation maps are hints only — verify via docs before parsing responses. Code templates below reference response fields illustratively — verify actual field names via docs before use.
## Workflow: Build Token Screener

### Step 1: Define Screening Criteria
Map user's criteria to API parameters:

```typescript
interface ScreenerCriteria {
  // Market filters (map directly to /defi/v3/token/list params)
  minLiquidity?: number;        // min_liquidity
  minVolume24h?: number;        // min_volume_24h
  minMarketCap?: number;        // min_market_cap
  maxMarketCap?: number;        // post-filter (no API param)
  minHolders?: number;          // min_holder

  // Price filters (post-filter, no API param)
  minPriceChange24h?: number;
  maxPriceChange24h?: number;

  // Safety filters (from /defi/token_security response booleans)
  requireNoMintAuthority?: boolean;   // checks: !data.mintAuthority (Solana) | data.isMintable==="0" (EVM)
  requireNoFreezeAuthority?: boolean; // checks: !data.freezeAuthority
  requireLockedLiquidity?: boolean;   // checks: data.lockInfo !== null

  // Smart money filters (post-filter against /smart-money/v1/token/list)
  requireSmartMoneyAccumulation?: boolean; // token must appear in smart money list with netFlow > 0
  minSmartMoneyWallets?: number;           // token.smartTradersNo >= minSmartMoneyWallets

  // Sorting (sort_by/sort_type for /defi/v3/token/list)
  sortBy: 'volume24h' | 'liquidity' | 'marketCap' | 'price' | 'priceChange24h' | 'holder' | 'trade24h';
  sortDirection: 'asc' | 'desc';
  limit: number;
}

interface ScreenerResult {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holders: number;
  smartMoneySignal: { netFlow: number; smartTradersNo: number } | null;
}
```

### Step 2: Fetch Base Token List
```
birdeye-token-discovery → GET /defi/v3/token/list (with market filters)
```

### Step 3: Enrich with Security Data
For each token in the list:
```
birdeye-security-analysis → GET /defi/token_security (risk check)
```
Filter out tokens that fail security criteria.

### Step 4: Check Smart Money Activity
```
birdeye-smart-money → GET /smart-money/v1/token/list
```
Cross-reference with screener results.

### Step 5: Optional — Holder Analysis
For top candidates:
```
birdeye-holder-analysis → GET /defi/v3/token/holder (concentration check)
```

### Step 6: Set Up Live Updates
```
birdeye-realtime-streams → SUBSCRIBE_TOKEN_NEW_LISTING (new tokens)
birdeye-realtime-streams → SUBSCRIBE_PRICE (price updates for screener results)
```

## Screener Implementation

```typescript
async function runScreener(
  apiKey: string,
  criteria: ScreenerCriteria,
  chain: string = 'solana'
): Promise<ScreenerResult[]> {
  const headers = {
    'X-API-KEY': apiKey,
    'x-chain': chain,
    'accept': 'application/json',
  };

  // Step 1: Get token list with market filters
  const params = new URLSearchParams({
    sort_by: criteria.sortBy || 'volume24h',
    sort_type: criteria.sortDirection || 'desc',
    limit: String(criteria.limit || 50),
  });
  if (criteria.minLiquidity) params.set('min_liquidity', String(criteria.minLiquidity));
  if (criteria.minVolume24h) params.set('min_volume_24h', String(criteria.minVolume24h));
  if (criteria.minMarketCap) params.set('min_market_cap', String(criteria.minMarketCap));
  if (criteria.minHolders) params.set('min_holder', String(criteria.minHolders));

  const listRes = await fetch(
    `https://public-api.birdeye.so/defi/v3/token/list?${params}`,
    { headers }
  );
  const listData = await listRes.json();
  let tokens = listData.data.tokens;

  // Step 2: Apply price change filters
  if (criteria.minPriceChange24h) {
    tokens = tokens.filter((t: any) => t.priceChange24h >= criteria.minPriceChange24h!);
  }
  if (criteria.maxPriceChange24h) {
    tokens = tokens.filter((t: any) => t.priceChange24h <= criteria.maxPriceChange24h!);
  }
  if (criteria.maxMarketCap) {
    tokens = tokens.filter((t: any) => t.marketCap <= criteria.maxMarketCap!);
  }

  // Step 3: Security check (batch — respect rate limits)
  const results: ScreenerResult[] = [];
  for (const token of tokens) {
    const secRes = await fetch(
      `https://public-api.birdeye.so/defi/token_security?address=${token.address}`,
      { headers }
    );
    const secData = await secRes.json();

    const sec = secData.data;
    // Solana: mintAuthority field; EVM: isMintable === "0"
    if (criteria.requireNoMintAuthority && (sec?.mintAuthority || sec?.isMintable === '1')) continue;
    if (criteria.requireNoFreezeAuthority && sec?.freezeAuthority) continue;
    if (criteria.requireLockedLiquidity && !sec?.lockInfo) continue;

    results.push({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      price: token.price,
      priceChange24h: token.priceChange24h,
      volume24h: token.volume24h,
      liquidity: token.liquidity,
      marketCap: token.marketCap,
      holders: token.holder,
      smartMoneySignal: null, // Filled in step 4
    });
  }

  // Step 4: Smart money overlay
  const smartRes = await fetch(
    `https://public-api.birdeye.so/smart-money/v1/token/list?interval=1d&sort_by=net_flow&sort_type=desc&limit=100`,
    { headers }
  );
  const smartData = await smartRes.json();
  const smartTokens = new Map<string, any>(
    (smartData.data?.items ?? []).map((t: any) => [t.address, t])
  );

  const filtered: typeof results = [];
  for (const result of results) {
    const smartInfo = smartTokens.get(result.address);

    if (criteria.requireSmartMoneyAccumulation && (!smartInfo || smartInfo.netFlow <= 0)) continue;
    if (criteria.minSmartMoneyWallets && (!smartInfo || smartInfo.smartTradersNo < criteria.minSmartMoneyWallets)) continue;

    if (smartInfo) {
      result.smartMoneySignal = {
        netFlow: smartInfo.netFlow,
        smartTradersNo: smartInfo.smartTradersNo,
      };
    }
    filtered.push(result);
  }

  return filtered;
}
```

## Preset Screeners

### Low-Cap Gems
```typescript
const lowCapGems: ScreenerCriteria = {
  minLiquidity: 10000,
  minVolume24h: 5000,
  maxMarketCap: 1000000,
  minHolders: 50,
  requireNoMintAuthority: true,
  requireLockedLiquidity: true,
  requireSmartMoneyAccumulation: true,
  sortBy: 'priceChange24h',
  sortDirection: 'desc',
  limit: 20,
};
```

### Trending Safe Tokens
```typescript
const trendingSafe: ScreenerCriteria = {
  minLiquidity: 50000,
  minVolume24h: 100000,
  minHolders: 500,
  minPriceChange24h: 10,
  requireNoMintAuthority: true,
  requireLockedLiquidity: true,
  sortBy: 'volume24h',
  sortDirection: 'desc',
  limit: 50,
};
```

### Whale-Followed Tokens
```typescript
const whaleFollowed: ScreenerCriteria = {
  minLiquidity: 100000,
  requireSmartMoneyAccumulation: true,
  minSmartMoneyWallets: 5,
  sortBy: 'volume24h',
  sortDirection: 'desc',
  limit: 30,
};
```

## CU Budget Planning

| Component | Calls | CU/Call | Total CU |
|---|---|---|---|
| Token List (V3) | 1 | 100 | 100 |
| Security Check | 50 tokens | 50 | 2,500 |
| Smart Money List | 1 | varies | ~50 |
| Holder Analysis | 10 tokens | varies | ~200 |
| **Total per scan** | | | **~2,850** |

For continuous screening, limit to hourly refreshes to manage CU costs.
