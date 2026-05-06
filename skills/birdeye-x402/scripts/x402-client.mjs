// Headless x402 client for Birdeye public API.
// Wraps fetch with x402 payment handling on Solana (USDC).
//
// Usage:
//   import { createPaidFetch, x402Get } from './x402-client.mjs';
//   const { paidFetch, address } = await createPaidFetch();
//   const data = await x402Get(paidFetch, '/defi/price', { address: 'So111...' });

import { createKeyPairSignerFromBytes } from "@solana/kit";
import { ExactSvmScheme, toClientSvmSigner } from "@x402/svm";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { base58 } from "@scure/base";
import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Auto-load `.env` from the skill root, regardless of caller's cwd.
// This means agents can `import` this module from anywhere without first
// sourcing the env file.
const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: join(__dirname, "..", ".env"), quiet: true });

export const BASE_URL = "https://public-api.birdeye.so";

function generatePaymentId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "pay_";
  for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Birdeye requires a payment-identifier extension inside the PAYMENT-SIGNATURE
// header (base64-encoded JSON). Standard x402 clients don't inject this, so we
// patch each outgoing signed request before it leaves.
export function withPaymentIdentifier(baseFetch, onPayment) {
  return async (input, init) => {
    const req = new Request(input, init);
    const sig = req.headers.get("PAYMENT-SIGNATURE");
    if (sig) {
      try {
        const decoded = JSON.parse(Buffer.from(sig, "base64").toString("utf-8"));
        const paymentId = generatePaymentId();
        decoded.extensions = {
          ...(decoded.extensions || {}),
          "payment-identifier": { info: { id: paymentId } },
        };
        const patched = Buffer.from(JSON.stringify(decoded)).toString("base64");
        req.headers.set("PAYMENT-SIGNATURE", patched);
        if (onPayment) {
          const hdrs = {};
          for (const [k, v] of req.headers.entries()) hdrs[k] = v;
          onPayment({ paymentId, signature: patched, url: req.url, headers: hdrs });
        }
      } catch {
        // leave header as-is
      }
    }
    return baseFetch(req);
  };
}

export async function createPaidFetch({ onPayment } = {}) {
  const privateKeyStr = process.env.PRIVATE_KEY;
  if (!privateKeyStr) {
    throw new Error("PRIVATE_KEY not set. Add a base58 Solana private key (Phantom export format) to your env.");
  }

  let keyBytes;
  try {
    keyBytes = base58.decode(privateKeyStr.trim());
  } catch (err) {
    throw new Error(`PRIVATE_KEY is not valid base58: ${err.message}`);
  }

  const keypair = await createKeyPairSignerFromBytes(keyBytes);
  const signer = toClientSvmSigner(keypair);
  const client = new x402Client().register("solana:*", new ExactSvmScheme(signer));
  const innerFetch = withPaymentIdentifier(globalThis.fetch, onPayment);
  const paidFetch = wrapFetchWithPayment(innerFetch, client);

  return { paidFetch, address: keypair.address };
}

// Convenience: GET an x402 path and return parsed JSON `data` field.
// `path` is the endpoint path including the `/x402` prefix (e.g. `/x402/defi/price`)
// or without it (we'll add it). Either works.
export async function x402Get(paidFetch, path, params = {}, { chain = "solana", baseUrl = BASE_URL } = {}) {
  const fullPath = path.startsWith("/x402") ? path : `/x402${path.startsWith("/") ? path : "/" + path}`;
  const url = new URL(`${baseUrl}${fullPath}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await paidFetch(url.toString(), {
    headers: { "x-chain": chain, accept: "application/json" },
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`); }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${json.message || text.slice(0, 200)}`);
  if (json.success === false) throw new Error(json.message || "request failed");
  return json.data ?? json;
}

export async function x402Post(paidFetch, path, body, { chain = "solana", baseUrl = BASE_URL, query = {} } = {}) {
  const fullPath = path.startsWith("/x402") ? path : `/x402${path.startsWith("/") ? path : "/" + path}`;
  const url = new URL(`${baseUrl}${fullPath}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await paidFetch(url.toString(), {
    method: "POST",
    headers: { "x-chain": chain, accept: "application/json", "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`); }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${json.message || text.slice(0, 200)}`);
  if (json.success === false) throw new Error(json.message || "request failed");
  return json.data ?? json;
}
