import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, TriangleAlert } from "lucide-react";
import { adminSupabase } from "@/lib/supabase";
import { qrDataUrl } from "@/lib/qr";
import Countdown from "@/components/Countdown";
import LiveMap from "@/components/LiveMap";

export default async function PassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = adminSupabase();

  const { data: pass } = await db
    .from("event_passes")
    .select("status, serial_number, events(*)")
    .eq("access_code", code)
    .maybeSingle();

  const event = pass?.events as any;
  if (!pass || !event || !event.is_published) notFound();

  const start = `${event.event_date}T${event.start_time}`;
  const hasLocation = Boolean(event.venue_name || event.venue_address);
  const qr = await qrDataUrl(`${process.env.NEXT_PUBLIC_APP_URL}/pass/${code}`);

  return (
    <main className="min-h-screen">
      <header className="relative min-h-[55vh] overflow-hidden">
        {event.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_url} className="absolute inset-0 h-full w-full object-cover opacity-50" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-black/20" />
        <div className="relative mx-auto flex min-h-[55vh] max-w-3xl flex-col justify-end px-6 py-14 text-center sm:items-center">
          <Link href="/" className="absolute left-6 top-8 flex items-center gap-2 text-sm text-bone/60">
            <ArrowLeft size={16} /> Evently
          </Link>
          <p className="text-xs font-medium tracking-[.25em] text-brass-400/80">YOU'RE INVITED</p>
          <h1 className="mt-3 text-5xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-6xl">{event.name}</h1>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-14 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <span className="glass rounded-full px-4 py-2">
            <CalendarDays className="mr-2 inline" size={15} />
            {event.event_date}
          </span>
          <span className="glass rounded-full px-4 py-2">
            <Clock className="mr-2 inline" size={15} />
            {event.start_time}
          </span>
          {hasLocation && (
            <span className="glass rounded-full px-4 py-2">
              <MapPin className="mr-2 inline" size={15} />
              {event.venue_name || event.venue_address}
            </span>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Countdown target={start} />
        </div>

        {event.description && (
          <p className="mx-auto mt-10 max-w-lg whitespace-pre-wrap leading-8 text-bone/55">{event.description}</p>
        )}

        {event.instructions && (
          <>
            <h2 className="mt-10 text-xl font-medium">Good to know</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-bone/55">{event.instructions}</p>
          </>
        )}

        {hasLocation && (
          <div className="mt-10 text-left">
            <LiveMap address={event.venue_address} venueName={event.venue_name} height={280} />
          </div>
        )}

        <div className="glass mt-12 rounded-3xl p-7">
          <p className="text-sm font-medium text-bone/70">Your entry pass</p>
          <p className="mt-1 text-xs text-bone/40">Pass #{pass.serial_number} — show this QR code at the door.</p>

          {pass.status === "USED" ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
              <TriangleAlert size={15} /> This pass has already been used for entry.
            </div>
          ) : (
            <>
              <div className="mx-auto my-6 w-fit rounded-2xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Entry pass QR code" className="h-48 w-48" />
              </div>
              <a
                href={qr}
                download={`${event.slug}-pass-${pass.serial_number}.png`}
                className="inline-flex items-center justify-center rounded-xl bg-brass-gradient px-5 py-3 text-sm font-semibold text-ink-950"
              >
                Save this pass
              </a>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
