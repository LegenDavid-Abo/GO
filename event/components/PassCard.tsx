"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Send, Download } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import { qrDataUrl } from "@/lib/qr";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface Pass {
  id: string;
  serial_number: number;
  access_code: string;
  status: "UNUSED" | "SHARED" | "USED";
}

interface PassCardProps {
  pass: Pass;
  eventSlug: string;
  padWidth: number;
  onChange: (passId: string, patch: Partial<Pass>) => void;
}

const statusStyles = {
  UNUSED: "border-white/10",
  SHARED: "border-brass-400/40 shadow-glow",
  USED: "border-emerald-400/50 shadow-[0_0_0_1px_rgba(52,211,153,.25),0_18px_50px_-25px_rgba(52,211,153,.4)]"
};

export default function PassCard({ pass, eventSlug, padWidth, onChange }: PassCardProps) {
  const [qr, setQr] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const label = `#${String(pass.serial_number).padStart(padWidth, "0")}`;
  const passUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pass/${pass.access_code}`;
  const fileName = `${eventSlug}-pass-${label}.png`;

  useEffect(() => {
    qrDataUrl(passUrl).then(setQr);
  }, [passUrl]);

  function maybeAskToMarkShared() {
    if (pass.status === "UNUSED") setConfirmOpen(true);
  }

  async function confirmShared() {
    const { error } = await browserSupabase()
      .from("event_passes")
      .update({ status: "SHARED", shared_at: new Date().toISOString() })
      .eq("id", pass.id);
    if (!error) onChange(pass.id, { status: "SHARED" });
    setConfirmOpen(false);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        if (qr && navigator.canShare) {
          const blob = await (await fetch(qr)).blob();
          const file = new File([blob], fileName, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Pass ${label}`, url: passUrl });
            maybeAskToMarkShared();
            return;
          }
        }
        await navigator.share({ title: `Pass ${label}`, url: passUrl });
        maybeAskToMarkShared();
        return;
      } catch {
        // User cancelled the native share sheet — nothing to confirm.
        return;
      }
    }
    await navigator.clipboard.writeText(passUrl);
    maybeAskToMarkShared();
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const {
        data: { session }
      } = await browserSupabase().auth.getSession();
      const res = await fetch(`/api/passes/${pass.id}/regenerate`, {
        method: "POST",
        headers: { authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (res.ok) onChange(pass.id, { access_code: data.access_code, status: "UNUSED" });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className={`glass rounded-2xl border p-4 text-center ${statusStyles[pass.status]}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-bone/45">{label}</span>
        {pass.status === "USED" && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-300">
            <CheckCircle2 size={12} /> Checked in
          </span>
        )}
        {pass.status === "SHARED" && <span className="text-xs font-medium text-brass-300">Shared</span>}
      </div>

      <div className="mx-auto my-3 w-fit rounded-xl bg-white p-2">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR ${label}`} className="h-28 w-28" />
        ) : (
          <div className="h-28 w-28 animate-pulse rounded-lg bg-ink-800/10" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <a
          href={qr}
          download={fileName}
          onClick={maybeAskToMarkShared}
          className="flex items-center justify-center gap-1 rounded-lg border border-white/12 py-2 text-xs hover:border-white/25"
        >
          <Download size={12} /> Save
        </a>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1 rounded-lg border border-white/12 py-2 text-xs hover:border-white/25"
        >
          <Send size={12} /> Share
        </button>
      </div>

      {pass.status !== "USED" && (
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] text-bone/30 hover:text-bone/55"
        >
          <RefreshCw size={10} className={regenerating ? "animate-spin" : ""} /> Regenerate
        </button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Mark Pass ${label} as shared?`}
        description="This just helps you track who you've already sent a code to — it doesn't affect scanning."
        onConfirm={confirmShared}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
