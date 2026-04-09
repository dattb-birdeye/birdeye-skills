# Error Handling

## HTTP status codes

| Code | Meaning | Likely cause | Fix |
|---|---|---|---|
| `400` | Bad request | Missing required param, wrong enum value, malformed address | Check `canonical-endpoint-dictionary.md` for required params and valid enum values |
| `401` | Unauthorized | Missing or invalid `X-API-KEY` | Verify key exists and is in the `X-API-KEY` header (not `Authorization`) |
| `403` | Forbidden | Feature requires higher plan tier | Upgrade plan — e.g., WebSocket requires Business+ |
| `404` | Not found | Token/wallet not on this chain, wrong address format | Verify `x-chain` matches the address's chain; check address format |
| `429` | Rate limited | Exceeded requests/sec or wallet 30 RPM | Apply exponential backoff (see below) |
| `500` | Server error | Transient Birdeye issue | Retry with backoff |
| `503` | Service unavailable | Maintenance or overload | Retry after delay |

## Response body structure

All Birdeye REST responses follow:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "statusCode": 400
}
```

**Always check `response.success === true` before accessing `response.data`.**

## Exponential backoff for 429 / 5xx

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 4
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.ok) return res;

    if (res.status === 429 || res.status >= 500) {
      if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} retries: ${res.status}`);
      const delay = Math.min(1000 * Math.pow(2, attempt), 16000); // 1s → 2s → 4s → 8s → 16s cap
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    // 4xx errors (except 429) are not retryable — throw immediately
    const body = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${body.message || res.statusText}`);
  }
  throw new Error('Unreachable');
}
```

## Wallet API — 30 RPM sequencing

```typescript
// Birdeye wallet endpoints: 30 RPM = 1 call per 2 seconds to be safe
async function walletFetch(url: string, headers: HeadersInit): Promise<any> {
  const res = await fetch(url, { headers });
  await new Promise(r => setTimeout(r, 2100)); // 2.1s between wallet calls
  if (!res.ok) throw new Error(`Wallet API error ${res.status}`);
  return res.json();
}
```

## Common mistakes and fixes

| Symptom | Cause | Fix |
|---|---|---|
| `success: false, message: "token not found"` | Wrong chain header | Add correct `x-chain` header for the address's chain |
| `success: false` on wallet endpoint | Wrong chain or address format | Wallet APIs are Solana-only; verify address is base58 |
| Empty `data.items` on token search | `keyword` param missing | For `/defi/v3/search`, `keyword` is optional — but `sort_by` and `sort_type` are required |
| `400` on `/defi/v3/token/txs-by-volume` | Using `address` instead of `token_address` | This endpoint requires `token_address` (not `address`) + `volume_type` |
| `400` on `/wallet/v2/current-net-worth` | Missing `sort_type` | `sort_type` is **required** on all `/wallet/v2/net-worth*` endpoints |
| `400` on gainers-losers | Wrong `type` values | Use `yesterday`, `today`, `1W` — NOT `gainers`/`losers` |
| `400` on `/defi/v2/markets` | Missing required params | `time_frame`, `sort_by`, `sort_type` are all required |

## WebSocket errors

| Error | Cause | Fix |
|---|---|---|
| Connection refused | Wrong URL format or missing API key | Use `wss://public-api.birdeye.so/socket/{chain}?x-api-key=KEY` |
| No events received | Missing required headers | Add `Origin` and `Sec-WebSocket-Protocol: echo-protocol` headers |
| Subscription not working | Wrong message format | Check channel-specific format in `wss-policy.md` |
| Connection drops | Ping timeout | Implement heartbeat — see `wss-policy.md` |
