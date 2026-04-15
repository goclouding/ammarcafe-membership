-- Run in Supabase SQL Editor to support the multi-step wizard.

alter table membership_applications
  add column if not exists date_of_birth date,
  add column if not exists profile_photo_url text;

alter table membership_applications alter column marital_status drop not null;
alter table membership_applications drop constraint if exists membership_applications_marital_status_check;

alter table membership_applications alter column age drop not null;
alter table membership_applications drop constraint if exists membership_applications_age_check;

-- Storage bucket for profile photos (public read)
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "anon upload profile photos" on storage.objects;
create policy "anon upload profile photos" on storage.objects
  for insert to anon
  with check (bucket_id = 'profile-photos');

drop policy if exists "public read profile photos" on storage.objects;
create policy "public read profile photos" on storage.objects
  for select
  using (bucket_id = 'profile-photos');
