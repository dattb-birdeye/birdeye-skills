#!/usr/bin/env node
// End-to-end smoke test: load PRIVATE_KEY → sign → pay → fetch SOL price.
// Exit 0 on success, 1 on failure. Use to verify setup before real workloads.

import "dotenv/config";
import { createPaidFetch, x402Get } from "./x402-client.mjs";

const SOL = "So11111111111111111111111111111111111111112";

async function main() {
  console.log("[smoke] Loading wallet...");
  const { paidFetch, address } = await createPaidFetch({
    onPayment: ({ paymentId }) => console.log(`[smoke] Paying (id=${paymentId})...`),
  });
  console.log(`[smoke] Wallet: ${address}`);

  console.log("[smoke] GET /defi/price (SOL)...");
  const data = await x402Get(paidFetch, "/defi/price", { address: SOL });

  if (typeof data?.value !== "number") {
    throw new Error(`Unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`);
  }
  console.log(`[smoke] OK — SOL price = $${data.value}`);
  console.log("[smoke] PASS");
}

main().catch((err) => {
  console.error(`[smoke] FAIL: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
