"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, TriangleAlert, X } from "lucide-react";
import { browserSupabase, coverStoragePath } from "@/lib/supabase";

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
  coverUrl: string | null;
  onDeleted: () => void;
}

export default function DeleteEventButton({ eventId, eventName, coverUrl, onDeleted }: DeleteEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    setDeleting(true);
    setError("");
    try {
      const supabase = browserSupabase();

      const path = coverStoragePath(coverUrl);
      if (path) {
        // Best-effort: an orphaned cover file isn't worth blocking the
        // delete over, so a storage failure here doesn't stop the rest.
        await supabase.storage.from("covers").remove([path]).catch(() => {});
      }

      // check_ins cascades from this row in the database, so this one
      // delete removes every scan record tied to the event too.
      const { error: deleteError } = await supabase.from("events").delete().eq("id", eventId);
      if (deleteError) throw deleteError;

      setOpen(false);
      onDeleted();
    } catch (e: any) {
      setError(e?.message || "Could not delete this event. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-red-400/20 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/50 hover:bg-red-400/10"
      >
        <Trash2 size={13} /> Delete
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setOpen(false)}
          >
            <motion.div
              className="glass-strong w-full max-w-sm rounded-3xl p-6 shadow-premium"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-red-400/15 text-red-300">
                  <TriangleAlert size={20} />
                </div>
                <button onClick={() => !deleting && setOpen(false)} className="text-bone/40 hover:text-bone">
                  <X size={18} />
                </button>
              </div>

              <h2 className="mt-4 text-xl font-medium">Delete &ldquo;{eventName}&rdquo;?</h2>
              <p className="mt-2 text-sm leading-6 text-bone/50">
                This permanently deletes the event, its cover image, its QR pass, and every scan record. This
                cannot be undone.
              </p>

              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-white/12 py-2.5 text-sm hover:border-white/25"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60"
                >
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
