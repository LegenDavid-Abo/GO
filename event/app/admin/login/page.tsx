"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import { TextField } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

const demoEmail = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL;
const demoPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await browserSupabase().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/admin");
  }

  function fillDemo() {
    if (!demoEmail || !demoPassword) return;
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <main className="field-glow grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="glass-strong rounded-3xl p-8 shadow-premium">
          <div className="text-xs font-medium tracking-[.25em] text-brass-400/80">EVENTLY ADMIN</div>
          <h1 className="mt-3 text-3xl font-medium">Welcome back</h1>
          <p className="mt-1 text-sm text-bone/40">Sign in to manage your events.</p>

          <div className="mt-8 space-y-4">
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
            />
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full" icon={<ArrowRight size={16} />}>
              Log in
            </Button>
          </div>
        </form>

        {demoEmail && demoPassword && (
          <button
            type="button"
            onClick={fillDemo}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 py-3 text-xs text-bone/40 hover:border-brass-400/40 hover:text-brass-300"
          >
            <KeyRound size={13} /> Use demo credentials — set up with <code>npm run seed:admin</code>
          </button>
        )}
      </div>
    </main>
  );
}
