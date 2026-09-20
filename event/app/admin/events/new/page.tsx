import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventForm from "@/components/EventForm";

export default function NewEventPage() {
  return (
    <main className="field-glow min-h-screen px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-bone/40 hover:text-bone/70">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-xs font-medium tracking-[.2em] text-brass-400/80">NEW EVENT</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Create an event</h1>
          <p className="mt-3 max-w-lg text-bone/45">
            Add the details, drop in a cover photo, and watch the invitation take shape on the right.
          </p>
        </div>

        <div className="mt-10">
          <EventForm />
        </div>
      </div>
    </main>
  );
}
