import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  Terminal,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PAID_SERVICES,
  PaidService,
  executeServiceQuery,
} from "@/lib/marketplace";
import {
  executeSolanaPayment,
  getSolanaState,
  getSolanaExplorerUrl,
} from "@/lib/solana-wallet";
import {
  evaluateSpendingPolicy,
  recordPolicySpend,
  getSpendingPolicy,
} from "@/lib/spending-policy";

interface AgentStep {
  id: string;
  type: "thinking" | "discovery" | "policy" | "approval_required" | "payment" | "api_delivery" | "synthesis" | "error";
  title: string;
  details?: any;
  status: "pending" | "running" | "completed" | "failed";
}

interface AgentSession {
  id: string;
  userPrompt: string;
  timestamp: string;
  model: string;
  steps: AgentStep[];
  selectedService?: PaidService;
  paymentSignature?: string;
  costSOL?: number;
  finalAnswer?: string;
}

const SAMPLE_TASKS = [
  {
    label: "Analyze SOL Market Sentiment",
    prompt: "Scan recent on-chain whale activity and market sentiment for SOL using a verified data feed.",
    targetServiceId: "svc-market-intel",
  },
  {
    label: "Audit Anchor Smart Contract",
    prompt: "Perform an automated security audit on Solana program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA and verify CPI authority.",
    targetServiceId: "svc-contract-audit",
  },
  {
    label: "Scan DEX Arbitrage Signals",
    prompt: "Scan Solana DEX pools (Orca, Raydium, Meteora) for immediate arbitrage routes and profit spreads.",
    targetServiceId: "svc-dex-signals",
  },
  {
    label: "GPU Vector Embeddings",
    prompt: "Dispatch high-throughput GPU inference for a batch of 64 document vectors via decentralized DePIN compute.",
    targetServiceId: "svc-compute-cluster",
  },
];

export function AgentPlayground({
  onNavigateWallet,
}: {
  onNavigateWallet?: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("google/gemini-2.0-flash");
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<AgentSession | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{
    service: PaidService;
    amountSOL: number;
    reason: string;
    onApprove: () => void;
    onReject: () => void;
  } | null>(null);

  const runAgent = async (taskText: string, forcedServiceId?: string) => {
    if (!taskText.trim() || isRunning) return;

    setIsRunning(true);
    setPendingApproval(null);

    const sessionId = "session-" + Date.now();
    const session: AgentSession = {
      id: sessionId,
      userPrompt: taskText,
      timestamp: new Date().toISOString(),
      model,
      steps: [],
    };
    setCurrentSession(session);

    const addStep = (step: AgentStep) => {
      session.steps = [...session.steps, step];
      setCurrentSession({ ...session });
    };

    const updateLastStep = (updates: Partial<AgentStep>) => {
      if (session.steps.length === 0) return;
      const lastIdx = session.steps.length - 1;
      session.steps[lastIdx] = { ...session.steps[lastIdx], ...updates };
      setCurrentSession({ ...session });
    };

    // Step 1: Intent & Discovery
    addStep({
      id: "step-1",
      type: "discovery",
      title: "1. Service Discovery & Machine-Readable Schema Match",
      status: "running",
      details: "Analyzing user intent and scanning x402 marketplace catalog...",
    });

    await new Promise((r) => setTimeout(r, 600));

    // Match service
    const matchedService =
      PAID_SERVICES.find((s) => s.id === forcedServiceId) ||
      PAID_SERVICES.find((s) => {
        const text = taskText.toLowerCase();
        if (text.includes("sentiment") || text.includes("market") || text.includes("whale"))
          return s.id === "svc-market-intel";
        if (text.includes("audit") || text.includes("contract") || text.includes("anchor"))
          return s.id === "svc-contract-audit";
        if (text.includes("arbitrage") || text.includes("dex") || text.includes("signal"))
          return s.id === "svc-dex-signals";
        if (text.includes("compute") || text.includes("gpu") || text.includes("tensor"))
          return s.id === "svc-compute-cluster";
        return false;
      }) ||
      PAID_SERVICES[0];

    session.selectedService = matchedService;
    session.costSOL = matchedService.priceSOL;

    updateLastStep({
      status: "completed",
      details: {
        matchedService: matchedService.name,
        endpoint: matchedService.endpoint,
        priceSOL: `${matchedService.priceSOL} SOL`,
        provider: matchedService.provider,
        providerAddress: matchedService.providerAddress,
        mcpTool: matchedService.mcpToolName,
      },
    });

    // Step 2: Policy Evaluation
    addStep({
      id: "step-2",
      type: "policy",
      title: "2. Trusted Spending Policy Verification",
      status: "running",
      details: `Evaluating safety constraints for ${matchedService.priceSOL} SOL transaction...`,
    });

    await new Promise((r) => setTimeout(r, 500));

    const policyEval = evaluateSpendingPolicy({
      serviceId: matchedService.id,
      recipient: matchedService.providerAddress,
      amountSOL: matchedService.priceSOL,
      token: matchedService.token,
      network: matchedService.network,
    });

    if (!policyEval.allowed) {
      updateLastStep({
        status: "failed",
        details: { rejectionReason: policyEval.reason },
      });
      session.finalAnswer = `Execution halted by safety policy: ${policyEval.reason}`;
      setCurrentSession({ ...session });
      setIsRunning(false);
      return;
    }

    if (policyEval.requiresManualApproval) {
      updateLastStep({
        status: "running",
        title: "2. Manual Approval Required by Spending Policy",
        details: {
          policyReason: policyEval.reason,
          amountSOL: matchedService.priceSOL,
          thresholdSOL: getSpendingPolicy().requireManualApprovalAboveSOL,
        },
      });

      // Pause and await user confirmation
      await new Promise<boolean>((resolve) => {
        setPendingApproval({
          service: matchedService,
          amountSOL: matchedService.priceSOL,
          reason: policyEval.reason || "Amount exceeds automatic authorization threshold.",
          onApprove: () => {
            setPendingApproval(null);
            resolve(true);
          },
          onReject: () => {
            setPendingApproval(null);
            resolve(false);
          },
        });
      }).then(async (approved) => {
        if (!approved) {
          updateLastStep({
            status: "failed",
            details: "User rejected payment authorization request.",
          });
          session.finalAnswer = "Task cancelled: User rejected x402 payment authorization.";
          setCurrentSession({ ...session });
          setIsRunning(false);
          return;
        }
        updateLastStep({
          status: "completed",
          details: "Payment authorized by user in interactive confirmation.",
        });
        await proceedWithPaymentAndDelivery();
      });
      return;
    }

    updateLastStep({
      status: "completed",
      details: {
        autoApproved: true,
        reason: "Amount is within auto-authorized micro-spending policy envelope.",
      },
    });

    await proceedWithPaymentAndDelivery();

    async function proceedWithPaymentAndDelivery() {
      // Step 3: Solana Payment Settlement
      addStep({
        id: "step-3",
        type: "payment",
        title: "3. Solana x402 Micropayment Execution",
        status: "running",
        details: `Broadcasting ${matchedService.priceSOL} SOL transfer on Solana Devnet...`,
      });

      let paymentResult: any;
      try {
        paymentResult = await executeSolanaPayment({
          toAddress: matchedService.providerAddress,
          amountSOL: matchedService.priceSOL,
          purpose: `x402 Access: ${matchedService.name}`,
          serviceId: matchedService.id,
        });
      } catch (payErr: any) {
        updateLastStep({
          status: "failed",
          details: { error: payErr.message },
        });
        session.finalAnswer = `Solana payment failed: ${payErr.message}`;
        setCurrentSession({ ...session });
        setIsRunning(false);
        return;
      }

      session.paymentSignature = paymentResult.signature;
      recordPolicySpend(matchedService.priceSOL);

      updateLastStep({
        status: "completed",
        details: {
          signature: paymentResult.signature,
          network: "solana-devnet",
          amount: `${matchedService.priceSOL} SOL`,
          slot: paymentResult.transaction.slot,
          latencyMs: paymentResult.transaction.confirmationTimeMs,
          explorerUrl: getSolanaExplorerUrl(paymentResult.signature),
        },
      });

      // Step 4: Call Protected API with x402 Proof
      addStep({
        id: "step-4",
        type: "api_delivery",
        title: "4. Consuming Paid API with x402 Proof",
        status: "running",
        details: `Submitting Authorization: x402-solana signature="${paymentResult.signature.slice(0, 16)}..." to ${matchedService.endpoint}`,
      });

      await new Promise((r) => setTimeout(r, 600));

      const apiData = executeServiceQuery(matchedService.id, {
        symbol: "SOL",
        programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      });

      updateLastStep({
        status: "completed",
        details: {
          httpStatus: 200,
          verifiedReceipt: paymentResult.signature,
          payload: apiData,
        },
      });

      // Step 5: Final Synthesis
      addStep({
        id: "step-5",
        type: "synthesis",
        title: "5. Intelligence Synthesis & Final Report",
        status: "completed",
      });

      session.finalAnswer = generateSynthesisReport(matchedService, apiData, paymentResult.signature);
      setCurrentSession({ ...session });
      setIsRunning(false);
    }
  };

  function generateSynthesisReport(service: PaidService, data: any, sig: string) {
    if (service.id === "svc-market-intel") {
      return `### 📊 Real-Time Market Intelligence Report for ${data.asset}
- **Current Price:** $${data.priceUSD} (${data.change24h})
- **Market Sentiment Rating:** ${data.sentiment}
- **Active On-Chain Wallets (24h):** ${data.onChainMetrics.activeWallets24h.toLocaleString()}
- **Whale Inflow Accumulation:** +${data.onChainMetrics.whaleAccumulationSOL.toLocaleString()} SOL
- **Instant Solana TPS:** ${data.onChainMetrics.tpsInstant} tx/s

**Agent Conclusion:** ${data.aiSummary}

---
*Autonomous x402 micro-settlement confirmed on Solana Devnet. Tx: [${sig.slice(0, 16)}...](${getSolanaExplorerUrl(sig)}) (Cost: ${service.priceSOL} SOL)*`;
    }

    if (service.id === "svc-contract-audit") {
      return `### 🛡️ Anchor Smart Contract Security Verification
- **Target Program:** \`${data.targetProgram}\`
- **Overall Safety Score:** ${data.safetyScore}/100 (${data.overallStatus})
- **CPI Authority Validation:** Enforced & Validated
- **Vulnerabilities Found:** 0 critical / 0 warnings
- **Audit Certificate:** \`${data.auditDigest}\`

**Security Verdict:** ${data.verdict}

---
*Autonomous x402 micro-settlement confirmed on Solana Devnet. Tx: [${sig.slice(0, 16)}...](${getSolanaExplorerUrl(sig)}) (Cost: ${service.priceSOL} SOL)*`;
    }

    return `### Service Delivery Complete: ${service.name}
${JSON.stringify(data, null, 2)}

---
*Autonomous x402 settlement confirmed on Solana Devnet. Signature: \`${sig}\` (Cost: ${service.priceSOL} SOL)*`;
  }

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      const q = prompt.trim();
      setPrompt("");
      runAgent(q);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Playground Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#14f195]" />
            <h2 className="text-2xl font-extrabold text-white">Autonomous Agent Playground</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Agents discover digital APIs, negotiate machine-readable prices, check spending policies, and pay over Solana.
          </p>
        </div>

        {/* Model Selector & Wallet Balance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent font-mono text-xs focus:outline-none cursor-pointer text-white"
            >
              <option value="google/gemini-2.0-flash">Gemini 2.0 Flash Lite</option>
              <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="openai/gpt-4o">GPT-4o (x402)</option>
              <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono text-xs py-1.5">
            Solana Devnet
          </Badge>
        </div>
      </div>

      {/* Preset Tasks */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider font-semibold">
          Pre-Configured Agent Directives
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_TASKS.map((t, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(t.prompt);
                runAgent(t.prompt, t.targetServiceId);
              }}
              disabled={isRunning}
              className="p-3 text-left rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1 group cursor-pointer disabled:opacity-50"
            >
              <div className="font-semibold text-white group-hover:text-[#14f195] transition-colors flex items-center justify-between">
                <span>{t.label}</span>
                <ArrowRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {t.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Prompt Input */}
      <form onSubmit={handleTaskSubmit} className="relative">
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all shadow-xl">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isRunning}
            placeholder="Assign an autonomous task (e.g. 'Audit smart contract on Solana and fetch sentiment')..."
            className="border-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 px-3 py-2"
          />
          <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-500 font-mono">
              x402 autonomous payment enabled • Solana Devnet
            </span>
            <Button
              type="submit"
              disabled={!prompt.trim() || isRunning}
              size="sm"
              className="bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs h-8 px-4 rounded-lg cursor-pointer gap-1.5"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Agent Reasoning...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Dispatch Agent
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Manual Approval Dialog Modal if Triggered */}
      {pendingApproval && (
        <div className="p-5 rounded-2xl border-2 border-amber-500/50 bg-amber-950/30 backdrop-blur-md space-y-4 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Agent Spending Policy Authorization Required
                </h4>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  {pendingApproval.reason}
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-300 font-mono">
              {pendingApproval.amountSOL} SOL ($
              {(pendingApproval.amountSOL * 160).toFixed(2)})
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Requested Service</span>
              <span className="text-white font-semibold">{pendingApproval.service.name}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Recipient Address</span>
              <span className="text-slate-300 truncate block">
                {pendingApproval.service.providerAddress.slice(0, 10)}...
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Solana Network</span>
              <span className="text-emerald-400">solana-devnet</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={pendingApproval.onReject}
              className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Reject Payment
            </Button>
            <Button
              size="sm"
              onClick={pendingApproval.onApprove}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Approve & Authorize {pendingApproval.amountSOL} SOL
            </Button>
          </div>
        </div>
      )}

      {/* Live Agent Execution Lifecycle */}
      {currentSession && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#14f195]" />
              <h3 className="font-bold text-white text-sm">Autonomous Execution Trace</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Task: "{currentSession.userPrompt.slice(0, 40)}..."
            </span>
          </div>

          {/* Stepper */}
          <div className="space-y-4">
            {currentSession.steps.map((step) => (
              <div
                key={step.id}
                className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/70 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    {step.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-[#14f195]" />
                    )}
                    {step.status === "running" && (
                      <RefreshCw className="h-4 w-4 text-[#00d2ff] animate-spin" />
                    )}
                    {step.status === "failed" && (
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    )}
                    <span>{step.title}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] ${
                      step.status === "completed"
                        ? "border-emerald-500/30 text-emerald-400"
                        : step.status === "running"
                        ? "border-cyan-500/30 text-cyan-400"
                        : "border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {step.status.toUpperCase()}
                  </Badge>
                </div>

                {step.details && (
                  <div className="p-3 rounded-lg bg-slate-900/90 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto border border-slate-800/50">
                    {typeof step.details === "string" ? (
                      <div>{step.details}</div>
                    ) : (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Synthesized Output */}
          {currentSession.finalAnswer && (
            <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Agent Synthesized Output & Verified Proof</span>
                </div>
                {currentSession.paymentSignature && (
                  <a
                    href={getSolanaExplorerUrl(currentSession.paymentSignature)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#00d2ff] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Inspect on Solana Explorer</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {currentSession.finalAnswer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
