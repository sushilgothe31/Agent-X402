import React from "react";
import { cn } from "@/lib/utils";

export interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Response({ className, children, ...props }: ResponseProps) {
  return (
    <div
      className={cn(
        "prose prose-zinc max-w-none text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
