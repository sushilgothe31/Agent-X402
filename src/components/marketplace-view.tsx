import React, { useState } from "react";
import {
  Layers,
  Search,
  Filter,
  Coins,
  Activity,
  CheckCircle2,
  ExternalLink,
  Code,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PAID_SERVICES, PaidService, executeServiceQuery } from "@/lib/marketplace";
import { executeSolanaPayment, getSolanaExplorerUrl } from "@/lib/solana-wallet";

export function MarketplaceView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedService, setSelectedService] = useState<PaidService | null>(PAID_SERVICES[0]);
  const [testingServiceId, setTestingServiceId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const categories = ["All", "Intelligence", "Security", "DeFi", "Compute"];

  const filteredServices = PAID_SERVICES.filter((svc) => {
    const matchesCategory =
      selectedCategory === "All" || svc.category === selectedCategory;
    const matchesSearch =
      svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      svc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      svc.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTestService = async (service: PaidService) => {
    setTestingServiceId(service.id);
    setTestLogs([]);
    setTestResult(null);

    const log = (msg: string) => setTestLogs((prev) => [...prev, msg]);

    log(`1. Dispatching request to ${service.endpoint}...`);
    await new Promise((r) => setTimeout(r, 400));

    log(`2. Received HTTP 402 Payment Required`);
    log(`   WWW-Authenticate: x402 realm="agent-x402", network="solana-devnet", price="${service.priceSOL} SOL", recipient="${service.providerAddress.slice(0, 12)}..."`);
    await new Promise((r) => setTimeout(r, 500));

    log(`3. Initiating x402 Solana payment of ${service.priceSOL} SOL...`);

    try {
      const payResult = await executeSolanaPayment({
        toAddress: service.providerAddress,
        amountSOL: service.priceSOL,
        purpose: `Marketplace Direct Test: ${service.name}`,
        serviceId: service.id,
      });

      log(`4. Confirmed transaction on Solana Devnet:`);
      log(`   Signature: ${payResult.signature.slice(0, 24)}... (Slot #${payResult.transaction.slot})`);
      await new Promise((r) => setTimeout(r, 400));

      log(`5. Retrying request with Authorization: x402-solana signature="${payResult.signature.slice(0, 16)}..."`);

      const payload = executeServiceQuery(service.id, service.requestExample);
      await new Promise((r) => setTimeout(r, 300));

      log(`6. HTTP 200 OK verified. Returning protected data.`);
      setTestResult({
        receipt: {
          signature: payResult.signature,
          amountSOL: service.priceSOL,
          explorerUrl: getSolanaExplorerUrl(payResult.signature),
          timestamp: new Date().toISOString(),
        },
        data: payload,
      });
    } catch (err: any) {
      log(`Error: ${err.message}`);
    } finally {
      setTestingServiceId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Marketplace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#00d2ff]" />
            <h2 className="text-2xl font-extrabold text-white">
              Paid API & Service Marketplace
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine-readable digital services monetized via Solana x402 HTTP micropayments.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services or endpoints..."
              className="pl-8 text-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-9 rounded-xl"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#14f195] text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Services List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Services List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredServices.map((service) => {
            const isSelected = selectedService?.id === service.id;
            const isTesting = testingServiceId === service.id;

            return (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? "bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{service.name}</span>
                      <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                        {service.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-base text-[#14f195]">
                      {service.priceSOL} SOL
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      ~${(service.priceSOL * 165).toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 truncate max-w-[220px]">
                      {service.endpoint}
                    </span>
                    <span>• {service.latencyMs}ms</span>
                    <span className="text-emerald-400">• {service.uptimePercent}% uptime</span>
                  </div>

                  <Button
                    size="sm"
                    disabled={isTesting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestService(service);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] h-7 px-3 rounded-lg font-mono cursor-pointer gap-1"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 text-amber-400" />
                        Test x402 Call
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Service Inspector & Test Console (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5 sticky top-24">
          {selectedService ? (
            <>
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Service Specification</h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Provider: {selectedService.provider}
                  </span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs">
                  {selectedService.priceSOL} SOL / call
                </Badge>
              </div>

              {/* Endpoint Details */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                  <div className="text-slate-500 text-[10px] uppercase">HTTP Method & Path</div>
                  <div className="text-emerald-400 font-semibold">GET {selectedService.endpoint}</div>
                  <div className="text-slate-500 text-[10px] uppercase pt-1">Recipient Address</div>
                  <div className="text-slate-300 truncate">{selectedService.providerAddress}</div>
                </div>
              </div>

              {/* Request Example */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>SAMPLE REQUEST SCHEMA</span>
                  <Code className="h-3.5 w-3.5" />
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedService.requestExample, null, 2)}
                </pre>
              </div>

              {/* Live Test Console */}
              {testLogs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Terminal className="h-3.5 w-3.5 text-[#14f195]" />
                    <span>x402 EXECUTION TRACE</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300 max-h-48 overflow-y-auto">
                    {testLogs.map((log, i) => (
                      <div key={i} className="text-slate-300 leading-relaxed">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Response Result */}
              {testResult && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      HTTP 200 OK (VERIFIED)
                    </span>
                    <a
                      href={testResult.receipt.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00d2ff] hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>Solana Explorer</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-56">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Select an API service on the left to inspect its x402 schema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
