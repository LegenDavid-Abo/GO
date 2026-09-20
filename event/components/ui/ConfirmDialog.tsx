"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "brass" | "red";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Yes",
  cancelLabel = "No",
  tone = "brass",
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            className="glass-strong w-full max-w-sm rounded-3xl p-6 shadow-premium"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div
                className={`grid h-11 w-11 place-items-center rounded-full ${
                  tone === "red" ? "bg-red-400/15 text-red-300" : "bg-brass-500/15 text-brass-300"
                }`}
              >
                <HelpCircle size={20} />
              </div>
              <button onClick={() => !busy && onCancel()} className="text-bone/40 hover:text-bone">
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-4 text-xl font-medium">{title}</h2>
            {description && <p className="mt-2 text-sm leading-6 text-bone/50">{description}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                disabled={busy}
                className="flex-1 rounded-xl border border-white/12 py-2.5 text-sm hover:border-white/25"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
                  tone === "red" ? "bg-red-500 text-white hover:bg-red-400" : "bg-brass-gradient text-ink-950"
                } disabled:opacity-60`}
              >
                {busy ? "…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
