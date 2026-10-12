import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant" | "system";
}

export function Message({ from, className, children, ...props }: MessageProps) {
  const isUser = from === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-2",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
          <AvatarFallback className="bg-zinc-900 text-white">AI</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[85%] flex flex-col gap-1.5", isUser && "items-end")}>
        {children}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
          <AvatarFallback className="bg-blue-600 text-white">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function MessageContent({
  children,
  className,
  isUser,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { isUser?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-900 border border-zinc-200/80 shadow-2xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
