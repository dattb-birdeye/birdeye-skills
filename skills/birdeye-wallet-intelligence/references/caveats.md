# Wallet Intelligence — Caveats

## Rate Limiting

- **30 rpm hard limit**: ALL wallet endpoints share a 30 requests per minute limit, regardless of subscription tier. This is the most restrictive rate limit in the Birdeye API.
- **Plan carefully**: If you need to analyze multiple wallets, use batch endpoints (`net-worth-summary-multiple`, `pnl-multiple`) instead of calling per-wallet endpoints in a loop.
- **Cache aggressively**: Portfolio data doesn't change every second. Cache for 30-60 seconds minimum.

## PnL Accuracy

- **PnL is approximate**: Birdeye calculates PnL based on indexed trade data. Trades on unsupported DEXs or direct transfers may not be captured.
- **Unrealized PnL uses current price**: The unrealized PnL changes with every price tick. Don't treat it as a fixed number.
- **Win rate**: Calculated from realized trades only. A wallet with many open positions may show misleading win rates.
- **Token-specific PnL**: The per-token PnL endpoint is more accurate than the summary endpoint for individual token analysis.

## Net Worth Data

- **NFT valuations**: NFT values in net worth may use floor prices, which can be volatile and may not reflect actual sale value.
- **Unsupported tokens**: Very new or low-liquidity tokens may not have price data, making them show as $0 in net worth.
- **Historical net worth**: Chart data may have gaps for periods before Birdeye started indexing the wallet.

## Top Traders

- **Tags are Birdeye-assigned**: Tags like "smart_money", "whale", "bot" are based on Birdeye's internal classification algorithms.
- **Time frame matters**: A top trader over 24h may be a one-time lucky trade. Use 7d or 30d for more reliable signals.

## First Funded

- **Useful for wallet provenance**: Helps trace where a wallet's initial capital came from.
- **May not exist**: Very old wallets or wallets funded before Birdeye's indexing range may not have first funded data.

## Beta Endpoints

- **v1/wallet/tx_list** (150 CU) and **v1/wallet/token_list** (100 CU) are beta endpoints. They may:
  - Have higher latency
  - Return incomplete data for some chains
  - Change without notice
- Use V2 endpoints when available for stable behavior.

## Cross-Chain Wallets

- Each query is chain-specific. To get a full multi-chain portfolio, you need to call the endpoint once per chain.
- Use `GET /v1/wallet/list_supported_chain` to know which chains support wallet queries.

## Common Mistakes

- Polling wallet endpoints every second — hitting the 30 rpm limit immediately.
- Using per-wallet endpoints for batch analysis — use the `*-multiple` batch endpoints instead.
- Trusting NFT valuations as precise — they're estimates based on floor prices.
- Comparing PnL across different time frames — a wallet with +50% in 24h isn't necessarily better than one with +200% in 30d.
