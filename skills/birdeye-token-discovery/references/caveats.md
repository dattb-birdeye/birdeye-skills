# Token Discovery — Caveats

## Search

- **Search is multi-chain**: Set `chain: "all"` to search across all supported chains. Without it, only the chain specified in `x-chain` header is searched.
- **Max 20 results per search**: The search endpoint caps at 20 results. For broader browsing, use the token list endpoints.
- **Search matches name, symbol, and address**: No need to know which field to search — the API does fuzzy matching.

## Token Lists

- **V3 token list costs 100 CU**: For frequent polling, consider caching results client-side.
- **V3 scroll costs 500 CU per call**: Only use when you genuinely need to iterate through thousands of tokens. For top-N queries, use offset/limit pagination.
- **Max limit is 50**: Don't request more than 50 per page. The API silently caps it.
- **Filters are AND-combined**: If you set `min_liquidity=1000` AND `min_volume_24h=5000`, only tokens matching BOTH criteria are returned.

## New Listings

- **80 CU per call**: Expensive for polling. Consider using the WebSocket `SUBSCRIBE_TOKEN_NEW_LISTING` channel for real-time new listings instead.
- **Meme platform tokens**: Set `meme_platform_enabled=true` to include pump.fun and similar platform tokens. Default may exclude them.

## Trending

- **Trending is time-sensitive**: Results change frequently. Cache for no more than 5 minutes.
- **Different from "top by volume"**: Trending considers velocity of change, not absolute volume.

## Meme Tokens

- **Meme list is Solana-focused**: Most meme token data is richest on Solana. EVM chain meme data may be limited.
- **Meme detail includes pump.fun status**: For Solana meme tokens, the detail endpoint may include bonding curve progress, graduation status, and migration info.

## Creation Info

- **Deployer vs Owner**: `deployer` is the wallet that deployed the token contract. `owner` is the current authority (may differ after ownership transfer).
- **Not available for all tokens**: Very old tokens or tokens on some chains may not have creation info indexed.

## General

- **Address resolution**: Always resolve token symbols to addresses via search before calling other endpoints. Don't assume address formats.
- **Chain-specific tokens**: The same symbol can exist on multiple chains (e.g., "USDC" on Solana, Ethereum, BSC). Always verify the chain.
