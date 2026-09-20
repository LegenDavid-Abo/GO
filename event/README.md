# Evently

Premium event invitations with device-uploaded cover photos, a live embedded
map, and a batch of individually numbered, trackable QR passes per event —
built with Next.js and Supabase.

## How it works

There's no per-guest registration form. Instead:

1. When creating an event, the admin chooses how many QR passes to generate
   (e.g. 60). Each pass gets its own unique code and a serial number (#001,
   #002, …).
2. The admin lands on the **Passes** page: a paginated grid (10 per page,
   with Prev/Next and a "Page X / Y" indicator) of every pass. Each card has
   its own **Save** (download) and **Share** buttons, plus **Download all**
   / **Share all** at the top (bundled as a zip).
3. Pressing Save or Share on a pass that's still unused asks the admin to
   confirm — "Mark Pass #007 as shared?" — so the grid tracks who's already
   been sent a code. A pass turns **gold** once marked shared, and **green**
   once it's actually been scanned at the door. Bulk download/share asks the
   same question for every pass still unused.
4. On the day, the admin opens `/scan` and scans passes one at a time. A
   valid, not-yet-used pass shows **"Verified! 🎉"** with confetti and a
   chime, and is immediately marked used (so it can't be scanned again — a
   second scan of the same pass shows **"Already used"**). An unrecognized
   code shows **"Denied"**.
5. Need more passes later, or a code got shared too widely? "Add more
   passes" on the Passes page issues fresh ones continuing the numbering;
   "Regenerate" on any individual pass swaps in a brand-new code for that
   one slot without touching the others.

## 1. Install

```bash
npm install
```

## 2. Supabase

**New project?** In the SQL editor, run `supabase/schema.sql` once. It
creates `events`, `event_passes`, `check_ins`, row-level security policies,
and a public `covers` storage bucket for cover-photo uploads.

**Upgrading an existing Evently database**, run these migrations in order:

1. `supabase/migrations/001_premium_upgrade.sql`
2. `supabase/migrations/002_qr_pass.sql` — only if you're coming from the
   old per-guest registration/ticket system; skip if you're already on the
   single-shared-QR model.
3. `supabase/migrations/003_numbered_passes.sql` — converts a single shared
   `access_code` per event into the `event_passes` table (your existing
   code becomes pass #1). Old `check_ins` rows are dropped since they
   logged the old shared-code model and don't map onto individual passes.

## 3. Environment

Copy `.env.example` to `.env.local` and fill in your Supabase URL and keys.
Never expose the service-role key in client-side code.

## 4. Create your admin login

```bash
npm run seed:admin
```

Creates (or resets) an admin account using `DEFAULT_ADMIN_EMAIL` /
`DEFAULT_ADMIN_PASSWORD` from `.env.local` (defaults to
`admin@evently.app` / `Evently-Admin-2026!` if unset). Log in at
`/admin/login` and change the password from the Supabase dashboard
afterwards.

## 5. Run

```bash
npm run dev
```

Open http://localhost:3000

## 6. Vercel

Import the GitHub repository, add the same environment variables in Vercel,
and deploy.

## Notes

- **event_passes has no public read policy, on purpose.** It holds every
  pass's access code; a permissive policy would let anyone with the public
  anon key list every valid code for every event, not just look up the one
  they were given. The public `/pass/<code>` page and the `/api/checkin`
  route both read this table server-side with the service-role key, which
  bypasses RLS entirely — they never need a client-side policy.
- **Live status sync**: the Passes page subscribes to Supabase Realtime, so
  if a pass is scanned at the door (on a phone) while the grid is open on a
  laptop, the card turns green without a manual refresh.
- **Cover photos** are picked straight from the device in the admin form
  and uploaded to the `covers` Supabase Storage bucket.
- **Location** is entered as a venue name/address and rendered as a live,
  interactive Google Map on both the event page and the pass page. No
  Google Maps API key is required.
- **Deleting an event** removes its cover image from storage, then deletes
  the event row — which cascades to remove every pass and check-in record
  tied to it. This cannot be undone.
