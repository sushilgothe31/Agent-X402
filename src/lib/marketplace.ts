export interface PaidService {
  id: string;
  name: string;
  description: string;
  provider: string;
  providerAddress: string;
  endpoint: string;
  priceSOL: number;
  token: "SOL" | "USDC";
  network: "solana-devnet" | "solana-mainnet";
  category: "Intelligence" | "Security" | "DeFi" | "Compute" | "Storage" | "Scraping";
  latencyMs: number;
  uptimePercent: number;
  mcpToolName: string;
  mcpSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  requestExample: Record<string, any>;
  responseExample: Record<string, any>;
}

export const PAID_SERVICES: PaidService[] = [
  {
    id: "svc-market-intel",
    name: "Global Crypto Market Intelligence & Deep Search",
    description: "Real-time AI-synthesized sentiment, on-chain whale flow analysis, and aggregated liquidity dynamics across 40+ exchanges.",
    provider: "Solana Alpha Intelligence Labs",
    providerAddress: "8rP9a3yKMk6qDZw2VvY9nK7bX1rL4pQ3mNtG9vF6sE1x",
    endpoint: "/api/paid/market-intelligence",
    priceSOL: 0.005,
    token: "SOL",
    network: "solana-devnet",
    category: "Intelligence",
    latencyMs: 140,
    uptimePercent: 99.98,
    mcpToolName: "query_market_intelligence",
    mcpSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Target asset (e.g. SOL, JUP, PYTH)" },
        timeframe: { type: "string", enum: ["1h", "24h", "7d"] },
        includeWhaleFlows: { type: "boolean" },
      },
      required: ["symbol"],
    },
    requestExample: { symbol: "SOL", timeframe: "24h", includeWhaleFlows: true },
    responseExample: {
      asset: "SOL",
      priceUSD: 168.42,
      sentimentScore: 84.6,
      whaleNetInflowSOL: 12450.8,
      keyDrivers: ["Institutional ETF applications", "Active addresses +18% WoW"],
      confidence: 0.94,
    },
  },
  {
    id: "svc-contract-audit",
    name: "Autonomous Smart Contract Security Audit",
    description: "Automated formal verification, reentrancy scanning, and CPI authority validation for Solana Anchor programs.",
    provider: "AnchorShield Autonomous SecOps",
    providerAddress: "5mNp7qR2tY5wHu8v9bLp1vK4m2N6yR8tA5dF3eG1hJ7k",
    endpoint: "/api/paid/contract-audit",
    priceSOL: 0.02,
    token: "SOL",
    network: "solana-devnet",
    category: "Security",
    latencyMs: 380,
    uptimePercent: 99.95,
    mcpToolName: "audit_smart_contract",
    mcpSchema: {
      type: "object",
      properties: {
        programId: { type: "string", description: "Solana program public key" },
        compiler: { type: "string", default: "anchor-0.30" },
        strictMode: { type: "boolean" },
      },
      required: ["programId"],
    },
    requestExample: { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", strictMode: true },
    responseExample: {
      safetyScore: 98,
      vulnerabilitiesFound: 0,
      checkedRules: 42,
      cpiAuthorityEnforced: true,
      auditCertificate: "ANCHOR-CERT-9945F-SECURED",
    },
  },
  {
    id: "svc-dex-signals",
    name: "Solana DEX Arbitrage & Memepool Signals",
    description: "Sub-second cross-pool arbitrage opportunities between Raydium, Orca Whirlpools, and Meteora DLMM.",
    provider: "QuantumSol MEV Engine",
    providerAddress: "3C44CdDdB6a900fa2b585dd299e03d12FA4293BC7n",
    endpoint: "/api/paid/dex-signals",
    priceSOL: 0.008,
    token: "SOL",
    network: "solana-devnet",
    category: "DeFi",
    latencyMs: 95,
    uptimePercent: 99.99,
    mcpToolName: "get_dex_arbitrage_signals",
    mcpSchema: {
      type: "object",
      properties: {
        minSpreadBps: { type: "number", description: "Minimum profit spread in basis points" },
        poolTypes: { type: "array", items: { type: "string" } },
      },
    },
    requestExample: { minSpreadBps: 25 },
    responseExample: {
      bestRoute: "SOL -> USDC -> JUP -> SOL",
      estimatedProfitSOL: 0.084,
      dexes: ["Orca Whirlpool", "Raydium CPMM"],
      executionWindowMs: 450,
    },
  },
  {
    id: "svc-compute-cluster",
    name: "GPU Tensor Inference & Vector Embeddings",
    description: "Decentralized high-throughput H100 inference cluster for transformer embeddings and fine-tuned LLM execution.",
    provider: "DePIN Compute Grid",
    providerAddress: "7xL1mK9vN2pQ4rT6yU8iO0aS2dF4gH6jK8lZ1xC3vB5n",
    endpoint: "/api/paid/compute-cluster",
    priceSOL: 0.015,
    token: "SOL",
    network: "solana-devnet",
    category: "Compute",
    latencyMs: 220,
    uptimePercent: 99.92,
    mcpToolName: "run_tensor_compute",
    mcpSchema: {
      type: "object",
      properties: {
        modelArchitecture: { type: "string" },
        batchSize: { type: "number" },
      },
    },
    requestExample: { modelArchitecture: "embedding-bge-m3", batchSize: 64 },
    responseExample: {
      clusterId: "depin-sol-node-09",
      vectorDimensions: 1024,
      computeDurationMs: 82,
      flopsConsumed: "1.4T",
    },
  },
];

// Helper to simulate endpoint execution after verified x402 payment
export function executeServiceQuery(serviceId: string, params: Record<string, any> = {}): any {
  const service = PAID_SERVICES.find((s) => s.id === serviceId);
  if (!service) throw new Error(`Unknown service: ${serviceId}`);

  switch (serviceId) {
    case "svc-market-intel": {
      const symbol = (params.symbol || "SOL").toUpperCase();
      return {
        service: service.name,
        timestamp: new Date().toISOString(),
        asset: symbol,
        priceUSD: symbol === "SOL" ? 172.50 : symbol === "JUP" ? 1.08 : 42.10,
        change24h: "+7.4%",
        sentiment: "Highly Bullish (Score: 88/100)",
        socialVolumeIndex: "94.2 (+22% vs 7d avg)",
        onChainMetrics: {
          activeWallets24h: 1845020,
          tpsInstant: 2940,
          whaleAccumulationSOL: 45200.5,
          topDEXPair: `${symbol}/USDC on Raydium`,
        },
        aiSummary: `Strong upward momentum detected for ${symbol} driven by decentralized ecosystem volume and rising x402 machine payment adoption on Solana Devnet.`,
      };
    }
    case "svc-contract-audit": {
      const pid = params.programId || "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      return {
        service: service.name,
        timestamp: new Date().toISOString(),
        targetProgram: pid,
        overallStatus: "PASSED_STRICT",
        safetyScore: 99,
        checks: [
          { check: "Signer Authorization", status: "SECURE", severity: "NONE" },
          { check: "Account Reentrancy", status: "PROTECTED", severity: "NONE" },
          { check: "Arithmetic Overflow Check", status: "SECURE", severity: "NONE" },
          { check: "Owner Constraint Validation", status: "SECURE", severity: "NONE" },
        ],
        auditDigest: "e8f9a2b4c1945f14f195solana002",
        verdict: "Anchor program architecture conforms to production-grade Solana security standards.",
      };
    }
    case "svc-dex-signals": {
      return {
        service: service.name,
        timestamp: new Date().toISOString(),
        arbitrageDetected: true,
        pairs: [
          {
            route: "SOL -> JUP -> USDC -> SOL",
            spreadBps: 34,
            netProfitEstimateSOL: 0.042,
            venues: ["Orca Whirlpools", "Meteora Dynamic DLMM"],
            riskLevel: "LOW",
          },
        ],
        poolHealth: "Optimal liquidity depth ($14.2M across tested pools)",
      };
    }
    default:
      return {
        service: service.name,
        timestamp: new Date().toISOString(),
        result: service.responseExample,
      };
  }
}
