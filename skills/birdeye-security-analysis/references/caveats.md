# Security Analysis — Caveats

## Limitations of Automated Security Checks

- **Not a guarantee**: A clean security report does NOT guarantee a token is safe. Scams can have technically clean contracts.
- **Context matters**: Some legitimate projects intentionally keep mint authority (e.g., for rewards, governance). Don't auto-reject tokens based on a single flag.
- **Evolving tactics**: Rug pull and scam tactics evolve. New attack vectors may not be detected by security checks.

## Data Freshness

- **Security data is snapshot-based**: The API returns the most recently indexed state. Authorities can be renounced or changed after the last index.
- **Lock status may lag**: If a lock was just created or modified, it may take a few minutes to appear in the API.

## Chain-Specific Differences

### Solana
- Mint authority, freeze authority, and metadata authority are separate concepts.
- Token-2022 program adds additional security dimensions (transfer fees, transfer hooks).
- Pre-market holder detection works well on Solana.

### EVM Chains
- Security model is different — focuses on contract code analysis.
- Proxy contracts can be upgraded, changing behavior after audit.
- Birdeye security data on EVM may be less comprehensive than Solana.

## Cross-Referencing

- **Always verify lock info**: Check the locking platform (Streamflow, UNCX) directly. The API may not reflect very recent changes.
- **Verify social links**: The `isVerified` flag means Birdeye has verified the token's social presence. It does NOT verify the project's legitimacy or financial safety.
- **Multi-source analysis**: For high-stakes decisions, combine Birdeye security data with other auditing tools (RugCheck, GoPlus, etc.).

## Common Mistakes

- Treating security data as binary (safe/unsafe) — it's a spectrum of risk factors.
- Ignoring context — a token with active mint authority might be a legitimate staking reward token.
- Relying solely on one security check — always cross-reference with holder analysis and liquidity data.
- Not checking lock expiry dates — a locked LP that expires tomorrow is effectively unlocked.
- Assuming "verified" means "safe" — verification confirms identity, not financial safety.
