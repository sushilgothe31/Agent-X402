import React, { useState } from "react";
import {
  Wrench,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Coins,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./code-block";
import { CopyToClipboardButton } from "@/components/copy-to-clipboard";
import { cn } from "@/lib/utils";

export interface ToolPart {
  toolName: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input: Record<string, any>;
  output?: {
    result?: any;
    text?: string;
    paid?: boolean;
    price?: string;
    _meta?: {
      "x402.payment-response"?: {
        transaction: string;
        amount?: string;
        network?: string;
        recipient?: string;
      };
    };
  };
  errorText?: string;
}

export function Tool({
  part,
  network = "base-sepolia",
  defaultOpen = true,
}: {
  part: ToolPart;
  network?: "base-sepolia" | "base";
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getStatusBadge = (status: ToolPart["state"]) => {
    switch (status) {
      case "input-streaming":
        return (
          <Badge variant="outline" className="text-zinc-600 bg-zinc-50 border-zinc-200">
            <Clock className="h-3 w-3 animate-pulse text-zinc-500" />
            Pending
          </Badge>
        );
      case "input-available":
        return (
          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
            <Clock className="h-3 w-3 animate-pulse text-amber-500" />
            Executing
          </Badge>
        );
      case "output-available":
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Completed
          </Badge>
        );
      case "output-error":
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Error
          </Badge>
        );
    }
  };

  const paymentMeta = part.output?._meta?.["x402.payment-response"];
  const isPaidTool = Boolean(paymentMeta || part.output?.paid);

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white shadow-2xs overflow-hidden my-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3.5 hover:bg-zinc-50/70 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-zinc-100 text-zinc-700">
            <Wrench className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-zinc-800">
            {part.toolName}
          </span>
          {getStatusBadge(part.state)}
          {isPaidTool && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50/80 text-amber-800 text-[10px]">
              <Coins className="h-2.5 w-2.5 mr-1 text-amber-600" />
              x402 Paid
            </Badge>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-zinc-100 p-4 space-y-4 bg-zinc-50/30 text-xs">
          {/* Tool Parameters */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-500">
                Parameters
              </span>
            </div>
            <CodeBlock code={JSON.stringify(part.input, null, 2)} language="json" />
          </div>

          {/* Tool Result */}
          {part.output && (
            <div className="space-y-1.5">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-500">
                Result
              </span>
              <div className="rounded-lg bg-zinc-100 border border-zinc-200 p-3 font-mono text-xs text-zinc-900 overflow-x-auto">
                {part.output.text ||
                  (typeof part.output.result !== "undefined"
                    ? JSON.stringify(part.output.result, null, 2)
                    : JSON.stringify(part.output, null, 2))}
              </div>
            </div>
          )}

          {part.errorText && (
            <div className="space-y-1.5">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-rose-500">
                Error
              </span>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 font-mono text-xs text-rose-800">
                {part.errorText}
              </div>
            </div>
          )}

          {/* x402 Payment Info */}
          {paymentMeta && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <span>x402 Micropayment Settled</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {paymentMeta.amount || "0.001 USDC"} ({paymentMeta.network || network})
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://${
                    network === "base-sepolia" ? "sepolia." : ""
                  }basescan.org/tx/${paymentMeta.transaction}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:underline truncate"
                >
                  <span className="truncate">{paymentMeta.transaction}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <CopyToClipboardButton content={paymentMeta.transaction} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
