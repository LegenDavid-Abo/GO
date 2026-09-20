-- Switches from "one shared QR code per event" to "N individually
-- numbered, individually trackable QR passes per event". Run this after
-- 001_premium_upgrade.sql and 002_qr_pass.sql.
--
-- Any event that already has an access_code becomes pass #1 for that
-- event, carrying over its current status, so an already-shared/used
-- single code keeps working as pass #1 rather than silently breaking.

create table if not exists event_passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  serial_number integer not null,
  access_code text not null unique default replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'),
  status text not null default 'UNUSED' check (status in ('UNUSED', 'SHARED', 'USED')),
  shared_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, serial_number)
);
alter table event_passes enable row level security;

drop policy if exists "admins manage passes" on event_passes;
create policy "admins manage passes" on event_passes for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Carry over each event's existing single access_code as pass #1.
insert into event_passes (event_id, serial_number, access_code, status)
select id, 1, access_code, 'UNUSED'
from events
where access_code is not null
on conflict (event_id, serial_number) do nothing;

alter table events drop column if exists access_code;

-- check_ins moves from tracking a single shared code to tracking a
-- specific pass. Old rows have no pass to point to, so they're dropped —
-- they were logs of the old shared-code model and don't map cleanly onto
-- individual passes.
drop table if exists check_ins;
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  pass_id uuid references event_passes(id) on delete cascade,
  result text not null check (result in ('VERIFIED', 'DENIED', 'ALREADY_USED')),
  scanned_code text,
  staff_user_id uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now()
);
alter table check_ins enable row level security;

drop policy if exists "admins read check_ins" on check_ins;
create policy "admins read check_ins" on check_ins for select using (auth.uid() is not null);
