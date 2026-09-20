"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import PassesManager from "@/components/PassesManager";

export default function EventPassPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<{ name: string; slug: string } | null>(null);

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

      const { data } = await supabase.from("events").select("name, slug").eq("id", id).single();
      if (!data) {
        router.push("/admin");
        return;
      }
      setEvent(data);
    })();
  }, [id, router]);

  return (
    <main className="field-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-bone/40 hover:text-bone/70">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mt-6 text-center">
          <p className="text-xs font-medium tracking-[.2em] text-brass-400/80">QR PASSES</p>
          <h1 className="mt-2 text-4xl font-medium">{event?.name || "…"}</h1>
          <p className="mt-2 text-bone/45">Each pass is its own code — download or share them one at a time, or all at once.</p>
        </div>

        <div className="mt-10">
          {event ? (
            <PassesManager eventId={id} eventName={event.name} eventSlug={event.slug} />
          ) : (
            <div className="flex items-center justify-center gap-3 py-24 text-bone/40">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
