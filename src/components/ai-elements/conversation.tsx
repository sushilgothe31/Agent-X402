import React, { useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Conversation({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative flex-1 overflow-y-auto flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ConversationContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [children]);

  return (
    <div className={cn("p-4 space-y-4 flex-1", className)} {...props}>
      {children}
      <div ref={bottomRef} />
    </div>
  );
}

export function ConversationScrollButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-md bg-white border-zinc-200 h-8 w-8",
        className
      )}
      title="Scroll to bottom"
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}
