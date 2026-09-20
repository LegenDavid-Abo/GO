import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase";

const schema = z.object({ count: z.number().int().min(1).max(2000) });

async function requireAdmin(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const db = adminSupabase();
  const {
    data: { user }
  } = await db.auth.getUser(token);
  return user;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { count } = schema.parse(await req.json());
    const { id: eventId } = await params;
    const db = adminSupabase();

    const { data: event } = await db.from("events").select("id").eq("id", eventId).single();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const { data: existing } = await db
      .from("event_passes")
      .select("serial_number")
      .eq("event_id", eventId)
      .order("serial_number", { ascending: false })
      .limit(1);
    const startAt = (existing?.[0]?.serial_number || 0) + 1;

    const rows = Array.from({ length: count }, (_, i) => ({
      event_id: eventId,
      serial_number: startAt + i,
      access_code: crypto.randomBytes(9).toString("base64url")
    }));

    const { error } = await db.from("event_passes").insert(rows);
    if (error) throw error;

    return NextResponse.json({ created: count, from: startAt, to: startAt + count - 1 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not generate passes" }, { status: 400 });
  }
}
