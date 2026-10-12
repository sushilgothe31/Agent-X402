import React, { useState } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Reasoning({
  children,
  duration = 1,
  defaultOpen = false,
  className,
}: {
  children: React.ReactNode;
  duration?: number;
  defaultOpen?: boolean;
  className?: string;
  isStreaming?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("w-full border border-purple-200/60 bg-purple-50/50 rounded-xl p-3 my-2", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-medium text-purple-900 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
          <span>Agent Reasoning ({duration}s)</span>
        </div>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-purple-600 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-purple-200/50 text-xs text-purple-950 font-mono leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

export function ReasoningTrigger() {
  return null;
}

export function ReasoningContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
