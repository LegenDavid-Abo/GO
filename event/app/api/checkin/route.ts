import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";

// Pulls the access code out of whatever the scanner read. Accepts either
// a bare code or a full /pass/<code> URL (which is what the QR encodes).
function extractCode(raw: string): string {
  const trimmed = raw.trim();
  const parts = trimmed.split("/").filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || trimmed);
}

export async function POST(req: Request) {
  try {
    const { code: rawCode } = await req.json();
    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json({ result: "DENIED" });
    }

    const code = extractCode(rawCode);
    const db = adminSupabase();

    const { data: pass } = await db
      .from("event_passes")
      .select("id, status, serial_number, event_id, events(name, is_published)")
      .eq("access_code", code)
      .maybeSingle();

    const event = pass?.events as unknown as { name: string; is_published: boolean } | null;

    if (!pass || !event || !event.is_published) {
      await db.from("check_ins").insert({ result: "DENIED", scanned_code: code });
      return NextResponse.json({ result: "DENIED" });
    }

    if (pass.status === "USED") {
      await db.from("check_ins").insert({
        event_id: pass.event_id,
        pass_id: pass.id,
        result: "ALREADY_USED",
        scanned_code: code
      });
      return NextResponse.json({
        result: "ALREADY_USED",
        event_name: event.name,
        serial_number: pass.serial_number
      });
    }

    // Atomic: only succeeds if the status is still not USED at the moment
    // of the update, so two simultaneous scans of the same pass can't
    // both come back VERIFIED.
    const { data: updated } = await db
      .from("event_passes")
      .update({ status: "USED", used_at: new Date().toISOString() })
      .eq("id", pass.id)
      .neq("status", "USED")
      .select("serial_number")
      .maybeSingle();

    if (!updated) {
      await db.from("check_ins").insert({
        event_id: pass.event_id,
        pass_id: pass.id,
        result: "ALREADY_USED",
        scanned_code: code
      });
      return NextResponse.json({
        result: "ALREADY_USED",
        event_name: event.name,
        serial_number: pass.serial_number
      });
    }

    await db.from("check_ins").insert({
      event_id: pass.event_id,
      pass_id: pass.id,
      result: "VERIFIED",
      scanned_code: code
    });

    return NextResponse.json({ result: "VERIFIED", event_name: event.name, serial_number: updated.serial_number });
  } catch (error: any) {
    return NextResponse.json({ result: "DENIED", error: error?.message }, { status: 500 });
  }
}
