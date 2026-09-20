"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, Eye } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import { slugify } from "@/lib/security";
import { TextField, TextAreaField } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import ImageUpload from "@/components/ImageUpload";
import LiveMap from "@/components/LiveMap";

export interface EventFormValues {
  name: string;
  description: string;
  cover_url: string;
  venue_name: string;
  venue_address: string;
  event_date: string;
  start_time: string;
  end_time: string;
  instructions: string;
}

const empty: EventFormValues = {
  name: "",
  description: "",
  cover_url: "",
  venue_name: "",
  venue_address: "",
  event_date: "",
  start_time: "",
  end_time: "",
  instructions: ""
};

export default function EventForm({
  eventId,
  initialValues
}: {
  eventId?: string;
  initialValues?: Partial<EventFormValues>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormValues>({ ...empty, ...initialValues });
  const [passCount, setPassCount] = useState("60");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const supabase = browserSupabase();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const payload = {
        name: form.name,
        description: form.description,
        cover_url: form.cover_url || null,
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time || null,
        instructions: form.instructions
      };

      if (eventId) {
        const { error: updateError } = await supabase.from("events").update(payload).eq("id", eventId);
        if (updateError) throw updateError;
        router.push("/admin");
        router.refresh();
      } else {
        const { data: created, error: insertError } = await supabase
          .from("events")
          .insert({
            ...payload,
            slug: slugify(form.name),
            created_by: user.id,
            is_published: true
          })
          .select("id")
          .single();
        if (insertError) throw insertError;

        // Generate the requested number of numbered QR passes right away.
        const {
          data: { session }
        } = await supabase.auth.getSession();
        const passRes = await fetch(`/api/events/${created.id}/passes`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ count: Math.max(1, Number(passCount) || 1) })
        });
        if (!passRes.ok) {
          const data = await passRes.json().catch(() => ({}));
          throw new Error(data.error || "Event was created, but the passes could not be generated.");
        }

        // Straight to the shareable QR passes — that's the whole point of
        // creating the event.
        router.push(`/admin/events/${created.id}/pass`);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_460px]">
      <form onSubmit={save} className="space-y-6">
        <ImageUpload value={form.cover_url} onChange={(url) => set("cover_url", url)} />

        <TextField
          label="Event name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="A Night in the Garden"
        />

        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What is this event, and who is it for?"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Venue name"
            value={form.venue_name}
            onChange={(e) => set("venue_name", e.target.value)}
            placeholder="The Glasshouse"
          />
          <TextField
            label="Venue address"
            hint="Powers the live map below"
            value={form.venue_address}
            onChange={(e) => set("venue_address", e.target.value)}
            placeholder="12 Palm Avenue, Lagos"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-bone/70">Location preview</p>
          <LiveMap address={form.venue_address} venueName={form.venue_name} height={220} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Date"
            required
            type="date"
            value={form.event_date}
            onChange={(e) => set("event_date", e.target.value)}
          />
          <TextField
            label="Start time"
            required
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
          />
          <TextField
            label="End time"
            type="time"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
          />
        </div>

        {!eventId && (
          <TextField
            label="Number of QR passes"
            hint="One numbered QR code per pass — you can add more later"
            type="number"
            min={1}
            max={2000}
            required
            value={passCount}
            onChange={(e) => setPassCount(e.target.value)}
            placeholder="60"
          />
        )}

        <TextAreaField
          label="Instructions for guests"
          hint="Optional — shown on the invite page"
          rows={4}
          value={form.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          placeholder="Parking, dress code, what to bring…"
        />

        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="lg" loading={saving} className="flex-1">
            {eventId ? "Save changes" : "Create event & generate passes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            icon={<Eye size={16} />}
            className="lg:hidden"
            onClick={() => setShowPreview((v) => !v)}
          >
            Preview
          </Button>
        </div>
      </form>

      <aside className={`${showPreview ? "block" : "hidden"} lg:sticky lg:top-8 lg:block lg:self-start`}>
        <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-bone/40">
          <Eye size={13} /> Live preview — how the invite page will look
        </p>
        <EventPreview form={form} />
      </aside>
    </div>
  );
}

function EventPreview({ form }: { form: EventFormValues }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 shadow-premium">
      <div className="relative h-72 overflow-hidden bg-ink-800">
        {form.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h2 className="text-3xl font-medium leading-tight text-bone">{form.name || "Your event name"}</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {form.event_date && (
              <span className="glass rounded-full px-3 py-1.5">
                <CalendarDays className="mr-1.5 inline" size={12} />
                {form.event_date}
              </span>
            )}
            {form.start_time && (
              <span className="glass rounded-full px-3 py-1.5">
                <Clock className="mr-1.5 inline" size={12} />
                {form.start_time}
              </span>
            )}
            {(form.venue_name || form.venue_address) && (
              <span className="glass rounded-full px-3 py-1.5">
                <MapPin className="mr-1.5 inline" size={12} />
                {form.venue_name || form.venue_address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-ink-900 p-6">
        {form.description && (
          <p className="line-clamp-4 text-sm leading-6 text-bone/55">{form.description}</p>
        )}
        <LiveMap address={form.venue_address} venueName={form.venue_name} height={160} />
        <div className="rounded-xl border border-dashed border-white/12 p-4 text-center text-xs text-bone/35">
          Your QR pass will be ready right after you create this event
        </div>
      </div>
    </div>
  );
}
