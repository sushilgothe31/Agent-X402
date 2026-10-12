import React, { useState } from "react";
import { JobForm } from "@/components/job-form";
import { LogViewer, LogEntry } from "@/components/log-viewer";
import { recordPayment, PURCHASER_ADDRESS, SELLER_ADDRESS } from "@/lib/accounts";

export function PlaygroundView() {
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const appendLog = (message: string, type: LogEntry["type"] = "log", result?: any, error?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        message,
        type,
        result,
        error,
      },
    ]);
  };

  const handleJobSubmit = async (
    job: string,
    enablePayment: boolean,
    actAsScraper: boolean
  ) => {
    setIsJobRunning(true);
    setLogs([]);

    appendLog(`initiating job ${job}`);

    if (job === "math") {
      // 1. Initial Request
      setTimeout(() => {
        appendLog(`Request: POST /api/add`);
        appendLog(
          JSON.stringify(
            {
              headers: {
                "content-type": "application/json",
                host: window.location.host,
                "user-agent": navigator.userAgent,
              },
              body: { a: 1, b: 2 },
            },
            null,
            2
          )
        );

        if (!enablePayment) {
          // Fails with 402 Payment Required
          setTimeout(() => {
            appendLog(`Response: POST /api/add 402 Payment Required`);
            appendLog(
              JSON.stringify(
                {
                  headers: {
                    "content-type": "application/json",
                    "www-authenticate": `x402 realm="x402-ai-starter", token="USDC", price="0.005", network="base-sepolia", recipient="${SELLER_ADDRESS}"`,
                    "x402-price": "0.005 USDC",
                    "x402-network": "base-sepolia",
                  },
                },
                null,
                2
              )
            );
            appendLog(
              JSON.stringify(
                {
                  error: "Payment Required",
                  code: 402,
                  message: "Missing x402 payment authorization header for protected compute endpoint",
                  price: "$0.005 USDC",
                  recipient: SELLER_ADDRESS,
                  network: "base-sepolia",
                },
                null,
                2
              ),
              "error",
              undefined,
              "Payment Required (HTTP 402): Request halted because payment was disabled."
            );
            setIsJobRunning(false);
          }, 800);
        } else {
          // With payment enabled
          setTimeout(() => {
            appendLog(`Response: POST /api/add 402 Payment Required (Challenge intercepted by x402-fetch)`);
            appendLog(
              `x402 Challenge received: price 0.005 USDC, recipient ${SELLER_ADDRESS}, network base-sepolia`
            );

            setTimeout(() => {
              appendLog(
                `[x402 Client] Requesting signature from Purchaser wallet (${PURCHASER_ADDRESS})...`
              );

              setTimeout(() => {
                const { hash } = recordPayment("Playground Math API (/api/add)", 0.005);
                appendLog(
                  `[Coinbase CDP] Broadcasted transaction to Base Sepolia testnet:\nTxHash: ${hash}`
                );

                setTimeout(() => {
                  appendLog(
                    `[x402 Client] Retrying request with header:\nX-Payment: Bearer x402-sig.${hash.slice(0, 16)}`
                  );

                  setTimeout(() => {
                    appendLog(`Response: POST /api/add 200 OK`);
                    appendLog(
                      JSON.stringify(
                        {
                          status: 200,
                          statusText: "OK",
                          headers: {
                            "content-type": "application/json",
                            "x402-receipt": hash,
                          },
                        },
                        null,
                        2
                      )
                    );

                    const finalResult = {
                      result: 3,
                      paid: true,
                      cost: "0.005 USDC",
                      transactionHash: hash,
                      network: "base-sepolia",
                    };

                    appendLog(
                      `Response Body:\n${JSON.stringify(finalResult, null, 2)}`,
                      "result",
                      finalResult
                    );
                    setIsJobRunning(false);
                  }, 600);
                }, 600);
              }, 700);
            }, 600);
          }, 700);
        }
      }, 500);
    } else if (job === "scrape") {
      // Scrape Job
      setTimeout(() => {
        const isBot = actAsScraper;
        appendLog(`Request: GET /blog`);
        appendLog(
          JSON.stringify(
            {
              headers: {
                host: window.location.host,
                "user-agent": isBot ? "ChatGPT-User/1.0 (+https://openai.com/bot)" : navigator.userAgent,
                accept: "text/html,application/xhtml+xml",
              },
            },
            null,
            2
          )
        );

        if (isBot && !enablePayment) {
          // Bot scraper blocked by 402
          setTimeout(() => {
            appendLog(`Response: GET /blog 402 Payment Required`);
            appendLog(
              JSON.stringify(
                {
                  headers: {
                    "content-type": "application/json",
                    "www-authenticate": `x402 realm="anti-scraper", token="USDC", price="0.001", recipient="${SELLER_ADDRESS}"`,
                    "x-bot-detected": "true",
                  },
                },
                null,
                2
              )
            );
            appendLog(
              JSON.stringify(
                {
                  error: "Payment Required for Automated Scrapers",
                  code: 402,
                  price: "$0.001 USDC",
                  recipient: SELLER_ADDRESS,
                  network: "base-sepolia",
                },
                null,
                2
              ),
              "error",
              undefined,
              "Scraper paywall intercepted bot crawler. Enable payment to allow bot to settle access fee."
            );
            setIsJobRunning(false);
          }, 800);
        } else if (isBot && enablePayment) {
          // Bot scraper with payment
          setTimeout(() => {
            appendLog(`Response: GET /blog 402 Payment Required (Intercepted by agent middleware)`);
            appendLog(`[x402 Client] Detected bot paywall fee: $0.001 USDC on Base Sepolia`);

            setTimeout(() => {
              const { hash } = recordPayment("Blog scraper bot fee (/blog)", 0.001);
              appendLog(`[Coinbase CDP] Signed & settled micropayment tx: ${hash}`);

              setTimeout(() => {
                appendLog(`[x402 Client] Retrying GET /blog with verified micropayment proof...`);

                setTimeout(() => {
                  appendLog(`Response: GET /blog 200 OK (Content rendered for bot agent)`);

                  const scrapedData = {
                    blogTitles: [
                      "Getting Started with Next.js & x402",
                      "Understanding TypeScript & Agentic Commerce",
                      "The Return of HTTP 402 Payment Required",
                    ],
                    scrapedAt: new Date().toISOString(),
                    feePaid: "0.001 USDC",
                    settlementTx: hash,
                  };

                  appendLog(
                    `Extracted Titles via Cheerio Parser:\n${JSON.stringify(scrapedData, null, 2)}`,
                    "result",
                    scrapedData
                  );
                  setIsJobRunning(false);
                }, 600);
              }, 600);
            }, 700);
          }, 700);
        } else {
          // Regular human user - free
          setTimeout(() => {
            appendLog(`Response: GET /blog 200 OK (Human traffic - bypasses paywall)`);
            const scrapedData = {
              blogTitles: [
                "Getting Started with Next.js & x402",
                "Understanding TypeScript & Agentic Commerce",
                "The Return of HTTP 402 Payment Required",
              ],
              isBot: false,
              feePaid: "$0.000 (Free for standard web visitors)",
            };
            appendLog(
              `Response Body:\n${JSON.stringify(scrapedData, null, 2)}`,
              "result",
              scrapedData
            );
            setIsJobRunning(false);
          }, 700);
        }
      }, 500);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Job Playground</h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Test different jobs that use x402 paywalled endpoints and watch real-time server logs with Base Sepolia settlement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left side - Job Form */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-xs">
          <JobForm onSubmit={handleJobSubmit} isSubmitting={isJobRunning} />
        </div>

        {/* Right side - Log Viewer */}
        <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <LogViewer
            isActive={isJobRunning}
            logs={logs}
            onClear={() => setLogs([])}
          />
        </div>
      </div>
    </div>
  );
}
