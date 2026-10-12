import React, { useState, useEffect } from "react";
import {
  Wallet,
  Coins,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Send,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CopyToClipboardButton } from "./copy-to-clipboard";
import { QRScanner } from "./qr-scanner";
import {
  getSolanaState,
  requestSolanaAirdrop,
  executeSolanaPayment,
  getSolanaExplorerUrl,
  connectBrowserSolanaWallet,
  SolanaSystemState,
} from "@/lib/solana-wallet";

export function WalletPage() {
  const [state, setState] = useState<SolanaSystemState>(getSolanaState());
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Send transfer state
  const [showScanner, setShowScanner] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.05");
  const [purpose, setPurpose] = useState("Direct Solana x402 Micropayment");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessSig, setSendSuccessSig] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getSolanaState());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAirdrop = async () => {
    setFaucetLoading(true);
    setWalletError(null);
    const res = await requestSolanaAirdrop(state.agentWallet.address, 1.0);
    if (res.success) {
      setFaucetSuccess(true);
      setState(getSolanaState());
      setTimeout(() => setFaucetSuccess(false), 3000);
    } else {
      setWalletError(res.error || "Airdrop request failed");
    }
    setFaucetLoading(false);
  };

  const handleConnectPhantom = async () => {
    setConnectingWallet(true);
    setWalletError(null);
    const res = await connectBrowserSolanaWallet();
    if (!res.success) {
      setWalletError(res.error || "Could not connect Solana wallet");
    } else {
      setState(getSolanaState());
    }
    setConnectingWallet(false);
  };

  const handleSendTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      setSendError("Please specify a recipient Solana address.");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setSendError("Please enter a valid SOL amount.");
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccessSig(null);

    try {
      const res = await executeSolanaPayment({
        toAddress: recipient.trim(),
        amountSOL: amt,
        purpose: purpose || "Direct Solana Transfer",
      });
      setSendSuccessSig(res.signature);
      setState(getSolanaState());
    } catch (err: any) {
      setSendError(err.message || "Failed to broadcast transaction");
    } finally {
      setIsSending(false);
    }
  };

  const handleAddressScanned = (addr: string, amt?: string) => {
    setRecipient(addr);
    if (amt) setAmount(amt);
    setShowScanner(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Wallet Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#14f195]" />
            <h2 className="text-2xl font-extrabold text-white">Solana Autonomous Wallet</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-managed autonomous agent keypair and connected Web3 browser wallets on Solana Devnet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleConnectPhantom}
            disabled={connectingWallet}
            variant="outline"
            className="border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 text-xs h-9 px-4 rounded-xl cursor-pointer gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            {state.externalWalletConnected ? (
              <span className="font-mono">
                Phantom: {state.externalWalletAddress?.slice(0, 4)}...{state.externalWalletAddress?.slice(-4)}
              </span>
            ) : connectingWallet ? (
              "Connecting..."
            ) : (
              "Connect Phantom / Solflare"
            )}
          </Button>

          <Button
            onClick={handleAirdrop}
            disabled={faucetLoading}
            className="bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer gap-1.5"
          >
            {faucetLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Requesting Airdrop...
              </>
            ) : faucetSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                +1.0 SOL Airdropped!
              </>
            ) : (
              <>
                <Coins className="h-3.5 w-3.5" />
                Devnet Faucet (+1.0 SOL)
              </>
            )}
          </Button>
        </div>
      </div>

      {walletError && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{walletError}</span>
        </div>
      )}

      {/* Wallets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Agent Wallet Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-400 uppercase tracking-wider font-mono">
              Agent Autonomous Keypair (Payer)
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
              Solana Devnet
            </Badge>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {state.agentWallet.solBalance.toFixed(4)}{" "}
              <span className="text-sm font-normal text-emerald-400">SOL</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ${state.agentWallet.usdcBalance.toFixed(2)} USDC (SPL Token)
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Public Address</div>
            <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              <span className="truncate">{state.agentWallet.address}</span>
              <CopyToClipboardButton content={state.agentWallet.address} />
            </div>
          </div>
        </div>

        {/* Provider Recipient Wallet Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#00d2ff] uppercase tracking-wider font-mono">
              Provider Treasury (API Host)
            </span>
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]">
              Recipient
            </Badge>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {state.providerWallet.solBalance.toFixed(4)}{" "}
              <span className="text-sm font-normal text-[#00d2ff]">SOL</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ${state.providerWallet.usdcBalance.toFixed(2)} USDC (Settled Revenue)
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Public Address</div>
            <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              <span className="truncate">{state.providerWallet.address}</span>
              <CopyToClipboardButton content={state.providerWallet.address} />
            </div>
          </div>
        </div>
      </div>

      {/* Direct Payment & QR Scanner Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-[#14f195]" />
            <h3 className="font-bold text-white text-sm">
              Direct Solana x402 Micropayment Transfer
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScanner(!showScanner)}
            className="border-slate-700 bg-slate-800 text-slate-300 text-xs h-8 cursor-pointer gap-1.5"
          >
            <QrCode className="h-3.5 w-3.5 text-cyan-400" />
            {showScanner ? "Close Scanner" : "Scan QR Address"}
          </Button>
        </div>

        {showScanner && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <QRScanner
              onAddressScanned={handleAddressScanned}
              onClose={() => setShowScanner(false)}
            />
          </div>
        )}

        <form onSubmit={handleSendTransfer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Recipient Solana Address</label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Paste Solana base58 address or scan QR..."
                className="bg-slate-950 border-slate-800 font-mono text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Amount (SOL)</label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-950 border-slate-800 font-mono text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400">Payment Memo</label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          {sendError && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {sendSuccessSig && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Transaction Confirmed on Solana Devnet!</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] pt-1">
                <span className="text-slate-400">Sig:</span>
                <a
                  href={getSolanaExplorerUrl(sendSuccessSig)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{sendSuccessSig}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSending || !recipient.trim()}
            className="w-full bg-[#14f195] hover:bg-[#00f5a0] text-slate-950 font-bold text-xs h-10 rounded-xl cursor-pointer"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Signing & Broadcasting on Solana Devnet...
              </span>
            ) : (
              `Send ${amount} SOL via Agent Keypair`
            )}
          </Button>
        </form>
      </div>

      {/* Transaction History Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#00d2ff]" />
            <h3 className="font-bold text-white text-sm">Solana Transaction History</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {state.transactions.length} Records
          </span>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {state.transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <span>{tx.purpose}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                      {tx.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm text-[#14f195]">
                    {tx.amountSOL > 0 ? `-${tx.amountSOL} SOL` : "0 SOL"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/50 text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-600">Sig:</span>
                  <a
                    href={getSolanaExplorerUrl(tx.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-0.5 truncate"
                  >
                    <span>{tx.signature.slice(0, 14)}...{tx.signature.slice(-8)}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                {tx.slot && <span>Slot #{tx.slot}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
