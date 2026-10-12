import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Coins,
  ArrowUpRight,
  ExternalLink,
  Bot,
  Activity,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSolanaState,
  getSolanaExplorerUrl,
  requestSolanaAirdrop,
  SolanaSystemState,
} from "@/lib/solana-wallet";
import { getSpendingPolicy, SpendingPolicy } from "@/lib/spending-policy";
import { PAID_SERVICES } from "@/lib/marketplace";

export function DashboardView({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const [state, setState] = useState<SolanaSystemState>(getSolanaState());
  const [policy, setPolicy] = useState<SpendingPolicy>(getSpendingPolicy());
  const [faucetLoading, setFaucetLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getSolanaState());
      setPolicy(getSpendingPolicy());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAirdrop = async () => {
    setFaucetLoading(true);
    await requestSolanaAirdrop(state.agentWallet.address, 1.0);
    setState(getSolanaState());
    setFaucetLoading(false);
  };

  const totalSpentSOL = state.transactions
    .filter((tx) => tx.status === "verified" || tx.status === "settled")
    .reduce((acc, tx) => acc + (tx.amountSOL > 0 && tx.from === state.agentWallet.address ? tx.amountSOL : 0), 0);

  const budgetPercent = Math.min(
    100,
    Math.round((policy.currentSessionSpentSOL / policy.maxSessionBudgetSOL) * 100)
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#151226] p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#14f195]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#9945ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOLANA DEVNET x402 SETTLEMENT LIVE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Machines can't pay each other. <br />
            <span className="bg-gradient-to-r from-[#14f195] via-[#00d2ff] to-[#9945ff] bg-clip-text text-transparent">
              Until now.
            </span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
            <strong>Agent X402</strong> is the autonomous micro-settlement protocol for the AI economy.
            Software agents discover digital APIs, negotiate prices in machine-readable schemas,
            and stream sub-second micropayments over Solana.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => onNavigate("playground")}
              className="bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold px-6 h-11 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer gap-2"
            >
              <Bot className="h-4 w-4" />
              Launch Agent Playground
            </Button>
            <Button
              onClick={() => onNavigate("marketplace")}
              variant="outline"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 h-11 px-5 rounded-xl cursor-pointer gap-2"
            >
              <Layers className="h-4 w-4 text-[#00d2ff]" />
              Explore 6 Paid APIs
            </Button>
            <Button
              onClick={() => onNavigate("docs")}
              variant="ghost"
              className="text-slate-400 hover:text-white text-xs h-11 px-4 cursor-pointer"
            >
              Read x402 Protocol Spec →
            </Button>
          </div>
        </div>
      </div>

      {/* Real-Time Platform Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AGENT WALLET</span>
            <Coins className="h-4 w-4 text-[#14f195]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {state.agentWallet.solBalance.toFixed(3)}{" "}
            <span className="text-xs font-normal text-emerald-400">SOL</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 font-mono truncate max-w-[140px]">
              {state.agentWallet.address.slice(0, 4)}...{state.agentWallet.address.slice(-4)}
            </span>
            <button
              onClick={handleAirdrop}
              disabled={faucetLoading}
              className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-medium"
            >
              {faucetLoading ? "Requesting..." : "+1.0 SOL Faucet"}
            </button>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SESSION BUDGET</span>
            <ShieldCheck className="h-4 w-4 text-[#00d2ff]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {policy.currentSessionSpentSOL.toFixed(3)}{" "}
            <span className="text-xs font-normal text-slate-400">/ {policy.maxSessionBudgetSOL} SOL</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#14f195] to-[#00d2ff] h-full transition-all"
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SETTLEMENT LATENCY</span>
            <Activity className="h-4 w-4 text-[#9945ff]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ~395 <span className="text-xs font-normal text-slate-400">ms avg</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <span className="text-emerald-400">Sub-second</span> finality on Solana
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>VERIFIED x402 TXs</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {state.transactions.length}{" "}
            <span className="text-xs font-normal text-slate-400">calls</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Replay protection enabled
          </div>
        </div>
      </div>

      {/* Main Grid: Live Agent Feed & Marketplace Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Verified Transactions */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#14f195]" />
              <h3 className="font-bold text-white text-sm">
                Live Solana x402 Transaction Stream
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("wallet")}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Full Ledger →
            </Button>
          </div>

          <div className="space-y-3">
            {state.transactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="group rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-slate-700 hover:bg-slate-900/80 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs truncate">
                        {tx.purpose}
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                        {tx.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                      {tx.confirmationTimeMs && (
                        <span>• {tx.confirmationTimeMs}ms latency</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-[#14f195]">
                      {tx.amountSOL > 0 ? `-${tx.amountSOL} SOL` : "0 SOL"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-600">Sig:</span>
                    <a
                      href={getSolanaExplorerUrl(tx.signature)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00d2ff] hover:underline flex items-center gap-1 truncate"
                    >
                      <span>{tx.signature.slice(0, 12)}...{tx.signature.slice(-8)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <span className="text-slate-500">Slot #{tx.slot || 312500000}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Discoverable Paid Services Quick Access */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#00d2ff]" />
                <h3 className="font-bold text-white text-sm">
                  Active Paid APIs
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {PAID_SERVICES.length} Available
              </span>
            </div>

            <div className="space-y-3">
              {PAID_SERVICES.slice(0, 3).map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">
                      {service.name}
                    </span>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                      {service.priceSOL} SOL
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                    <span>{service.endpoint}</span>
                    <span className="text-slate-400">{service.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => onNavigate("marketplace")}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs h-9 font-medium cursor-pointer justify-between"
          >
            <span>Browse Full API Marketplace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
