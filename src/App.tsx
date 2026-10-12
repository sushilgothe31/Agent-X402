/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DashboardView } from "@/components/dashboard-view";
import { AgentPlayground } from "@/components/agent-playground";
import { MarketplaceView } from "@/components/marketplace-view";
import { WalletPage } from "@/components/wallet-page";
import { SpendingPoliciesView } from "@/components/spending-policies-view";
import { ProviderDashboard } from "@/components/provider-dashboard";
import { MCPExplorer } from "@/components/mcp-explorer";
import { ApiDocsView } from "@/components/api-docs-view";
import {
  Bot,
  Layers,
  Wallet,
  ShieldCheck,
  Server,
  Wrench,
  BookOpen,
  LayoutDashboard,
  Coins,
  RefreshCw,
  Zap,
  Check,
} from "lucide-react";
import {
  getSolanaState,
  requestSolanaAirdrop,
  SolanaSystemState,
} from "@/lib/solana-wallet";

type TabKey =
  | "dashboard"
  | "playground"
  | "marketplace"
  | "wallet"
  | "policies"
  | "provider"
  | "mcp"
  | "docs";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [state, setState] = useState<SolanaSystemState>(getSolanaState());
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getSolanaState());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickFaucet = async () => {
    setFaucetLoading(true);
    await requestSolanaAirdrop(state.agentWallet.address, 1.0);
    setState(getSolanaState());
    setFaucetSuccess(true);
    setFaucetLoading(false);
    setTimeout(() => setFaucetSuccess(false), 2500);
  };

  const navItems: { key: TabKey; label: string; icon: any; highlight?: boolean }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "playground", label: "Agent Playground", icon: Bot, highlight: true },
    { key: "marketplace", label: "API Marketplace", icon: Layers },
    { key: "wallet", label: "Solana Wallet", icon: Wallet },
    { key: "policies", label: "Spending Policies", icon: ShieldCheck },
    { key: "provider", label: "Provider Portal", icon: Server },
    { key: "mcp", label: "MCP Explorer", icon: Wrench },
    { key: "docs", label: "x402 Spec & Docs", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17] text-slate-100 selection:bg-[#14f195] selection:text-slate-950 font-sans">
      {/* Top Infrastructure Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0a0e17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9945ff] to-[#14f195] p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0a0e17] rounded-[10px] flex items-center justify-center font-black text-white text-xs font-mono tracking-tighter">
                X402
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#14f195] transition-colors">
                  Agent X402
                </span>
                <span className="bg-gradient-to-r from-[#9945ff] to-[#14f195] text-[10px] font-mono font-bold text-slate-950 px-1.5 py-0.2 rounded">
                  SOLANA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Machines can't pay each other. <strong className="text-slate-200">Until now.</strong>
              </p>
            </div>
          </div>

          {/* Quick Wallet Status & Faucet */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Network pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Devnet</span>
            </div>

            {/* Wallet balance chip */}
            <button
              onClick={() => setActiveTab("wallet")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono transition-colors cursor-pointer"
              title="Open Solana Wallet"
            >
              <Coins className="h-3.5 w-3.5 text-[#14f195]" />
              <span className="font-bold text-white">
                {state.agentWallet.solBalance.toFixed(3)} SOL
              </span>
            </button>

            {/* Devnet Faucet Button */}
            <button
              onClick={handleQuickFaucet}
              disabled={faucetLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Request 1.0 SOL Devnet Airdrop"
            >
              {faucetLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : faucetSuccess ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Zap className="h-3.5 w-3.5 fill-current" />
              )}
              <span className="hidden sm:inline">
                {faucetLoading ? "Airdropping..." : faucetSuccess ? "+1 SOL Added" : "Airdrop +1 SOL"}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 py-1 text-xs font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-slate-800 text-white font-bold shadow-xs border-b-2 border-[#14f195]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/70"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive
                        ? "text-[#14f195]"
                        : item.highlight
                        ? "text-[#00d2ff]"
                        : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === "dashboard" && <DashboardView onNavigate={(tab) => setActiveTab(tab as TabKey)} />}
        {activeTab === "playground" && <AgentPlayground onNavigateWallet={() => setActiveTab("wallet")} />}
        {activeTab === "marketplace" && <MarketplaceView />}
        {activeTab === "wallet" && <WalletPage />}
        {activeTab === "policies" && <SpendingPoliciesView />}
        {activeTab === "provider" && <ProviderDashboard />}
        {activeTab === "mcp" && <MCPExplorer />}
        {activeTab === "docs" && <ApiDocsView />}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-800 bg-[#0a0e17] py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-mono">Agent X402</span>
            <span>•</span>
            <span>Autonomous AI Micro-Payment Infrastructure</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Solana Devnet (Confirmed)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Protocol: x402-solana-v1</span>
            <span>RFC 9110 Status 402</span>
            <a
              href="https://explorer.solana.com/?cluster=devnet"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white underline"
            >
              Solana Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
