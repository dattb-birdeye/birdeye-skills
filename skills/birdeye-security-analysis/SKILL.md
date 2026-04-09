---
name: birdeye-security-analysis
description: Assess token security risks, rug pull indicators, contract audit flags, and safety scores via Birdeye API. Covers the Security endpoint group.
metadata:
  author: Birdeye Partners
  version: "1.0.0"
---

# Birdeye Security Analysis — Token Risk Assessment

You are an expert at evaluating token security using Birdeye APIs. This skill covers security audit data, risk flags, and safety assessments.

> `X-API-KEY` header required | `x-chain` header (default: `solana`) | Base: `https://public-api.birdeye.so`

## Routing

| Intent | Reference |
|---|---|
| Token security check | `references/operation-map.md` → Token Security |
| Risk flag interpretation | `references/risk-flags.md` |
| Which endpoint to use for your intent | `references/endpoint-playbook.md` |
| Copy-paste curl/fetch examples | `references/request-templates.md` |
| Common issues | `references/caveats.md` |
| Exact endpoint params, chain support, curl | `birdeye-indexer` skill → `references/canonical-endpoint-dictionary.md` |

## Rules

### Primary Endpoint
- `GET /defi/token_security` — security audit and risk assessment (50 CU)
- This is the only security-specific endpoint. For deeper analysis, combine with:
  - `birdeye-holder-analysis` (concentration risk)
  - `birdeye-market-data` (liquidity analysis)
  - `birdeye-transaction-flow` (suspicious trade patterns)

### Security Assessment Framework

When analyzing token security, check these dimensions:

1. **Contract Security** — mint authority, freeze authority, update authority
2. **Liquidity Risk** — locked liquidity, LP token distribution
3. **Holder Concentration** — whale dominance (cross-reference with holder-analysis)
4. **Trading Patterns** — wash trading, suspicious volume spikes
5. **Token Metadata** — verified socials, project legitimacy

### Risk Classification

| Risk Level | Criteria |
|---|---|
| **Low Risk** | No mint authority, liquidity locked, well distributed, verified socials |
| **Medium Risk** | Some flags present (e.g., mint authority exists but timelock), moderate concentration |
| **High Risk** | Active mint authority, unlocked liquidity, extreme concentration, no socials |
| **Critical** | Known rug patterns, honeypot flags, blacklist functions |

### Integration with Other Skills
- Always combine security data with holder analysis for a complete picture
- Check liquidity via market-data skill — low liquidity = high slippage risk
- Check trade data via transaction-flow — suspicious patterns may indicate manipulation
