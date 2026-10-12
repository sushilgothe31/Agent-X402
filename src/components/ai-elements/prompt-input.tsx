import React from "react";
import { ArrowUp, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PromptInput({
  className,
  onSubmit,
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      className={cn(
        "w-full rounded-2xl border border-zinc-200 bg-white shadow-sm p-2 flex flex-col focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400 transition-all",
        className
      )}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  );
}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={2}
      className={cn(
        "w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0",
        className
      )}
      placeholder="Ask to call an unpaid tool, paid tool, or inspect wallet..."
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const form = e.currentTarget.closest("form");
          if (form) form.requestSubmit();
        }
      }}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

export function PromptInputToolbar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between px-2 pt-1 border-t border-zinc-100", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PromptInputTools({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

export function PromptInputModelSelect({
  value,
  onValueChange,
  models,
}: {
  value: string;
  onValueChange: (v: string) => void;
  models: { name: string; value: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-full text-xs text-zinc-700">
      <Sparkles className="h-3 w-3 text-amber-500" />
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="bg-transparent text-xs font-medium text-zinc-800 focus:outline-none cursor-pointer"
      >
        {models.map((m) => (
          <option key={m.value} value={m.value}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PromptInputSubmit({
  disabled,
  status,
}: {
  disabled?: boolean;
  status?: string;
}) {
  const isPending = status === "submitted" || status === "streaming";

  return (
    <Button
      type="submit"
      size="icon"
      disabled={disabled || isPending}
      className="h-8 w-8 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
      title="Send prompt"
    >
      {isPending ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <ArrowUp className="h-4 w-4" />
      )}
    </Button>
  );
}
