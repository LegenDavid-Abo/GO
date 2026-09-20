"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import EventForm, { EventFormValues } from "@/components/EventForm";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [values, setValues] = useState<Partial<EventFormValues> | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = browserSupabase();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data } = await supabase.from("events").select("*").eq("id", id).single();
      if (!data) {
        router.push("/admin");
        return;
      }

      setValues({
        name: data.name,
        description: data.description || "",
        cover_url: data.cover_url || "",
        venue_name: data.venue_name || "",
        venue_address: data.venue_address || "",
        event_date: data.event_date,
        start_time: data.start_time,
        end_time: data.end_time || "",
        instructions: data.instructions || ""
      });
    })();
  }, [id, router]);

  return (
    <main className="field-glow min-h-screen px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-bone/40 hover:text-bone/70">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[.2em] text-brass-400/80">EDIT EVENT</p>
            <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Refine the details</h1>
          </div>
          <Link
            href={`/admin/events/${id}/pass`}
            className="rounded-xl border border-white/12 px-4 py-2.5 text-sm hover:border-white/25"
          >
            View QR pass
          </Link>
        </div>

        <div className="mt-10">
          {values ? (
            <EventForm eventId={id} initialValues={values} />
          ) : (
            <div className="flex items-center gap-3 py-24 text-bone/40">
              <Loader2 className="animate-spin" size={18} /> Loading event…
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
