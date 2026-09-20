import Link from "next/link";
import { ArrowRight, QrCode, ShieldCheck, Sparkles, Ticket } from "lucide-react";

const features = [
  {
    icon: Ticket,
    title: "Digital tickets",
    desc: "Every attendee gets an individual ticket and a unique QR credential, delivered by email."
  },
  {
    icon: QrCode,
    title: "Instant check-in",
    desc: "Scan straight from a phone browser. The first successful scan consumes the ticket."
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    desc: "Random tokens, server-side validation, and an atomic database check-in."
  }
];

export default function Home() {
  return (
    <main className="field-glow min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2 text-lg font-medium">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brass-gradient text-ink-950">✦</span>
          Evently
        </div>
        <Link href="/admin/login" className="text-sm text-bone/60 hover:text-bone">
          Admin
        </Link>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-32">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs text-bone/55">
            <Sparkles size={14} className="text-brass-400" /> Events, beautifully managed
          </div>
          <h1 className="text-6xl font-medium leading-[.98] tracking-[-0.03em] sm:text-8xl">
            Moments that
            <br />
            <span className="brass-text-gradient">matter.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-bone/55">
            Create beautiful events, collect registrations, deliver digital tickets and run secure single-use QR
            entry — without payment infrastructure.
          </p>
          <Link
            href="/admin/login"
            className="mt-9 inline-flex items-center gap-3 rounded-xl bg-brass-gradient px-6 py-4 font-semibold text-ink-950 shadow-glow transition hover:brightness-105"
          >
            Create an event <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div className="glass rounded-3xl p-7" key={title}>
            <Icon size={24} className="text-brass-400" />
            <h3 className="mt-7 text-xl font-medium">{title}</h3>
            <p className="mt-3 leading-7 text-bone/45">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
