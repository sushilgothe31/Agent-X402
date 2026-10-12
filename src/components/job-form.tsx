import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface JobFormProps {
  onSubmit: (job: string, enablePayment: boolean, actAsScraper: boolean) => void;
  isSubmitting: boolean;
}

const JOB_DESCRIPTIONS = {
  math: "Calls a paywalled /api/add endpoint requiring $0.005 USDC payment. Without payment enabled, this will fail with a 402 Payment Required response. With payment, the client signs and settles on Base Sepolia.",
  scrape: "Scrapes blog titles from /blog. The page is protected by an x402 paywall only for bots ($0.001 USDC). Regular browser traffic is free, but bots must pay via HTTP 402 to scrape.",
};

export function JobForm({ onSubmit, isSubmitting }: JobFormProps) {
  const [selectedJob, setSelectedJob] = useState<string>("math");
  const [enablePayment, setEnablePayment] = useState<boolean>(true);
  const [actAsScraper, setActAsScraper] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob && !isSubmitting) {
      onSubmit(selectedJob, enablePayment, actAsScraper);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">Job Configuration</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Select an agent task that interacts with an x402 protected resource.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 my-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Select Job</label>
            <Select value={selectedJob} onValueChange={(val) => setSelectedJob(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math">Math API (Paywalled Compute)</SelectItem>
                <SelectItem value="scrape">Web Scraper (Bot Paywalled Page)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedJob && (
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-lg">
              <p className="text-xs text-zinc-600 leading-relaxed">
                {JOB_DESCRIPTIONS[selectedJob as keyof typeof JOB_DESCRIPTIONS]}
              </p>
            </div>
          )}

          <div className="pt-2 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="enable-payment"
                checked={enablePayment}
                onCheckedChange={(checked) => setEnablePayment(checked)}
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor="enable-payment"
                  className="text-sm font-medium text-zinc-900 cursor-pointer"
                >
                  Enable x402 Payment
                </label>
                <p className="text-xs text-zinc-500">
                  Wraps HTTP client to automatically intercept HTTP 402, parse payment challenge, sign with purchaser wallet on Base Sepolia, and retry request.
                </p>
              </div>
            </div>

            {selectedJob === "scrape" && (
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="act-as-scraper"
                  checked={actAsScraper}
                  onCheckedChange={(checked) => setActAsScraper(checked)}
                />
                <div className="grid gap-1 leading-none">
                  <label
                    htmlFor="act-as-scraper"
                    className="text-sm font-medium text-zinc-900 cursor-pointer"
                  >
                    Act as Web Scraper (Bot User-Agent)
                  </label>
                  <p className="text-xs text-zinc-500">
                    Sets User-Agent header to <code>'ChatGPT-User / Bot'</code> to trigger the bot anti-scraping micropayment paywall.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!selectedJob || isSubmitting}
          className="w-full mt-4 h-10 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Running Job & Logging...
            </span>
          ) : (
            "Run Job"
          )}
        </Button>
      </form>
    </div>
  );
}
