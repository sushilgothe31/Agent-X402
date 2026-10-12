import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  RotateCcw,
  Check,
  Info,
  Sliders,
  DollarSign,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getSpendingPolicy,
  saveSpendingPolicy,
  resetSessionBudget,
  SpendingPolicy,
} from "@/lib/spending-policy";

export function SpendingPoliciesView() {
  const [policy, setPolicy] = useState<SpendingPolicy>(getSpendingPolicy());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSpendingPolicy(policy);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetSession = () => {
    resetSessionBudget();
    setPolicy(getSpendingPolicy());
  };

  const budgetPercent = Math.min(
    100,
    Math.round((policy.currentSessionSpentSOL / policy.maxSessionBudgetSOL) * 100)
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00d2ff]" />
            <h2 className="text-2xl font-extrabold text-white">Agent Spending Policies</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforced in trusted application code. Autonomous agents cannot exceed these hard constraints.
          </p>
        </div>

        <Button
          onClick={handleResetSession}
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-900 text-slate-300 text-xs h-8 cursor-pointer gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Session Budget
        </Button>
      </div>

      {/* Live Budget Gauge Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-400 font-mono uppercase">
            Active Session Expenditure Envelope
          </span>
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            {policy.currentSessionSpentSOL.toFixed(3)} / {policy.maxSessionBudgetSOL} SOL ({budgetPercent}%)
          </span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              budgetPercent > 80
                ? "bg-rose-500"
                : budgetPercent > 50
                ? "bg-amber-400"
                : "bg-gradient-to-r from-[#14f195] to-[#00d2ff]"
            }`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Remaining: {(policy.maxSessionBudgetSOL - policy.currentSessionSpentSOL).toFixed(3)} SOL</span>
          <span>Hourly tx count: {policy.currentTxCountHour} / {policy.rateLimitPerHour}</span>
        </div>
      </div>

      {/* Policy Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Per Tx */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">
              Max Amount Per Transaction (SOL)
            </label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              value={policy.maxPerTransactionSOL}
              onChange={(e) =>
                setPolicy({ ...policy, maxPerTransactionSOL: parseFloat(e.target.value) || 0 })
              }
              className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Any individual API call exceeding this amount will be immediately rejected.
            </p>
          </div>

          {/* Max Session Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">
              Total Session Budget (SOL)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={policy.maxSessionBudgetSOL}
              onChange={(e) =>
                setPolicy({ ...policy, maxSessionBudgetSOL: parseFloat(e.target.value) || 0 })
              }
              className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Cumulative spending ceiling for the current agent session.
            </p>
          </div>

          {/* Require Manual Approval Above */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">
              Interactive Approval Threshold (SOL)
            </label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              value={policy.requireManualApprovalAboveSOL}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  requireManualApprovalAboveSOL: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Transactions above this amount pause execution and prompt the human operator.
            </p>
          </div>

          {/* Hourly Rate Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">
              Max Transactions Per Hour
            </label>
            <Input
              type="number"
              min="1"
              value={policy.rateLimitPerHour}
              onChange={(e) =>
                setPolicy({ ...policy, rateLimitPerHour: parseInt(e.target.value) || 10 })
              }
              className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Throttles runaway loops or malicious agent recursive queries.
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-xs text-white block">Auto-Pay Micro-Transactions</span>
              <span className="text-[11px] text-slate-500">
                Allow autonomous execution for payments below the manual approval threshold.
              </span>
            </div>
            <input
              type="checkbox"
              checked={policy.autoPayEnabled}
              onChange={(e) => setPolicy({ ...policy, autoPayEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-[#14f195] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-xs text-white block">Enforce Master Policy Protection</span>
              <span className="text-[11px] text-slate-500">
                Master switch to enable all spending policy validation checks.
              </span>
            </div>
            <input
              type="checkbox"
              checked={policy.enabled}
              onChange={(e) => setPolicy({ ...policy, enabled: e.target.checked })}
              className="h-4 w-4 rounded accent-[#14f195] cursor-pointer"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Spending policies updated and active in trusted runtime!</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs h-10 rounded-xl cursor-pointer"
        >
          Save & Apply Policy Configuration
        </Button>
      </form>
    </div>
  );
}
