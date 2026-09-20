-- Evently schema — numbered multi-pass model
-- Run this once in the Supabase SQL editor on a fresh project.
--
-- The admin chooses how many QR passes an event has (e.g. 60). Each pass
-- is its own row with its own access_code and a serial_number (1..N) for
-- reference. The admin shares each pass individually (or in bulk) with
-- guests. At the door, a scan looks up the code in event_passes:
--   - no match, or the event isn't published  -> DENIED
--   - match, status already 'USED'            -> ALREADY_USED
--   - match, status 'UNUSED' or 'SHARED'       -> marked 'USED', VERIFIED

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  cover_url text,
  venue_name text,
  venue_address text,
  event_date date not null,
  start_time time not null,
  end_time time,
  is_published boolean not null default false,
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists event_passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  serial_number integer not null,
  -- Random, URL-safe, shareable code — unique per pass, not per event.
  access_code text not null unique default replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'),
  status text not null default 'UNUSED' check (status in ('UNUSED', 'SHARED', 'USED')),
  shared_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, serial_number)
);

-- One row per scan attempt, for the live/analytics feed.
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  pass_id uuid references event_passes(id) on delete cascade,
  result text not null check (result in ('VERIFIED', 'DENIED', 'ALREADY_USED')),
  scanned_code text,
  staff_user_id uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now()
);

alter table events enable row level security;
alter table event_passes enable row level security;
alter table check_ins enable row level security;

-- Public (anonymous) visitors can read published events — needed for the
-- public /e/<slug> info page.
create policy "published events are public" on events for select using (is_published = true);

-- Any signed-in admin can create, read, update and delete events.
create policy "admins manage events" on events for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- event_passes has NO public policy at all, on purpose: it holds every
-- pass's access_code, and a permissive "select where true" policy would
-- let anyone with the anon key list every valid code for every event, not
-- just look up the one they were given. The public /pass/<code> page and
-- the check-in API both read this table server-side with the service-role
-- key, which bypasses RLS entirely — they never need a client-side policy.
create policy "admins manage passes" on event_passes for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "admins read check_ins" on check_ins for select using (auth.uid() is not null);

-- ---------------------------------------------------------------------
-- Storage: cover images uploaded from the device in the admin form
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "covers are publicly readable" on storage.objects for select
  using (bucket_id = 'covers');

create policy "admins upload covers" on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);

create policy "admins replace covers" on storage.objects for update
  using (bucket_id = 'covers' and auth.uid() is not null);

create policy "admins delete covers" on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid() is not null);
