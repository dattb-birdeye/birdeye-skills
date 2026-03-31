# Market Data — Request Templates

## TypeScript/JavaScript Templates

### Get Current Price

```typescript
async function getTokenPrice(
  apiKey: string,
  address: string,
  chain: string = 'solana'
): Promise<{ price: number; change24h: number }> {
  const url = `https://public-api.birdeye.so/defi/price?address=${address}&include_liquidity=true`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return {
    price: json.data.value,
    change24h: json.data.priceChange24h,
  };
}
```

### Get Multiple Token Prices

```typescript
async function getMultiPrice(
  apiKey: string,
  addresses: string[],
  chain: string = 'solana'
): Promise<Record<string, number>> {
  if (addresses.length > 100) throw new Error('Max 100 addresses per request');

  const url = `https://public-api.birdeye.so/defi/multi_price?list_address=${addresses.join(',')}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  const prices: Record<string, number> = {};
  for (const [addr, data] of Object.entries(json.data)) {
    prices[addr] = (data as any).value;
  }
  return prices;
}
```

### Get OHLCV Candles

```typescript
async function getOHLCV(
  apiKey: string,
  address: string,
  interval: string,
  timeFrom: number,
  timeTo: number,
  chain: string = 'solana'
): Promise<Array<{ o: number; h: number; l: number; c: number; v: number; t: number }>> {
  const params = new URLSearchParams({
    address,
    type: interval,
    time_from: timeFrom.toString(),
    time_to: timeTo.toString(),
  });

  const url = `https://public-api.birdeye.so/defi/v3-ohlcv?${params}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return json.data.items.map((item: any) => ({
    o: item.o,
    h: item.h,
    l: item.l,
    c: item.c,
    v: item.v,
    t: item.unixTime,
  }));
}
```

### Get Token Overview

```typescript
async function getTokenOverview(
  apiKey: string,
  address: string,
  chain: string = 'solana'
): Promise<any> {
  const url = `https://public-api.birdeye.so/defi/token_overview?address=${address}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```

### Get Historical Price at Specific Time

```typescript
async function getPriceAtTime(
  apiKey: string,
  address: string,
  unixTime: number,
  chain: string = 'solana'
): Promise<number> {
  const url = `https://public-api.birdeye.so/defi/historical_price_unix?address=${address}&unixtime=${unixTime}`;

  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data.value;
}
```

## Python Templates

### Get Current Price

```python
import requests

def get_token_price(api_key: str, address: str, chain: str = "solana") -> dict:
    url = f"https://public-api.birdeye.so/defi/price"
    headers = {
        "X-API-KEY": api_key,
        "x-chain": chain,
        "accept": "application/json",
    }
    params = {"address": address, "include_liquidity": "true"}

    resp = requests.get(url, headers=headers, params=params)
    data = resp.json()

    if not data.get("success"):
        raise Exception(data.get("message", "API error"))

    return {
        "price": data["data"]["value"],
        "change_24h": data["data"].get("priceChange24h"),
    }
```

### Get OHLCV Candles

```python
import requests

def get_ohlcv(
    api_key: str,
    address: str,
    interval: str,
    time_from: int,
    time_to: int,
    chain: str = "solana"
) -> list:
    url = "https://public-api.birdeye.so/defi/v3-ohlcv"
    headers = {
        "X-API-KEY": api_key,
        "x-chain": chain,
        "accept": "application/json",
    }
    params = {
        "address": address,
        "type": interval,
        "time_from": time_from,
        "time_to": time_to,
    }

    resp = requests.get(url, headers=headers, params=params)
    data = resp.json()

    if not data.get("success"):
        raise Exception(data.get("message", "API error"))

    return data["data"]["items"]
```

## cURL Templates

### Get Price
```bash
curl -X GET "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```

### Get OHLCV
```bash
curl -X GET "https://public-api.birdeye.so/defi/v3-ohlcv?address=So11111111111111111111111111111111111111112&type=1H&time_from=1700000000&time_to=1700086400" \
  -H "X-API-KEY: $BIRDEYE_API_KEY" \
  -H "x-chain: solana" \
  -H "accept: application/json"
```
