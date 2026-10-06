-- Run once in the project's Supabase SQL editor. Re-running does not restore deleted ads.
create table if not exists public.overlay_sponsor_admins(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.overlay_sponsor_admins enable row level security;
drop policy if exists "ad_admin_self" on public.overlay_sponsor_admins;
create policy "ad_admin_self" on public.overlay_sponsor_admins for select to authenticated using(user_id=auth.uid());
grant select on public.overlay_sponsor_admins to authenticated;
create table if not exists public.overlay_sponsors(
 id text primary key, name text not null check(length(name) between 1 and 80),
 image_path text not null, bundled boolean not null default false,
 active boolean not null default true, sort_order integer not null default 0
);
alter table public.overlay_sponsors enable row level security;
grant select on public.overlay_sponsors to anon,authenticated;
grant insert,update,delete on public.overlay_sponsors to authenticated;
drop policy if exists "ad_read" on public.overlay_sponsors;
create policy "ad_read" on public.overlay_sponsors for select to anon,authenticated using(true);
drop policy if exists "ad_manage" on public.overlay_sponsors;
create policy "ad_manage" on public.overlay_sponsors for all to authenticated
 using(exists(select 1 from public.overlay_sponsor_admins where user_id=auth.uid()))
 with check(exists(select 1 from public.overlay_sponsor_admins where user_id=auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('overlay-sponsors','overlay-sponsors',true,5242880,array['image/png','image/jpeg','image/webp'])
 on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
drop policy if exists "ad_storage_manage" on storage.objects;
create policy "ad_storage_manage" on storage.objects for all to authenticated
 using(bucket_id='overlay-sponsors' and exists(select 1 from public.overlay_sponsor_admins where user_id=auth.uid()))
 with check(bucket_id='overlay-sponsors' and exists(select 1 from public.overlay_sponsor_admins where user_id=auth.uid()));
-- Seed only on first setup; an empty list thereafter stays empty.
create table if not exists public.overlay_ad_migrations(version text primary key);
alter table public.overlay_ad_migrations enable row level security;
do $$ begin
 if not exists(select 1 from public.overlay_ad_migrations where version='seed-v1') then
 insert into public.overlay_sponsors(id,name,image_path,bundled,sort_order) values
 ('muni','MUNI','assets/images/sponsors/MUNI.jpg',true,1),('importadora','Importadora','assets/images/sponsors/Importadora.jpg',true,2),('taquerea','TAQUEREA','assets/images/sponsors/TAQUEREA.jpg',true,3) on conflict(id) do nothing;
 insert into public.overlay_ad_migrations values('seed-v1');
 end if;
end $$;
-- After creating your operator in Authentication > Users, authorize its UUID:
-- insert into public.overlay_sponsor_admins(user_id) values('USER_UUID_HERE') on conflict do nothing;
