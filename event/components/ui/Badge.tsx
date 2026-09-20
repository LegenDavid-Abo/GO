import { ReactNode } from "react";

type Tone = "neutral" | "brass" | "success";

const tones: Record<Tone, string> = {
  neutral: "border-white/12 bg-white/[.04] text-bone/60",
  brass: "border-brass-500/30 bg-brass-500/10 text-brass-300",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
};

export default function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
