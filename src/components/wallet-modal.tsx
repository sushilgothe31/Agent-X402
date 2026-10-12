import React, { useState, useEffect } from "react";
import {
  Wallet,
  X,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Coins,
  ShieldCheck,
  Check,
  Code,
  QrCode,
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CopyToClipboardButton } from "./copy-to-clipboard";
import { TransactionHistory } from "./transaction-history";
import { QRScanner } from "./qr-scanner";
import {
  getSystemWallets,
  requestFaucetFunds,
  recordPayment,
  SystemWallets,
} from "@/lib/accounts";

export function WalletModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [wallets, setWallets] = useState<SystemWallets>(getSystemWallets());
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // QR Scanning & Direct Payment States
  const [showScanner, setShowScanner] = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("0.005");
  const [paymentPurpose, setPaymentPurpose] = useState<string>("x402 Scanned Payment");
  const [isSendingPayment, setIsSendingPayment] = useState(false);
  const [paymentSuccessTx, setPaymentSuccessTx] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWallets(getSystemWallets());
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [isOpen]);

  const handleFaucet = () => {
    setFaucetLoading(true);
    setTimeout(() => {
      const updated = requestFaucetFunds();
      setWallets(updated);
      setRefreshTrigger((prev) => prev + 1);
      setFaucetLoading(false);
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 3000);
    }, 1200);
  };

  const handleAddressScanned = (address: string, amount?: string) => {
    setPaymentRecipient(address);
    if (amount) {
      setPaymentAmount(amount);
    }
    setPaymentError(null);
    setPaymentSuccessTx(null);
    // keep scanner open or transition to confirm
  };

  const handleSendPayment = () => {
    if (!paymentRecipient) {
      setPaymentError("Please scan or enter a valid recipient address.");
      return;
    }
    const amtNum = parseFloat(paymentAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setPaymentError("Please enter a valid payment amount.");
      return;
    }
    if (amtNum > wallets.purchaser.usdcBalance) {
      setPaymentError(`Insufficient USDC balance ($${wallets.purchaser.usdcBalance.toFixed(3)} available).`);
      return;
    }

    setIsSendingPayment(true);
    setPaymentError(null);

    setTimeout(() => {
      const { hash } = recordPayment(
        paymentPurpose || `Direct payment to ${paymentRecipient.slice(0, 8)}...`,
        amtNum
      );
      setWallets(getSystemWallets());
      setPaymentSuccessTx(hash);
      setRefreshTrigger((prev) => prev + 1);
      setIsSendingPayment(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                Coinbase CDP & x402 Wallets
              </h2>
              <p className="text-xs text-zinc-500">
                Server-managed EVM wallets running on <strong>Base Sepolia Testnet</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showScanner ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowScanner(!showScanner);
                setPaymentSuccessTx(null);
                setPaymentError(null);
              }}
              className="text-xs gap-1.5 h-8 cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showScanner ? "Hide Scanner" : "Scan QR to Pay"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-8 w-8 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Scanner & Direct Payment Section */}
          {showScanner && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <QRScanner
                onAddressScanned={handleAddressScanned}
                onClose={() => setShowScanner(false)}
              />

              {/* Payment Confirmation Form */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Send className="h-4 w-4 text-blue-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                      Send x402 Payment via Scanned Address
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Base Sepolia
                  </Badge>
                </div>

                {/* Recipient Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600">
                    Recipient Base Address
                  </label>
                  <Input
                    value={paymentRecipient}
                    onChange={(e) => {
                      setPaymentRecipient(e.target.value);
                      setPaymentError(null);
                    }}
                    placeholder="0x... (scan a QR code or paste address)"
                    className="font-mono text-xs bg-white"
                  />
                </div>

                {/* Amount with Quick Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-zinc-600">
                      Amount (USDC)
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Available: ${wallets.purchaser.usdcBalance.toFixed(3)} USDC
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="font-mono text-xs bg-white w-32"
                    />
                    <div className="flex flex-wrap items-center gap-1 flex-1">
                      {["0.001", "0.005", "0.01", "0.05", "0.10"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPaymentAmount(preset)}
                          className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                            paymentAmount === preset
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Purpose Memo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600">
                    Payment Memo / Purpose
                  </label>
                  <Input
                    value={paymentPurpose}
                    onChange={(e) => setPaymentPurpose(e.target.value)}
                    placeholder="x402 Micropayment memo..."
                    className="text-xs bg-white"
                  />
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Success Card */}
                {paymentSuccessTx && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Payment Successfully Broadcast to Base Sepolia!</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono">
                      <span className="text-zinc-500">Tx:</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${paymentSuccessTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-0.5 truncate"
                      >
                        <span className="truncate">{paymentSuccessTx}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <CopyToClipboardButton content={paymentSuccessTx} />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleSendPayment}
                  disabled={isSendingPayment || !paymentRecipient}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold cursor-pointer"
                >
                  {isSendingPayment ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Signing & Broadcasting to Base Sepolia...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Send ${paymentAmount} USDC to Scanned Address
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Wallets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchaser Wallet */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Purchaser (AI Agent)
                </span>
                <Badge variant="outline" className="bg-blue-100/80 border-blue-300 text-blue-800 text-[10px]">
                  Payer
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-blue-950 font-mono">
                  ${wallets.purchaser.usdcBalance.toFixed(3)}{" "}
                  <span className="text-xs font-normal text-blue-700">USDC</span>
                </div>
                <div className="text-[11px] text-blue-600 font-mono mt-0.5">
                  {wallets.purchaser.ethBalance} ETH (gas)
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200/60">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Address</div>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-zinc-800">
                  <span className="truncate">{wallets.purchaser.address}</span>
                  <CopyToClipboardButton content={wallets.purchaser.address} />
                </div>
              </div>
            </div>

            {/* Seller Wallet */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Seller (API / MCP Host)
                </span>
                <Badge variant="outline" className="bg-emerald-100/80 border-emerald-300 text-emerald-800 text-[10px]">
                  Recipient
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-950 font-mono">
                  ${wallets.seller.usdcBalance.toFixed(3)}{" "}
                  <span className="text-xs font-normal text-emerald-700">USDC</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-mono mt-0.5">
                  {wallets.seller.ethBalance} ETH (gas)
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-200/60">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Address</div>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-zinc-800">
                  <span className="truncate">{wallets.seller.address}</span>
                  <CopyToClipboardButton content={wallets.seller.address} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-zinc-900">
                Testnet Faucet & Payment Actions
              </div>
              <div className="text-[11px] text-zinc-500">
                Dispense $5.00 USDC or scan a Base address QR code to send micropayments.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowScanner(!showScanner)}
                variant="outline"
                size="sm"
                className="bg-white border-zinc-300 text-xs font-medium cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                {showScanner ? "Close Scanner" : "Scan QR Code"}
              </Button>
              <Button
                onClick={handleFaucet}
                disabled={faucetLoading}
                variant="outline"
                size="sm"
                className="bg-white border-zinc-300 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
              >
                {faucetLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5 text-zinc-600" />
                    Requesting...
                  </>
                ) : faucetSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                    +$5.00 Dispensed!
                  </>
                ) : (
                  <>
                    <Coins className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                    Request Faucet USDC
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* x402 Flow Diagram */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wide">
              <Code className="h-3.5 w-3.5 text-zinc-500" />
              How x402 Micropayments Work
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-lg bg-zinc-100 border border-zinc-200">
                <div className="font-bold text-zinc-900">1. Client Request</div>
                <div className="text-zinc-500 mt-1">Normal GET / POST call to API</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <div className="font-bold">2. HTTP 402</div>
                <div className="text-amber-700 mt-1">Returns price & recipient address</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                <div className="font-bold">3. Auto Sign & Pay</div>
                <div className="text-blue-700 mt-1">CDP wallet settles on Base Sepolia</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="font-bold">4. 200 OK Response</div>
                <div className="text-emerald-700 mt-1">Protected data returned to agent</div>
              </div>
            </div>
          </div>

          {/* Recent Payments History Component */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white">
            <TransactionHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Powered by Coinbase Developer Platform (CDP) & x402
          </span>
          <Button onClick={onClose} size="sm" variant="outline" className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

