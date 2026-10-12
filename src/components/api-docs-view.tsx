import React, { useState } from "react";
import { BookOpen, Code, ExternalLink, ShieldCheck, Zap, Terminal } from "lucide-react";
import { CopyToClipboardButton } from "./copy-to-clipboard";

export function ApiDocsView() {
  const [activeCodeTab, setActiveCodeTab] = useState<"ts" | "curl" | "py">("ts");

  const tsCode = `import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

// 1. Request protected endpoint
const initialRes = await fetch("https://agent-x402.dev/api/paid/market-intelligence");

if (initialRes.status === 402) {
  // 2. Parse x402 challenge headers
  const authChallenge = initialRes.headers.get("www-authenticate");
  const priceSOL = parseFloat(initialRes.headers.get("x-402-price") || "0.005");
  const recipient = initialRes.headers.get("x-402-recipient");

  // 3. Construct and sign Solana Devnet transaction
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const transferTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: agentKeypair.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports: Math.round(priceSOL * LAMPORTS_PER_SOL),
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transferTx, [agentKeypair]);

  // 4. Retry request with verified x402 proof
  const paidRes = await fetch("https://agent-x402.dev/api/paid/market-intelligence", {
    headers: {
      "Authorization": \`x402-solana signature="\${signature}"\`,
      "Content-Type": "application/json",
    },
  });

  const data = await paidRes.json();
  console.log("Protected API delivered:", data);
}`;

  const curlCode = `# Step 1: Query API to inspect 402 challenge
curl -i https://agent-x402.dev/api/paid/market-intelligence

# Response:
# HTTP/1.1 402 Payment Required
# WWW-Authenticate: x402 realm="agent-x402", network="solana-devnet", price="0.005", recipient="8rP9...dK2x"

# Step 2: Query API with settled Solana Devnet signature
curl -i -H 'Authorization: x402-solana signature="5wHu8v9bLp3q7Xz1vK4m2N6yR8tA5dF3eG1hJ7kM9pQ2wE4rT6yU8iO0aS2dF4gH6jK8lZ1xC3vB5nM7qW9eR2tY"' \\
  https://agent-x402.dev/api/paid/market-intelligence`;

  const pyCode = `import requests
from solana.rpc.api import Client
from solders.transaction import Transaction
from solders.system_program import TransferParams, transfer

# 1. Request endpoint
res = requests.get("https://agent-x402.dev/api/paid/market-intelligence")
if res.status_code == 402:
    price = float(res.headers.get("X-402-Price", "0.005").split()[0])
    recipient = res.headers.get("X-402-Recipient")
    
    # 2. Settle on Solana Devnet
    client = Client("https://api.devnet.solana.com")
    # ... sign and broadcast transaction ...
    sig = "5wHu8v9bLp..."
    
    # 3. Supply x402 header
    paid_res = requests.get(
        "https://agent-x402.dev/api/paid/market-intelligence",
        headers={"Authorization": f'x402-solana signature="{sig}"'}
    )
    print(paid_res.json())`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#14f195]" />
          <h2 className="text-2xl font-extrabold text-white">
            Solana x402 Protocol Specification & SDK Integration
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete implementation guide for building and consuming HTTP 402 paywalled endpoints on Solana.
        </p>
      </div>

      {/* Protocol Lifecycle Steps */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          The 10-Step Autonomous Settlement Lifecycle
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-[#14f195]">1. Request</span>
            <p className="text-slate-400">Client or agent calls protected endpoint without payment authorization.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-[#00d2ff]">2. 402 Challenge</span>
            <p className="text-slate-400">Server responds with HTTP 402 and <code>WWW-Authenticate: x402</code> header specifying price, recipient, and network.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400">3. Policy Evaluation</span>
            <p className="text-slate-400">Agent runtime validates spending constraints (per-tx cap, session budget, whitelist).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">4. Settlement</span>
            <p className="text-slate-400">Autonomous Solana transaction signed & broadcasted on Devnet with sub-second finality.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">5. Verification</span>
            <p className="text-slate-400">Server verifies tx signature on Solana Devnet RPC and ensures replay protection.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400">6. Delivery</span>
            <p className="text-slate-400">Protected API data delivered to agent with HTTP 200 OK and cryptographically verified receipt.</p>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-[#00d2ff]" />
            <h3 className="font-bold text-white text-sm">Client SDK Implementation Example</h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveCodeTab("ts")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === "ts" ? "bg-[#14f195] text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setActiveCodeTab("curl")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === "curl" ? "bg-[#14f195] text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveCodeTab("py")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === "py" ? "bg-[#14f195] text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Python
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <CopyToClipboardButton
              content={activeCodeTab === "ts" ? tsCode : activeCodeTab === "curl" ? curlCode : pyCode}
            />
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-96">
            <code>
              {activeCodeTab === "ts" && tsCode}
              {activeCodeTab === "curl" && curlCode}
              {activeCodeTab === "py" && pyCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
