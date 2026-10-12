import React from "react";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Terminal, ShieldCheck, AlertCircle } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  message?: string;
  type?: "log" | "result" | "error";
  result?: any;
  error?: string;
}

export interface LogViewerProps {
  isActive: boolean;
  logs: LogEntry[];
  onClear?: () => void;
}

function parseLogContent(message: string): {
  hasJson: boolean;
  prefix: string;
  jsonContent: string;
  suffix: string;
  raw: string;
} {
  const jsonMatch = message.match(/({[\s\S]*}|\[[\s\S]*\])/);
  if (jsonMatch && jsonMatch.index !== undefined) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const formatted = JSON.stringify(parsed, null, 2);
      const prefix = message.substring(0, jsonMatch.index).trim();
      const suffix = message.substring(jsonMatch.index + jsonMatch[1].length).trim();
      return {
        hasJson: true,
        prefix,
        jsonContent: formatted,
        suffix,
        raw: message,
      };
    } catch {
      // not valid JSON
    }
  }
  return { hasJson: false, prefix: "", jsonContent: "", suffix: "", raw: message };
}

export function LogViewer({ isActive, logs, onClear }: LogViewerProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-zinc-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-zinc-600" />
          <h3 className="font-semibold text-sm text-zinc-900">Real-Time Server Logs</h3>
        </div>
        <div className="flex items-center gap-4">
          {onClear && logs.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"
              }`}
            />
            <span className="text-zinc-500 font-mono text-[11px]">
              {isActive ? "Streaming" : "Idle"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto max-h-[620px] font-mono text-xs space-y-3 bg-zinc-50/50">
        {logs.length === 0 && !isActive && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <Terminal className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-sans font-medium text-zinc-500">No logs yet</p>
            <p className="text-xs font-sans mt-1 max-w-sm">
              Configure a job on the left and click "Run Job" to observe HTTP 402 negotiation, challenge handling, and wallet settlement in real-time.
            </p>
          </div>
        )}

        {logs.map((log, index) => {
          const isError = log.type === "error" || (log.message && log.message.includes("402 Payment Required"));
          const isSuccess = log.type === "result";

          const parsed = parseLogContent(
            log.message ||
              (log.type === "result"
                ? JSON.stringify(log.result, null, 2)
                : log.error || "")
          );

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                {isSuccess && (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Job Succeeded
                  </span>
                )}
                {isError && (
                  <span className="text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Paywall Intercepted
                  </span>
                )}
              </div>

              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed overflow-x-auto ${
                  isError
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : isSuccess
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                    : "bg-white border-zinc-200 text-zinc-800 shadow-2xs"
                }`}
              >
                {parsed.hasJson ? (
                  <div className="space-y-2">
                    {parsed.prefix && <div>{parsed.prefix}</div>}
                    <CodeBlock code={parsed.jsonContent} language="json" />
                    {parsed.suffix && <div>{parsed.suffix}</div>}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{parsed.raw}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
