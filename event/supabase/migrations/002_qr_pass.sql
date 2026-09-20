-- Switches Evently from "each guest registers and gets a personal ticket"
-- to "one shareable QR pass per event". Run this after 001_premium_upgrade.sql.
--
-- This DROPS attendees, tickets and registration_fields entirely — back
-- these up first with Supabase's dashboard export if you want to keep the
-- registration history. There is no way to undo this migration.

drop function if exists consume_ticket(text, uuid);

drop table if exists check_ins;
drop table if exists tickets;
drop table if exists attendees;
drop table if exists registration_fields;

drop type if exists ticket_status;
drop type if exists registration_field_type;

alter table events add column if not exists access_code text unique default replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-');
update events set access_code = replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-') where access_code is null;
alter table events alter column access_code set not null;

alter table events drop column if exists registration_open_at;
alter table events drop column if exists registration_close_at;
alter table events drop column if exists max_attendees;
alter table events drop column if exists max_tickets_per_registration;

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  result text not null check (result in ('VERIFIED', 'DENIED')),
  scanned_code text,
  staff_user_id uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now()
);
alter table check_ins enable row level security;

drop policy if exists "admins read check_ins" on check_ins;
create policy "admins read check_ins" on check_ins for select using (auth.uid() is not null);
