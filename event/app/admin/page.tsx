"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckCircle2, ExternalLink, Pencil, Plus, QrCode, ScanLine, TrendingUp, XCircle } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DeleteEventButton from "@/components/DeleteEventButton";

interface Stats {
  events: number;
  published: number;
  verified: number;
  denied: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ events: 0, published: 0, verified: 0, denied: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = browserSupabase();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      location.href = "/admin/login";
      return;
    }
    setUser(user);

    // Fetch everything in parallel so the dashboard paints as fast as
    // the slowest single query, not the sum of both.
    const [eventsRes, checkInsRes] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("check_ins").select("result")
    ]);

    const list = eventsRes.data || [];
    setEvents(list);
    setStats({
      events: list.length,
      published: list.filter((e) => e.is_published).length,
      verified: (checkInsRes.data || []).filter((c) => c.result === "VERIFIED").length,
      denied: (checkInsRes.data || []).filter((c) => c.result === "DENIED" || c.result === "ALREADY_USED").length
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function removeLocal(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setStats((s) => ({ ...s, events: s.events - 1 }));
  }

  async function logout() {
    await browserSupabase().auth.signOut();
    location.href = "/admin/login";
  }

  const statCards = [
    { label: "Events", value: stats.events, icon: CalendarDays, from: "from-fuchsia-500", to: "to-purple-600" },
    { label: "Published", value: stats.published, icon: TrendingUp, from: "from-cyan-400", to: "to-blue-600" },
    { label: "Verified scans", value: stats.verified, icon: CheckCircle2, from: "from-emerald-400", to: "to-teal-600" },
    { label: "Denied scans", value: stats.denied, icon: XCircle, from: "from-red-500", to: "to-rose-600" }
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient animated color blobs — GPU-accelerated transforms only, so they stay smooth. */}
      <motion.div
        className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/20 blur-[110px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[110px]"
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[110px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="hairline relative border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-lg font-medium">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brass-gradient text-ink-950">✦</span>
            Evently
          </div>
          <div className="flex items-center gap-4">
            <Link href="/scan" className="flex items-center gap-1.5 text-sm text-bone/50 hover:text-bone">
              <ScanLine size={15} /> Scanner
            </Link>
            <span className="hidden text-sm text-bone/40 sm:inline">{user?.email}</span>
            <button onClick={logout} className="text-sm text-bone/40 hover:text-bone/70">
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[.2em] text-brass-400/80">CONTROL CENTER</p>
            <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Your events</h1>
          </div>
          <Link href="/admin/events/new">
            <Button icon={<Plus size={16} />}>Create event</Button>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.from} ${card.to} opacity-[.14]`} />
              <div className="relative">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${card.from} ${card.to} text-white`}
                >
                  <card.icon size={16} />
                </div>
                <div className="mt-4 text-3xl font-medium tabular-nums">
                  {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-white/10" /> : card.value}
                </div>
                <div className="mt-1 text-xs text-bone/45">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="glass rounded-3xl p-14 text-center">
              <CalendarDays className="mx-auto text-bone/25" size={28} />
              <h2 className="mt-4 text-xl font-medium">No events yet</h2>
              <p className="mt-2 text-sm text-bone/40">Create your first event to get a shareable QR pass.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence initial={false}>
                {events.map((event, i) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.97 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="glass flex flex-col gap-4 rounded-2xl p-5 transition hover:border-white/16 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-800 sm:block">
                        {event.cover_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.cover_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-medium">{event.name}</h2>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-sm text-bone/35">{event.event_date}</span>
                          <Badge tone={event.is_published ? "success" : "neutral"}>
                            {event.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/events/${event.id}/pass`}
                        className="flex items-center gap-1.5 rounded-lg border border-brass-400/30 bg-brass-500/10 px-4 py-2 text-sm text-brass-300 hover:border-brass-400/50"
                      >
                        <QrCode size={13} /> Pass
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-white/25"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                      <Link
                        href={`/e/${event.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-white/25"
                      >
                        <ExternalLink size={13} /> View
                      </Link>
                      <DeleteEventButton
                        eventId={event.id}
                        eventName={event.name}
                        coverUrl={event.cover_url}
                        onDeleted={() => removeLocal(event.id)}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
