import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import {
  Camera,
  Upload,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FlipHorizontal,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CopyToClipboardButton } from "./copy-to-clipboard";
import { SELLER_ADDRESS, PURCHASER_ADDRESS } from "@/lib/accounts";

export interface QRScannerProps {
  onAddressScanned: (address: string, amount?: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

// Play pleasant confirmation audio chime using Web Audio API
function playScanChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08); // A6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio errors if blocked
  }
}

// Parses string to find Base/EVM addresses and optional amounts
export function parseEthereumQr(raw: string): { address: string; amount?: string } | null {
  const trimmed = raw.trim();

  // Pattern 1: Pure 0x address
  const pureMatch = trimmed.match(/^0x[a-fA-F0-9]{40}$/);
  if (pureMatch) {
    return { address: pureMatch[0] };
  }

  // Pattern 2: URI like ethereum:0x... or base:0x...
  const uriMatch = trimmed.match(/^(?:ethereum|base):([0x[a-fA-F0-9]{40})/i);
  if (uriMatch) {
    const address = uriMatch[1];
    let amount: string | undefined;

    // Check for query parameters like ?value=... or ?amount=...
    const queryIndex = trimmed.indexOf("?");
    if (queryIndex !== -1) {
      const queryString = trimmed.slice(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      const amt = params.get("amount") || params.get("value") || params.get("uint256");
      if (amt) {
        amount = amt;
      }
    }
    return { address, amount };
  }

  // Pattern 3: Address embedded in text or JSON
  const embeddedMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  if (embeddedMatch) {
    return { address: embeddedMatch[0] };
  }

  return null;
}

export function QRScanner({ onAddressScanned, onClose }: QRScannerProps) {
  const [mode, setMode] = useState<"camera" | "upload" | "show_qr" | "demo">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{ address: string; amount?: string } | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [myQrUrl, setMyQrUrl] = useState<string>("");
  const [demoQrUrl, setDemoQrUrl] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle successful scan detection
  const handleScanSuccess = useCallback(
    (raw: string) => {
      const parsed = parseEthereumQr(raw);
      if (parsed) {
        playScanChime();
        setScannedResult(parsed);
        stopCamera();
        onAddressScanned(parsed.address, parsed.amount);
      } else {
        setCameraError(`QR code scanned, but no valid Base address was found: "${raw.slice(0, 30)}..."`);
      }
    },
    [onAddressScanned, stopCamera]
  );

  // Frame scanning loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          handleScanSuccess(code.data);
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleScanSuccess]);

  // Start camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API not supported in this browser. Please use the Upload or Demo mode.");
      setMode("demo");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Switch to image upload or demo presets below."
          : "Unable to access video device. Use image upload or quick demo presets."
      );
    }
  }, [facingMode, scanFrame, stopCamera]);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera]);

  // Generate QR for Seller and Demo
  useEffect(() => {
    QRCode.toDataURL(SELLER_ADDRESS, {
      width: 240,
      margin: 2,
      color: { dark: "#09090b", light: "#ffffff" },
    }).then(setMyQrUrl).catch(console.error);

    QRCode.toDataURL(`ethereum:${SELLER_ADDRESS}?amount=0.005`, {
      width: 240,
      margin: 2,
      color: { dark: "#1e3a8a", light: "#f8fafc" },
    }).then(setDemoQrUrl).catch(console.error);
  }, []);

  // Handle uploaded QR code image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleScanSuccess(code.data);
        } else {
          setCameraError("Could not detect a QR code in this image. Try another image or demo address.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm flex flex-col">
      {/* Header with Mode Tabs */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900">Base Address QR Scanner</h4>
            <p className="text-[11px] text-zinc-500">Scan to initiate an x402 payment on Base Sepolia</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setMode("camera")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              mode === "camera"
                ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Camera className="h-3 w-3" />
            Camera
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              mode === "upload"
                ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
          <button
            onClick={() => setMode("show_qr")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              mode === "show_qr"
                ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <QrCode className="h-3 w-3" />
            Receive
          </button>
          <button
            onClick={() => setMode("demo")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              mode === "demo"
                ? "bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            Demo Presets
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="p-4 bg-zinc-950 flex flex-col items-center justify-center min-h-[300px] relative text-white">
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Mode 1: Active Camera Scanner */}
        {mode === "camera" && (
          <div className="relative w-full max-w-sm aspect-4/3 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800">
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                <p className="text-xs text-zinc-300 leading-relaxed">{cameraError}</p>
                <div className="flex gap-2 justify-center pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMode("demo")}
                    className="text-xs bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                  >
                    Use Demo Presets
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMode("upload")}
                    className="text-xs bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                  >
                    Upload QR Image
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />

                {/* Viewfinder Overlays */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-cyan-300 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-cyan-300 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-cyan-300 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-cyan-300 rounded-br" />

                    {/* Animated laser scan line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#38bdf8]" />
                  </div>
                </div>

                {/* Camera control button */}
                <button
                  onClick={() =>
                    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                  }
                  className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-zinc-700 transition-colors cursor-pointer"
                  title="Flip camera"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </button>

                <div className="absolute top-3 inset-x-0 flex justify-center">
                  <span className="bg-black/70 backdrop-blur-xs text-[11px] font-mono text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">
                    Align Base QR within frame
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mode 2: Image File Upload */}
        {mode === "upload" && (
          <div className="w-full max-w-sm p-6 text-center space-y-4">
            <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-2xl p-8 flex flex-col items-center justify-center transition-colors bg-zinc-900/60">
              <Upload className="h-10 w-10 text-zinc-400 mb-3" />
              <p className="text-sm font-medium text-zinc-200">Upload QR Code Image</p>
              <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP, or screenshots</p>
              <label className="mt-4 cursor-pointer">
                <span className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-block">
                  Select File
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {cameraError && (
              <p className="text-xs text-amber-400 font-mono">{cameraError}</p>
            )}
          </div>
        )}

        {/* Mode 3: Display My Address QR (Receive) */}
        {mode === "show_qr" && (
          <div className="w-full max-w-sm p-4 text-center space-y-3 bg-white text-zinc-900 rounded-xl my-2">
            <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-800">
              Seller Recipient Address • Base Sepolia
            </Badge>
            {myQrUrl ? (
              <div className="p-3 bg-white rounded-xl inline-block border border-zinc-200 shadow-xs">
                <img src={myQrUrl} alt="Seller Address QR Code" className="w-48 h-48 mx-auto" />
              </div>
            ) : (
              <div className="w-48 h-48 animate-pulse bg-zinc-100 rounded-xl mx-auto" />
            )}
            <div className="text-left space-y-1 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Address:</span>
              <div className="flex items-center gap-1 font-mono text-xs text-zinc-800">
                <span className="truncate">{SELLER_ADDRESS}</span>
                <CopyToClipboardButton content={SELLER_ADDRESS} />
              </div>
            </div>
          </div>
        )}

        {/* Mode 4: Demo Presets */}
        {mode === "demo" && (
          <div className="w-full max-w-md p-4 text-center space-y-4">
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-zinc-100 flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Quick Test Addresses & QR Codes
              </h5>
              <p className="text-xs text-zinc-400">
                Click any preset below to simulate scanning a Base Sepolia recipient address.
              </p>
            </div>

            <div className="space-y-2.5 text-left">
              {/* Preset 1: Seller API Host */}
              <button
                onClick={() => handleScanSuccess(`ethereum:${SELLER_ADDRESS}?amount=0.005`)}
                className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">Seller (API Host)</span>
                    <Badge variant="outline" className="bg-amber-950/60 border-amber-600 text-amber-300 text-[10px]">
                      0.005 USDC
                    </Badge>
                  </div>
                  <div className="font-mono text-zinc-400 text-[11px] truncate">
                    {SELLER_ADDRESS}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>Select</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Preset 2: Random Agent Node */}
              <button
                onClick={() =>
                  handleScanSuccess("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")
                }
                className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">Remote MCP Agent Node</span>
                    <Badge variant="outline" className="bg-blue-950/60 border-blue-600 text-blue-300 text-[10px]">
                      0.001 USDC
                    </Badge>
                  </div>
                  <div className="font-mono text-zinc-400 text-[11px] truncate">
                    0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
                  </div>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>Select</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Preset 3: Purchaser Self */}
              <button
                onClick={() => handleScanSuccess(PURCHASER_ADDRESS)}
                className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <span className="font-bold text-white">Purchaser Wallet (Self)</span>
                  <div className="font-mono text-zinc-400 text-[11px] truncate">
                    {PURCHASER_ADDRESS}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>Select</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Scanned Address Confirmation Banner */}
      {scannedResult && (
        <div className="p-4 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-emerald-950">Scanned Base Address: </span>
              <span className="font-mono text-emerald-800">{scannedResult.address}</span>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white shrink-0">Valid Base Address</Badge>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
