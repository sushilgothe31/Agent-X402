import React, { useState } from "react";
import {
  Layers,
  Coins,
  Plus,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  ExternalLink,
  Shield,
  Server,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PAID_SERVICES, PaidService } from "@/lib/marketplace";
import { getSolanaState, getSolanaExplorerUrl } from "@/lib/solana-wallet";

export function ProviderDashboard() {
  const [state] = useState(getSolanaState());
  const [services, setServices] = useState<PaidService[]>(PAID_SERVICES);
  const [showAddModal, setShowAddModal] = useState(false);

  // New endpoint state
  const [newName, setNewName] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("/api/paid/custom-data");
  const [newPrice, setNewPrice] = useState("0.01");
  const [newDesc, setNewDesc] = useState("");

  const totalRevenueSOL = state.providerWallet.solBalance;

  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEndpoint.trim()) return;

    const newSvc: PaidService = {
      id: "svc-custom-" + Date.now(),
      name: newName,
      description: newDesc || "Custom x402 protected API endpoint on Solana.",
      provider: "You (Verified Provider)",
      providerAddress: state.providerWallet.address,
      endpoint: newEndpoint,
      priceSOL: parseFloat(newPrice) || 0.01,
      token: "SOL",
      network: "solana-devnet",
      category: "Compute",
      latencyMs: 110,
      uptimePercent: 100.0,
      mcpToolName: "custom_paid_query",
      mcpSchema: { type: "object", properties: { query: { type: "string" } } },
      requestExample: { query: "example input" },
      responseExample: { result: "Protected data payload delivered" },
    };

    setServices([newSvc, ...services]);
    setShowAddModal(false);
    setNewName("");
    setNewDesc("");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-[#14f195]" />
            <h2 className="text-2xl font-extrabold text-white">API Provider & Monetization Portal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monetize your backend routes and MCP tools with programmatic x402 Solana micropayments.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Register x402 Endpoint
        </Button>
      </div>

      {/* Provider Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
          <div className="text-slate-400 text-xs font-mono">SETTLED PROVIDER REVENUE</div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {totalRevenueSOL.toFixed(3)}{" "}
            <span className="text-sm font-normal text-emerald-400">SOL</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            ~${(totalRevenueSOL * 165).toFixed(2)} USD earned from automated callers
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
          <div className="text-slate-400 text-xs font-mono">ACTIVE PROTECTED ROUTES</div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {services.length}{" "}
            <span className="text-sm font-normal text-[#00d2ff]">Endpoints</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            100% verified on Solana Devnet
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
          <div className="text-slate-400 text-xs font-mono">REPLAY ATTEMPTS BLOCKED</div>
          <div className="text-3xl font-extrabold text-white font-mono">
            100% <span className="text-sm font-normal text-purple-400">Protected</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            In-memory & on-chain signature cache active
          </div>
        </div>
      </div>

      {/* Register Endpoint Form (Modal or Inline) */}
      {showAddModal && (
        <form
          onSubmit={handleCreateEndpoint}
          className="p-6 rounded-2xl border-2 border-emerald-500/40 bg-slate-900/90 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Register New x402 Paywalled Route</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Service Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. AI Image Generation API"
                className="bg-slate-950 border-slate-800 text-xs text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Endpoint Path</label>
              <Input
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                placeholder="/api/paid/generate-image"
                className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Price Per Call (SOL)</label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Description</label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What does this service provide to caller agents?"
              className="bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs h-9 cursor-pointer"
          >
            Deploy Protected x402 Route to Gateway
          </Button>
        </form>
      )}

      {/* Your Services Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="font-bold text-white text-sm">Configured Monitored Services</h3>
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{svc.name}</span>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                    {svc.category}
                  </Badge>
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  <span>{svc.endpoint}</span> • Recipient: {svc.providerAddress.slice(0, 10)}...
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 text-sm block">
                    {svc.priceSOL} SOL
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">per successful call</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                  ACTIVE
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
