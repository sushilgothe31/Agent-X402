import React, { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyToClipboardButton } from "./copy-to-clipboard";
import {
  CDPTransaction,
  TransactionStatus,
  fetchPaymentHistory,
  clearPaymentHistory,
} from "@/lib/accounts";

export interface TransactionHistoryProps {
  className?: string;
  refreshTrigger?: number;
  onTransactionSelect?: (tx: CDPTransaction) => void;
}

export function TransactionHistory({
  className = "",
  refreshTrigger,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<CDPTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"all" | TransactionStatus>("all");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentHistory();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch payment history from CDP wallet:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, refreshTrigger]);

  const handleClear = () => {
    clearPaymentHistory();
    setTransactions([]);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.status === filter;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium gap-1 px-2 py-0.5"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-medium gap-1 px-2 py-0.5"
          >
            <Clock className="h-3 w-3 text-amber-600 animate-spin" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-medium gap-1 px-2 py-0.5"
          >
            <XCircle className="h-3 w-3 text-rose-600" />
            Failed
          </Badge>
        );
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });

      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      let relative = "";
      if (diffSecs < 60) relative = "Just now";
      else if (diffSecs < 3600) relative = `${Math.floor(diffSecs / 60)}m ago`;
      else if (diffSecs < 86400) relative = `${Math.floor(diffSecs / 3600)}h ago`;
      else relative = `${Math.floor(diffSecs / 86400)}d ago`;

      return { full: `${dateStr}, ${timeStr}`, relative };
    } catch {
      return { full: isoString, relative: "" };
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Component Header with Controls */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-zinc-100 text-zinc-700">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Coinbase CDP Payment History
            </h3>
            <span className="text-[11px] text-zinc-500">
              Live settlement log on Base Sepolia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Filter Pills */}
          <div className="hidden sm:flex items-center bg-zinc-100 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                filter === "confirmed"
                  ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Confirmed
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadTransactions}
            disabled={loading}
            title="Refresh payment history"
            className="h-7 w-7 rounded-md text-zinc-500 hover:text-zinc-900"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`}
            />
          </Button>

          {transactions.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              title="Clear transaction log"
              className="h-7 w-7 rounded-md text-zinc-400 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {loading && transactions.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-zinc-400">
            <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
            <span className="text-xs font-mono">
              Querying Coinbase CDP on Base Sepolia...
            </span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-8 rounded-xl border border-dashed border-zinc-200 text-center space-y-1">
            <p className="text-xs font-medium text-zinc-600">
              No transactions found
            </p>
            <p className="text-[11px] text-zinc-400">
              Execute a paid tool in the Chat or run a job in the Playground to see x402 settlements.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const { full, relative } = formatTimestamp(tx.timestamp);
            const isFaucet = tx.type === "faucet" || tx.amount.startsWith("+");

            return (
              <div
                key={tx.id}
                className="group p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 hover:shadow-xs transition-all space-y-2"
              >
                {/* Upper line: Purpose & Status & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-1.5">
                      {isFaucet ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      )}
                      <span className="font-semibold text-zinc-900 text-xs truncate">
                        {tx.purpose}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{full}</span>
                      {relative && (
                        <span className="text-zinc-400 font-mono">({relative})</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`font-mono font-bold text-xs ${
                        isFaucet ? "text-blue-600" : "text-emerald-700"
                      }`}
                    >
                      {tx.amount}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>

                {/* Lower line: TxHash, Explorer link, Block & Gas */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
                    <span className="text-zinc-400 text-[10px]">Tx:</span>
                    <a
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <CopyToClipboardButton content={tx.hash} />
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                    {tx.blockNumber && <span>Block #{tx.blockNumber}</span>}
                    {tx.gasFee && <span>• {tx.gasFee}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
