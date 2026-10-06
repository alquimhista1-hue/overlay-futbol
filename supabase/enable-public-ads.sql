-- Public advertiser management, explicitly requested for this panel.
-- Anyone who can access the project API can manage these advertisements.
begin;
grant select, insert, update, delete on public.overlay_sponsors to anon, authenticated;
alter table public.overlay_sponsors enable row level security;
drop policy if exists "ad_read" on public.overlay_sponsors;
drop policy if exists "ad_manage" on public.overlay_sponsors;
create policy "ad_read" on public.overlay_sponsors for select to anon, authenticated using (true);
create policy "ad_manage" on public.overlay_sponsors for all to anon, authenticated using (true) with check (true);

drop policy if exists "ad_storage_manage" on storage.objects;
create policy "ad_storage_manage" on storage.objects for all to anon, authenticated
using (bucket_id = 'overlay-sponsors')
with check (bucket_id = 'overlay-sponsors');
commit;
-- No sign-in, administrator UUID or private key is needed in the panel.
-- Existing ads, the scoreboard and other buckets are preserved.
