# Wallet Intelligence — Preflight Checklist

## 1. Identify Chain

Wallet addresses differ by chain:
- **Solana**: base58 string (32-44 chars), e.g., `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`
- **EVM** (Ethereum/BSC/Arbitrum/etc): 0x-prefixed hex (42 chars), e.g., `0x1234...abcd`
- **Sui**: 0x-prefixed hex (66 chars)

If the user gives an address without specifying chain, infer from format. If ambiguous, ask.

## 2. Determine Analysis Type

| User wants... | Best endpoint | CU | Rate Note |
|---|---|---|---|
| Current portfolio value | `/wallet-v2-current-net-worth` | 60 | 30 rpm limit |
| Net worth over time | `/wallet-v2-net-worth` | 60 | 30 rpm limit |
| Detailed holdings | `/wallet-v2-net-worth-details` | varies | 30 rpm limit |
| Overall PnL | `/wallet-v2-pnl-summary` | varies | 30 rpm limit |
| PnL per token | `/wallet-v2-pnl` | varies | 30 rpm limit |
| Trade-by-trade PnL | `/wallet-v2-pnl-details` | varies | 30 rpm limit |
| Compare wallets | `/wallet-v2-pnl-multiple` | varies | 30 rpm limit |
| Multiple portfolio values | `/wallet-v2-net-worth-summary-multiple` | varies | 30 rpm limit |
| Top traders for token | `/defi-v2-tokens-top_traders` | 30 | Standard limit |
| Who funded this wallet | `/wallet-v2-tx-first-funded` | varies | 30 rpm limit |
| Full tx history | `/v1-wallet-tx_list` | 150 | 30 rpm limit, Beta |

## 3. Single vs Batch

- **1 wallet**: Use per-wallet endpoints
- **2+ wallets**: Use batch endpoints (`*-multiple`, `*-summary-multiple`)
- **Never loop** per-wallet endpoints for batch analysis — you'll hit the 30 rpm limit in 30 seconds

## 4. Validate Request

- [ ] `X-API-KEY` header set
- [ ] `x-chain` header set (or `chain` query param)
- [ ] Wallet address is valid format for the specified chain
- [ ] Not exceeding 30 rpm for wallet endpoints
- [ ] Using batch endpoint if querying multiple wallets

## 5. Request Template

```typescript
const response = await fetch(
  `https://public-api.birdeye.so/wallet-v2-current-net-worth?wallet=${walletAddress}`,
  {
    headers: {
      'X-API-KEY': process.env.BIRDEYE_API_KEY,
      'x-chain': chain,
      'accept': 'application/json',
    },
  }
);

const data = await response.json();
if (!data.success) {
  if (response.status === 429) {
    // Rate limited — wait and retry
    await sleep(2000);
    // retry...
  }
  throw new Error(data.message || 'API error');
}
```
