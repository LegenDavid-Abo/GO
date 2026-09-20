import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminSupabase } from "@/lib/supabase";

export async function POST(req: Request, { params }: { params: Promise<{ passId: string }> }) {
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const db = adminSupabase();
    const {
      data: { user }
    } = await db.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { passId } = await params;
    const newCode = crypto.randomBytes(9).toString("base64url");

    const { data, error } = await db
      .from("event_passes")
      .update({ access_code: newCode, status: "UNUSED", shared_at: null, used_at: null })
      .eq("id", passId)
      .select("access_code")
      .single();
    if (error) throw error;

    return NextResponse.json({ access_code: data.access_code });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not regenerate this pass" }, { status: 400 });
  }
}
