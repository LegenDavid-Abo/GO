"use client";

import { useEffect, useState } from "react";

const units: Array<[key: "d" | "h" | "m" | "s", label: string]> = [
  ["d", "Days"],
  ["h", "Hours"],
  ["m", "Min"],
  ["s", "Sec"]
];

export default function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);
  const targetMs = new Date(target).getTime();
  const validTarget = !Number.isNaN(targetMs);

  useEffect(() => {
    if (!validTarget) return;
    const tick = () => setLeft(Math.max(0, targetMs - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetMs, validTarget]);

  if (!validTarget || left === null) return null;

  if (left === 0) {
    return (
      <div className="glass inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-brass-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brass-400" /> Happening now
      </div>
    );
  }

  const totalSeconds = Math.floor(left / 1000);
  const values: Record<string, number> = {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {units.map(([key, label]) => (
        <div key={key} className="glass rounded-2xl p-4 text-center">
          <div className="text-2xl font-medium tabular-nums text-brass-300 sm:text-4xl">
            {String(values[key]).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] tracking-[.2em] text-bone/40">{label}</div>
        </div>
      ))}
    </div>
  );
}
