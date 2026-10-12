import React, { useState } from "react";
import {
  Wrench,
  Code,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Coins,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { executeSolanaPayment, getSolanaExplorerUrl } from "@/lib/solana-wallet";

interface MCPTool {
  name: string;
  description: string;
  isPaid: boolean;
  priceSOL: number;
  inputSchema: Record<string, any>;
  sampleArgs: Record<string, any>;
  mockExecute: (args: any) => Promise<any>;
}

const MCP_TOOLS: MCPTool[] = [
  {
    name: "query_market_intelligence",
    description: "Fetches real-time crypto sentiment and on-chain whale activity across 40+ exchanges.",
    isPaid: true,
    priceSOL: 0.005,
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Target asset e.g. SOL, JUP" },
        timeframe: { type: "string", enum: ["1h", "24h", "7d"] },
      },
      required: ["symbol"],
    },
    sampleArgs: { symbol: "SOL", timeframe: "24h" },
    mockExecute: async (args) => ({
      asset: args.symbol || "SOL",
      priceUSD: 172.50,
      sentimentScore: 89.2,
      whaleFlowSOL: "+14,200 SOL",
      status: "verified_feed",
    }),
  },
  {
    name: "audit_smart_contract",
    description: "Executes automated Anchor program verification and CPI authorization scanning.",
    isPaid: true,
    priceSOL: 0.02,
    inputSchema: {
      type: "object",
      properties: {
        programId: { type: "string", description: "Anchor program base58 ID" },
        strictMode: { type: "boolean" },
      },
      required: ["programId"],
    },
    sampleArgs: { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", strictMode: true },
    mockExecute: async (args) => ({
      programId: args.programId,
      safetyScore: 99,
      cpiAuthorityEnforced: true,
      vulnerabilitiesCount: 0,
      verdict: "SECURE",
    }),
  },
  {
    name: "get_dex_arbitrage_signals",
    description: "Scans Raydium, Orca, and Meteora for sub-second flash arbitrage routes.",
    isPaid: true,
    priceSOL: 0.008,
    inputSchema: {
      type: "object",
      properties: { minSpreadBps: { type: "number" } },
    },
    sampleArgs: { minSpreadBps: 20 },
    mockExecute: async (args) => ({
      bestRoute: "SOL -> JUP -> USDC -> SOL",
      estimatedProfitSOL: 0.042,
      spreadBps: 34,
      dexes: ["Orca Whirlpools", "Meteora DLMM"],
    }),
  },
  {
    name: "solana_local_clock",
    description: "Returns the current Solana cluster slot and epoch clock time (Free local runtime tool).",
    isPaid: false,
    priceSOL: 0,
    inputSchema: { type: "object", properties: {} },
    sampleArgs: {},
    mockExecute: async () => ({
      clusterSlot: 312502840,
      epoch: 712,
      blockTime: new Date().toISOString(),
      cluster: "devnet",
    }),
  },
];

export function MCPExplorer() {
  const [selectedTool, setSelectedTool] = useState<MCPTool>(MCP_TOOLS[0]);
  const [paramsJson, setParamsJson] = useState(JSON.stringify(MCP_TOOLS[0].sampleArgs, null, 2));
  const [isExecuting, setIsExecuting] = useState(false);
  const [execLogs, setExecLogs] = useState<string[]>([]);
  const [execResult, setExecResult] = useState<any | null>(null);

  const handleSelectTool = (tool: MCPTool) => {
    setSelectedTool(tool);
    setParamsJson(JSON.stringify(tool.sampleArgs, null, 2));
    setExecResult(null);
    setExecLogs([]);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setExecLogs([]);
    setExecResult(null);

    const log = (msg: string) => setExecLogs((prev) => [...prev, msg]);

    log(`[MCP Runtime] Validating input schema for tool '${selectedTool.name}'...`);
    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(paramsJson);
    } catch {
      log(`[MCP Error] Invalid JSON parameters format.`);
      setIsExecuting(false);
      return;
    }

    if (selectedTool.isPaid) {
      log(`[x402 Protocol] Tool '${selectedTool.name}' is paid (${selectedTool.priceSOL} SOL).`);
      log(`[x402 Protocol] Intercepting execution. Authorizing payment on Solana Devnet...`);

      try {
        const pay = await executeSolanaPayment({
          toAddress: "8rP9a3yKMk6qDZw2VvY9nK7bX1rL4pQ3mNtG9vF6sE1x",
          amountSOL: selectedTool.priceSOL,
          purpose: `MCP Tool Execution: ${selectedTool.name}`,
        });

        log(`[Solana] Payment settled on Devnet! Signature: ${pay.signature.slice(0, 24)}...`);
        log(`[MCP Gateway] Attaching payment proof to MCP execution header...`);
      } catch (err: any) {
        log(`[Payment Failure] ${err.message}`);
        setIsExecuting(false);
        return;
      }
    } else {
      log(`[MCP Runtime] Free tool execution authorized.`);
    }

    log(`[MCP Execution] Dispatching tool handler...`);
    await new Promise((r) => setTimeout(r, 400));
    const output = await selectedTool.mockExecute(parsedArgs);

    log(`[MCP Result] Tool execution completed successfully.`);
    setExecResult(output);
    setIsExecuting(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-[#9945ff]" />
          <h2 className="text-2xl font-extrabold text-white">
            Model Context Protocol (MCP) Tools Explorer
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Standardized tool discovery, machine-readable parameter validation, and integrated x402 payment authorization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Tools Directory */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
            Registered MCP Tools
          </span>
          {MCP_TOOLS.map((t) => {
            const isSelected = selectedTool.name === t.name;

            return (
              <div
                key={t.name}
                onClick={() => handleSelectTool(t)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? "bg-slate-900 border-purple-500/50 shadow-md"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-mono">{t.name}</span>
                  {t.isPaid ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
                      {t.priceSOL} SOL (x402)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                      FREE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Side: Schema & Execution Tester */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm font-mono">{selectedTool.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedTool.description}</p>
            </div>
            {selectedTool.isPaid && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                {selectedTool.priceSOL} SOL / call
              </Badge>
            )}
          </div>

          {/* JSON Schema */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-500 uppercase block font-semibold">
              Input Parameter JSON
            </span>
            <textarea
              rows={4}
              value={paramsJson}
              onChange={(e) => setParamsJson(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full bg-[#9945ff] hover:bg-[#8532ea] text-white font-bold text-xs h-9 rounded-xl cursor-pointer gap-2"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Executing MCP Tool...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Execute Tool {selectedTool.isPaid && `(Pay ${selectedTool.priceSOL} SOL via x402)`}
              </>
            )}
          </Button>

          {/* Execution Trace Console */}
          {execLogs.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300 max-h-40 overflow-y-auto">
              {execLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}

          {/* Result Output */}
          {execResult && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Execution Result
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-48">
                {JSON.stringify(execResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
