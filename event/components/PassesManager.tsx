"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Plus, Send } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import { qrDataUrl } from "@/lib/qr";
import PassCard, { Pass } from "@/components/PassCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

const PAGE_SIZE = 10;

export default function PassesManager({
  eventId,
  eventName,
  eventSlug
}: {
  eventId: string;
  eventName: string;
  eventSlug: string;
}) {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [bulkBusy, setBulkBusy] = useState<"download" | "share" | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [addCount, setAddCount] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data } = await browserSupabase()
      .from("event_passes")
      .select("id, serial_number, access_code, status")
      .eq("event_id", eventId)
      .order("serial_number");
    setPasses(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // Keeps the grid in sync when a pass is scanned from a different device
  // (the scanner on a phone at the door, this page open on a laptop).
  useEffect(() => {
    const channel = browserSupabase()
      .channel(`event_passes:${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_passes", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as Pass;
          setPasses((prev) => prev.map((p) => (p.id === row.id ? { ...p, ...row } : p)));
        }
      )
      .subscribe();
    return () => {
      browserSupabase().removeChannel(channel);
    };
  }, [eventId]);

  function updateLocal(passId: string, patch: Partial<Pass>) {
    setPasses((prev) => prev.map((p) => (p.id === passId ? { ...p, ...patch } : p)));
  }

  const totalPages = Math.max(1, Math.ceil(passes.length / PAGE_SIZE));
  const page_ = Math.min(page, totalPages);
  const visible = passes.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE);
  const padWidth = String(passes.length).length || 1;

  const summary = useMemo(() => {
    const used = passes.filter((p) => p.status === "USED").length;
    const shared = passes.filter((p) => p.status === "SHARED").length;
    return { used, shared, total: passes.length };
  }, [passes]);

  async function buildZip() {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const pass of passes) {
      const label = String(pass.serial_number).padStart(padWidth, "0");
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/pass/${pass.access_code}`;
      const dataUrl = await qrDataUrl(url);
      zip.file(`${eventSlug}-pass-${label}.png`, dataUrl.split(",")[1], { base64: true });
    }
    return zip.generateAsync({ type: "blob" });
  }

  async function downloadAll() {
    setBulkBusy("download");
    try {
      const blob = await buildZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${eventSlug}-passes.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setConfirmBulk(true);
    } finally {
      setBulkBusy(null);
    }
  }

  async function shareAll() {
    setBulkBusy("share");
    try {
      if (navigator.share && navigator.canShare) {
        const blob = await buildZip();
        const file = new File([blob], `${eventSlug}-passes.zip`, { type: "application/zip" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${eventName} — QR passes` });
            setConfirmBulk(true);
            return;
          } catch {
            return; // user cancelled — nothing to confirm
          }
        }
      }
      await downloadAll();
    } finally {
      setBulkBusy(null);
    }
  }

  async function confirmMarkAllShared() {
    const { error } = await browserSupabase()
      .from("event_passes")
      .update({ status: "SHARED", shared_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("status", "UNUSED");
    if (!error) {
      setPasses((prev) => prev.map((p) => (p.status === "UNUSED" ? { ...p, status: "SHARED" } : p)));
    }
    setConfirmBulk(false);
  }

  async function addMore(e: React.FormEvent) {
    e.preventDefault();
    const count = Number(addCount);
    if (!count || count < 1) return;
    setAdding(true);
    try {
      const {
        data: { session }
      } = await browserSupabase().auth.getSession();
      const res = await fetch(`/api/events/${eventId}/passes`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ count })
      });
      if (res.ok) {
        setAddCount("");
        await load();
      }
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-bone/40">
        <Loader2 className="animate-spin" size={18} /> Loading passes…
      </div>
    );
  }

  return (
    <div>
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div className="text-sm text-bone/50">
          <b className="text-bone">{summary.total}</b> passes ·{" "}
          <span className="text-brass-300">{summary.shared} shared</span> ·{" "}
          <span className="text-emerald-300">{summary.used} checked in</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" icon={<Download size={14} />} loading={bulkBusy === "download"} onClick={downloadAll}>
            Download all
          </Button>
          <Button size="md" icon={<Send size={14} />} loading={bulkBusy === "share"} onClick={shareAll}>
            Share all
          </Button>
        </div>
      </div>

      {passes.length > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page_ === 1}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/12 hover:border-white/25 disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm text-bone/50">
            Page {page_} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page_ === totalPages}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/12 hover:border-white/25 disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((pass) => (
          <PassCard key={pass.id} pass={pass} eventSlug={eventSlug} padWidth={padWidth} onChange={updateLocal} />
        ))}
      </div>

      {passes.length > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page_ === 1}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/12 hover:border-white/25 disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm text-bone/50">
            Page {page_} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page_ === totalPages}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/12 hover:border-white/25 disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      <form onSubmit={addMore} className="glass mt-8 flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <div className="w-32">
          <TextField
            label="Add more passes"
            type="number"
            min={1}
            max={2000}
            value={addCount}
            onChange={(e) => setAddCount(e.target.value)}
            placeholder="e.g. 20"
          />
        </div>
        <Button type="submit" variant="outline" loading={adding} icon={<Plus size={14} />}>
          Generate
        </Button>
      </form>

      <ConfirmDialog
        open={confirmBulk}
        title="Mark all remaining passes as shared?"
        description="Every pass that's still unused will be labeled 'shared'. Already-shared or checked-in passes are left as they are."
        onConfirm={confirmMarkAllShared}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
