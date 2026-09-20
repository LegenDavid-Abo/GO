// Creates the default admin account so you can log in to /admin/login the
// first time, without opening the Supabase dashboard.
//
// Usage:
//   npm run seed:admin
//
// Reads DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD (falls back to the
// values below) plus your Supabase URL and service role key from
// .env.local. Change the password after your first login.

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@evently.app";
const password = process.env.DEFAULT_ADMIN_PASSWORD || "Evently-Admin-2026!";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);

  if (found) {
    await supabase.auth.admin.updateUserById(found.id, { password });
    console.log(`Updated password for existing admin: ${email}`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) throw error;
    console.log(`Created admin: ${email}`);
  }

  console.log("\nLog in at /admin/login with:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("\nChange this password after your first login.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
