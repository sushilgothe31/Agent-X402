import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, ExternalLink, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { recordPayment } from "@/lib/accounts";

export function BlogView({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const [isBot, setIsBot] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidTx, setPaidTx] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      const { hash } = recordPayment("Blog scraper paywall access (/blog)", 0.001);
      setPaidTx(hash);
      setIsPaid(true);
      setPaying(false);
    }, 1000);
  };

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      {/* Bot Simulator Control Banner */}
      <div className="mb-8 p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
              x402 Anti-Scraping Paywall Simulator
            </span>
            <Badge variant="outline" className="text-[10px]">
              $0.001 USDC / access
            </Badge>
          </div>
          <p className="text-xs text-zinc-600">
            This page is protected by an x402 paywall <strong>only for bots</strong>. Human visitors browse for free; AI crawlers and bots are charged.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant={isBot ? "default" : "outline"}
            onClick={() => {
              setIsBot(!isBot);
              if (isBot) {
                setIsPaid(false);
                setPaidTx(null);
              }
            }}
            className="text-xs cursor-pointer gap-1.5"
          >
            {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {isBot ? "Bot Mode Active (?bot=true)" : "Simulate Bot Crawler"}
          </Button>
        </div>
      </div>

      {/* Paywall Interception State if Bot and Not Paid */}
      {isBot && !isPaid ? (
        <div className="p-8 rounded-2xl border-2 border-amber-300 bg-amber-50/70 text-center space-y-4 my-8 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-amber-950">
              402 Payment Required
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              Bot scraper detected via User-Agent or <code className="bg-amber-100 px-1 py-0.5 rounded">?bot=true</code>. Access to this content requires an x402 micropayment of <strong>$0.001 USDC</strong> on Base Sepolia.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={handlePay}
              disabled={paying}
              className="bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer h-9 px-5 text-xs font-medium"
            >
              {paying ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing & Paying with CDP Wallet...
                </span>
              ) : (
                "Authorize $0.001 USDC with x402 Agent"
              )}
            </Button>
            {onOpenWallet && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenWallet}
                className="text-xs bg-white"
              >
                Inspect Agent Wallet
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {isBot && isPaid && paidTx && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>x402 Payment Verified!</strong> Unlocked protected articles for bot agent.
                </span>
              </div>
              <a
                href={`https://sepolia.basescan.org/tx/${paidTx}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-blue-600 hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>View Tx</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-zinc-900">My Blog</h1>

            <div className="space-y-8 divide-y divide-zinc-200">
              <article className="pt-6 first:pt-0">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                  Getting Started with Next.js & x402
                </h2>
                <div className="text-xs text-zinc-500 mb-4 font-mono">Posted on October 12, 2026</div>
                <p className="text-zinc-600 leading-relaxed text-sm mb-4">
                  Next.js is a powerful React framework that makes building web applications a breeze. By marrying Next.js middleware with the x402 HTTP micropayment protocol, web creators can monetize bot traffic without captchas or subscription paywalls...
                </p>
                <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                  Read full article →
                </span>
              </article>

              <article className="pt-6">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                  Understanding TypeScript & Agentic Commerce
                </h2>
                <div className="text-xs text-zinc-500 mb-4 font-mono">Posted on October 8, 2026</div>
                <p className="text-zinc-600 leading-relaxed text-sm mb-4">
                  TypeScript adds static typing to JavaScript, making your code more reliable and easier to maintain. When programming autonomous AI agents that handle financial assets, type-safe RPC and MCP schemas eliminate costly execution errors...
                </p>
                <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                  Read full article →
                </span>
              </article>

              <article className="pt-6">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                  The Return of HTTP 402 Payment Required
                </h2>
                <div className="text-xs text-zinc-500 mb-4 font-mono">Posted on September 29, 2026</div>
                <p className="text-zinc-600 leading-relaxed text-sm mb-4">
                  RFC 9110 reserved status code 402 for future use. Decades later, with low-fee L2 rollups like Base and standard stablecoins like USDC, HTTP 402 has finally become the native payment rail for the AI agent economy...
                </p>
                <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                  Read full article →
                </span>
              </article>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
