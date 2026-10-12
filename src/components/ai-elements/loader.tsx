import React from "react";
import { cn } from "@/lib/utils";

export function Loader({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-zinc-500 text-sm py-2", className)}>
      <svg
        className="animate-spin text-zinc-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        style={{ width: size, height: size }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
      <span className="text-xs font-mono text-zinc-500">Processing with x402 agent...</span>
    </div>
  );
}
