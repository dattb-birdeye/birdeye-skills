#!/usr/bin/env node
// Interactive x402 CLI — fuzzy-search Birdeye endpoints, edit params,
// confirm payment, see response + replayable curl. Mirrors a wallet UI flow:
// the human stays in the loop for each paid request.
//
// Usage: node scripts/x402-cli.mjs

import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import search from "@inquirer/search";
import input from "@inquirer/input";
import confirm from "@inquirer/confirm";
import Fuse from "fuse.js";
import { createPaidFetch, BASE_URL } from "./x402-client.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENDPOINTS = JSON.parse(readFileSync(join(__dirname, "endpoints.json"), "utf-8"));
const SEPARATOR = "━".repeat(50);

function getParamDefaults() {
  const now = Math.floor(Date.now() / 1000);
  return {
    "x-chain": "solana",
    address: "So11111111111111111111111111111111111111112",
    base_address: "So11111111111111111111111111111111111111112",
    quote_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    token_address: "So11111111111111111111111111111111111111112",
    offset: "0",
    limit: "20",
    type: "1d",
    currency: "usd",
    time_from: String(now - 86400),
    time_to: String(now),
    tx_type: "swap",
    time_frame: "24h",
    ui_amount_mode: "both",
    interval: "1d",
    keyword: "sol",
    address_type: "token",
    volume_type: "buy",
    chain: "solana",
    body: "{}",
  };
}

const endpointEntries = ENDPOINTS.map((ep) => ({
  ...ep,
  label: `${ep.method.padEnd(5)} ${ep.path}`,
}));

const fuse = new Fuse(endpointEntries, {
  keys: ["label", "path"],
  threshold: 0.4,
  includeScore: true,
});

function buildUrlAndInit(endpoint, paramValues) {
  const headers = {};
  const queryParams = new URLSearchParams();
  let bodyContent = null;

  for (const param of endpoint.params) {
    const value = paramValues[param.name];
    if (value === undefined || value === "") continue;
    if (param.in === "header") headers[param.name] = value;
    else if (param.in === "query") queryParams.set(param.name, value);
    else if (param.in === "body") bodyContent = value;
  }

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${endpoint.path}${queryString ? "?" + queryString : ""}`;
  const init = { method: endpoint.method, headers };
  if (bodyContent && endpoint.method === "POST") {
    init.body = bodyContent;
    headers["Content-Type"] = "application/json";
  }
  return { url, init, body: bodyContent };
}

function buildCurlCommand(method, url, headers, body, paymentSig) {
  let curl = `curl -X ${method} '${url}'`;
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "payment-signature") continue;
    curl += ` \\\n  -H '${key}: ${value}'`;
  }
  if (paymentSig) curl += ` \\\n  -H 'PAYMENT-SIGNATURE: ${paymentSig}'`;
  if (body && method === "POST") curl += ` \\\n  -d '${body}'`;
  return curl;
}

async function editParams(endpoint) {
  const defaults = getParamDefaults();
  const paramValues = {};
  console.log(`\nParameters for ${endpoint.method} ${endpoint.path}:`);
  console.log("─".repeat(50));

  for (const param of endpoint.params) {
    const defaultVal = defaults[param.name] || "";
    const reqTag = param.required ? " (required)" : "";
    const locTag = param.in === "header" ? " [header]" : param.in === "body" ? " [body]" : "";
    const value = await input({
      message: `${param.name}${reqTag}${locTag}`,
      default: String(defaultVal),
    });
    if (value !== "") paramValues[param.name] = value;
  }
  return paramValues;
}

async function main() {
  console.log("\n  x402 API Explorer  ");
  console.log("  Birdeye x402-protected endpoints\n");

  const lastPayment = { signature: null, url: null, headers: null };
  let paidFetch;
  try {
    const wallet = await createPaidFetch({
      onPayment: (info) => {
        lastPayment.signature = info.signature;
        lastPayment.url = info.url;
        lastPayment.headers = info.headers;
        console.log(`  [x402] Payment ID: ${info.paymentId}`);
      },
    });
    paidFetch = wallet.paidFetch;
    console.log(`  Wallet: ${wallet.address}`);
  } catch (err) {
    console.log(`  Warning: ${err.message}`);
    console.log("  Requests will be made without payment signing.\n");
    paidFetch = fetch;
  }

  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Endpoints: ${ENDPOINTS.length}\n`);

  let running = true;
  while (running) {
    const selected = await search({
      message: "Search endpoint (type to filter):",
      source: (term) => {
        if (!term) return endpointEntries.map((ep) => ({ name: ep.label, value: ep }));
        return fuse.search(term).map((r) => ({ name: r.item.label, value: r.item }));
      },
    });

    const paramValues = await editParams(selected);

    const shouldSend = await confirm({
      message: `Send ${selected.method} ${selected.path}?`,
      default: true,
    });
    if (!shouldSend) continue;

    console.log(`\n${SEPARATOR}`);
    console.log(`REQUEST: ${selected.method} ${selected.path}`);

    try {
      const { url, init, body } = buildUrlAndInit(selected, paramValues);
      console.log(`URL: ${url}`);
      console.log(SEPARATOR);

      lastPayment.signature = null;
      lastPayment.url = null;
      lastPayment.headers = null;

      const response = await paidFetch(url, init);

      console.log(`RESPONSE (${response.status}):`);
      const responseText = await response.text();
      try {
        console.log(JSON.stringify(JSON.parse(responseText), null, 2));
      } catch {
        console.log(responseText);
      }

      if (response.status === 402) {
        console.log("\n[Still 402 after payment attempt — check wallet USDC balance / RPC]");
        console.log("Response headers:");
        for (const [k, v] of response.headers.entries()) {
          console.log(`  ${k}: ${k.toLowerCase().includes("payment") ? v : v.substring(0, 100)}`);
        }
      }

      console.log(SEPARATOR);
      console.log("CURL (copy to retry):");
      const curlHeaders = lastPayment.headers || init.headers;
      const curlUrl = lastPayment.url || url;
      console.log(buildCurlCommand(selected.method, curlUrl, curlHeaders, body, lastPayment.signature));
      console.log(SEPARATOR);
    } catch (err) {
      console.log(`Error: ${err.message}`);
      if (err.stack) console.log(err.stack);
      console.log(SEPARATOR);
    }

    running = await confirm({ message: "Run another request?", default: true });
  }

  console.log("\nGoodbye!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
