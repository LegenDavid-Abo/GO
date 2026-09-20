-- Run this only if your database was created from an earlier version of
-- schema.sql (one that had a map_url column and no admin write policies).
-- Safe to run once; skip entirely on a brand-new project.

alter table events drop column if exists map_url;

drop policy if exists "admins manage events" on events;
create policy "admins manage events" on events for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "admins manage registration fields" on registration_fields;
create policy "admins manage registration fields" on registration_fields for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "admins read attendees" on attendees;
create policy "admins read attendees" on attendees for select using (auth.uid() is not null);

drop policy if exists "admins read tickets" on tickets;
create policy "admins read tickets" on tickets for select using (auth.uid() is not null);

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "covers are publicly readable" on storage.objects;
create policy "covers are publicly readable" on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "admins upload covers" on storage.objects;
create policy "admins upload covers" on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);

drop policy if exists "admins replace covers" on storage.objects;
create policy "admins replace covers" on storage.objects for update
  using (bucket_id = 'covers' and auth.uid() is not null);

drop policy if exists "admins delete covers" on storage.objects;
create policy "admins delete covers" on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid() is not null);
