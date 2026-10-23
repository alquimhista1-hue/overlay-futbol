

-- Shared library with owner-specific selection.
-- OVERLAY project: shared library, individual selection for each overlay.
-- No images, advertisements, scores or saved documents are deleted.
begin;
drop policy if exists studio_partner_owner on public.studio_sponsors;
drop policy if exists studio_partners_read on public.studio_sponsors;
drop policy if exists studio_partners_insert on public.studio_sponsors;
drop policy if exists studio_partners_update on public.studio_sponsors;
drop policy if exists studio_partners_delete on public.studio_sponsors;
create policy studio_partners_read on public.studio_sponsors for select to authenticated using(true);
create policy studio_partners_insert on public.studio_sponsors for insert to authenticated with check(owner_id=auth.uid());
create policy studio_partners_update on public.studio_sponsors for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy studio_partners_delete on public.studio_sponsors for delete to authenticated using(owner_id=auth.uid());
create temporary table studio_selection_upgrade on commit drop as select to_regclass('public.studio_overlay_sponsors') is null as first_install;
create table if not exists public.studio_overlay_sponsors(
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 sponsor_id text not null references public.studio_sponsors(id) on delete cascade,
 enabled boolean not null default true,sort_order integer not null default 0,
 primary key(owner_id,sponsor_id)
);
alter table public.studio_overlay_sponsors enable row level security;
revoke all on public.studio_overlay_sponsors from anon;
grant select,insert,update,delete on public.studio_overlay_sponsors to authenticated;
drop policy if exists studio_selection_owner on public.studio_overlay_sponsors;
create policy studio_selection_owner on public.studio_overlay_sponsors for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
-- Preserve the advertisements that each owner already used. Re-runs preserve selections.
insert into public.studio_overlay_sponsors(owner_id,sponsor_id,enabled,sort_order)
select owner_id,id,active,sort_order from public.studio_sponsors
where (select first_install from studio_selection_upgrade)
on conflict(owner_id,sponsor_id) do nothing;

drop policy if exists studio_file_owner on storage.objects;
drop policy if exists studio_private_owner on storage.objects;
drop policy if exists studio_shared_images on storage.objects;
drop policy if exists studio_image_read on storage.objects;
drop policy if exists studio_image_write on storage.objects;
create policy studio_private_owner on storage.objects for all to authenticated
using(bucket_id='studio-private' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='studio-private' and (storage.foldername(name))[1]=auth.uid()::text);
create policy studio_image_read on storage.objects for select to authenticated using(bucket_id='studio-files');
create policy studio_image_write on storage.objects for all to authenticated
using(bucket_id='studio-files' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='studio-files' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.studio_read_sponsors(share_token uuid) returns jsonb
language sql stable security definer set search_path=public
as $$ select coalesce(jsonb_agg((to_jsonb(s)-'owner_id')||jsonb_build_object('active',true) order by chosen.sort_order,s.sort_order,s.id),'[]'::jsonb)
from public.studio_overlay_links link
join public.studio_overlay_sponsors chosen on chosen.owner_id=link.owner_id
join public.studio_sponsors s on s.id=chosen.sponsor_id
where link.token=share_token and chosen.enabled=true $$;
revoke all on function public.studio_read_sponsors(uuid) from public;
grant execute on function public.studio_read_sponsors(uuid) to anon,authenticated;
-- Marker/clock/team state and OBS links remain strictly private to each user.
commit;
