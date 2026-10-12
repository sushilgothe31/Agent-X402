import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Suggestions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 py-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Suggestion({
  suggestion,
  onClick,
  variant = "outline",
  size = "sm",
  className,
}: {
  suggestion: string;
  onClick?: () => void;
  variant?: "outline" | "default" | "secondary";
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "rounded-full text-xs font-normal border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-2xs py-1 h-auto cursor-pointer",
        className
      )}
    >
      {suggestion}
    </Button>
  );
}
