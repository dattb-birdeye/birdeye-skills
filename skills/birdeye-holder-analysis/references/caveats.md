# Holder Analysis — Caveats

## Data Accuracy

- **Holder count may include empty accounts**: On Solana, token accounts can exist with zero balance. Birdeye may or may not filter these.
- **Contract/program addresses**: Top holders may include DEX pools, vaults, or program-owned accounts, not individual wallets. Don't treat all top holders as "whales."
- **Burned tokens**: Tokens sent to burn addresses (e.g., `1111111111111111111111111111111111`) still show as "held." This inflates the total supply in percentage calculations.

## Concentration Analysis

- **Top 10 = centralized?**: Not always. If the top holders are DEX liquidity pools, the concentration isn't as risky as if they were individual wallets.
- **Token lock/vesting**: Some large holders may have tokens locked in vesting contracts. These appear as concentrated but are not immediately tradeable.
- **Multi-sig wallets**: A single large holder may be a multi-sig (e.g., team treasury), which is less risky than a single person holding the same amount.

## Distribution

- **Range boundaries are fixed**: The distribution ranges (0-100, 100-1000, etc.) are predefined by Birdeye. You cannot customize them.
- **USD vs token amounts**: Ranges are in token amounts, not USD. A "0-100" range for a token priced at $1000 per token is very different from one priced at $0.001.

## Batch Queries

- **POST endpoint**: Batch holder data uses POST, not GET.
- **Rate limits**: Batch queries still count toward your rate limit per token in the batch.

## Cross-Chain

- **Different holder patterns**: EVM chains have different token account models than Solana. Direct comparison of holder counts across chains may be misleading.
- **Bridged tokens**: A token bridged to multiple chains will have separate holder sets per chain. The total holder count is the sum across all chains.

## Common Mistakes

- Treating DEX pool addresses as individual whale wallets.
- Comparing holder counts between tokens with vastly different market caps.
- Not accounting for burn addresses in concentration calculations.
- Assuming holder count growth always means organic adoption (could be airdrop farming).
