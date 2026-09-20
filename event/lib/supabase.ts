import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function browserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
// Extracts the storage object path from a public Supabase Storage URL for
// the "covers" bucket, e.g. ".../storage/v1/object/public/covers/abc.jpg"
// -> "abc.jpg". Returns null for anything else (external URL, empty, etc).
export function coverStoragePath(url: string | null | undefined) {
  if (!url) return null;
  const marker = "/covers/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export function adminSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}