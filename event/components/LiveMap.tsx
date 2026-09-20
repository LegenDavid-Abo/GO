import { Navigation } from "lucide-react";

interface LiveMapProps {
  address: string;
  venueName?: string;
  className?: string;
  height?: number;
}

/**
 * Renders a live, interactive Google Map (pan/zoom/street view) for the given
 * address using Google's key-less embed endpoint — no Maps API key required.
 * Falls back to a quiet placeholder until an address has been entered.
 */
export default function LiveMap({ address, venueName, className = "", height = 320 }: LiveMapProps) {
  const query = [venueName, address].filter(Boolean).join(", ").trim();

  if (!query) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-dashed border-white/12 bg-white/[.02] text-center text-sm text-bone/35 ${className}`}
        style={{ height }}
      >
        Add a venue address to preview the live map
      </div>
    );
  }

  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      <iframe
        src={src}
        width="100%"
        height={height}
        style={{ border: 0, filter: "grayscale(0.2) invert(0.92) contrast(0.9)" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Live map for ${query}`}
      />
      <a
        href={directionsHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 border-t border-white/10 bg-ink-900 py-3 text-xs font-semibold tracking-wide text-brass-300 hover:text-brass-200"
      >
        <Navigation size={13} /> Get directions
      </a>
    </div>
  );
}
