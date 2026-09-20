"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, PartyPopper, RotateCcw, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { playVerifiedChime, playDeniedBuzz } from "@/lib/sound";

type ScanResult = { result: "VERIFIED" | "ALREADY_USED" | "DENIED"; event_name?: string; serial_number?: number };

function celebrate() {
  const end = Date.now() + 900;
  const colors = ["#e0b96a", "#f3e2b6", "#ffffff"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 90, spread: 100, origin: { y: 0.5 }, colors, startVelocity: 45 });
}

export default function Scanner() {
  const scannerRef = useRef<any>(null);
  // Ref (not state) so the qr.start() success callback — created once and
  // never re-created — always sees the latest value instead of a stale
  // closure over the value from when start() was first called.
  const processingRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [running, setRunning] = useState(false);

  async function stopScanner() {
    const qr = scannerRef.current;
    if (!qr) return;
    try {
      if (qr.getState && qr.getState() === 2 /* SCANNING */) {
        await qr.stop();
      }
      qr.clear();
    } catch {
      // Scanner was already stopped or torn down — safe to ignore.
    }
  }

  async function start() {
    setResult(null);
    setCameraError("");
    processingRef.current = false;

    await stopScanner();

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qr = new Html5Qrcode("reader");
      scannerRef.current = qr;
      setRunning(true);

      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (text: string) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            const res = await fetch("/api/checkin", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ code: text })
            });
            const data: ScanResult = await res.json();
            setResult(data);
            if (data.result === "VERIFIED") {
              playVerifiedChime();
              celebrate();
            } else {
              playDeniedBuzz();
              if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
            }
          } catch {
            setResult({ result: "DENIED" });
          } finally {
            await stopScanner();
            setRunning(false);
          }
        },
        () => {
          // Per-frame "no QR code found" callback — expected constantly
          // while the camera is pointed away from a code, not an error.
        }
      );
    } catch (err: any) {
      setRunning(false);
      setCameraError(err?.message || "Could not access the camera. Check permissions and try again.");
    }
  }

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <div id="reader" className="min-h-[320px] overflow-hidden rounded-3xl bg-black" />

      {cameraError && (
        <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
          {cameraError}
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.result}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: result.result === "DENIED" ? [0, -10, 10, -8, 8, 0] : 0
            }}
            transition={{ duration: 0.4 }}
            className={`mt-4 rounded-3xl border p-8 text-center ${
              result.result === "VERIFIED"
                ? "border-emerald-400/30 bg-emerald-400/10"
                : result.result === "ALREADY_USED"
                  ? "border-amber-400/30 bg-amber-400/10"
                  : "border-red-400/30 bg-red-400/10"
            }`}
          >
            {result.result === "VERIFIED" ? (
              <PartyPopper className="mx-auto text-emerald-300" size={44} />
            ) : (
              <XCircle className={`mx-auto ${result.result === "ALREADY_USED" ? "text-amber-300" : "text-red-300"}`} size={44} />
            )}
            <h2 className="mt-3 text-3xl font-medium">
              {result.result === "VERIFIED" ? "Verified! 🎉" : result.result === "ALREADY_USED" ? "Already used" : "Denied"}
            </h2>
            <p className="mt-2 text-bone/55">
              {result.result === "DENIED"
                ? "This code isn't valid for any live event."
                : `${result.event_name}${result.serial_number ? ` · Pass #${result.serial_number}` : ""}`}
            </p>
            <Button onClick={start} className="mt-7" icon={<RotateCcw size={16} />}>
              Scan next
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !running && (
        <Button onClick={start} size="lg" className="mt-5 w-full" icon={<Camera size={18} />}>
          Start scanner
        </Button>
      )}
    </div>
  );
}
