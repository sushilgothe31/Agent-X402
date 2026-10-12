import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CopyToClipboardButton({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <Button
      size="icon"
      variant="outline"
      className={cn("h-7 w-7 rounded-md shrink-0 p-1", className)}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-zinc-500" />
      )}
    </Button>
  );
}
