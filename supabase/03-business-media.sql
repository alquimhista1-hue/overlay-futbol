-- Ejecutar en SQL Editor del proyecto OVERLAY.
-- Marco compartido por trabajadores; anuncios y activación independientes por usuario.
begin;
create table if not exists public.studio_business_settings (
 id text primary key check(id='cdn'), frame_path text, updated_at timestamptz not null default now()
);
alter table public.studio_business_settings enable row level security;
revoke all on public.studio_business_settings from authenticated;
grant select,insert,update on public.studio_business_settings to authenticated;
revoke all on public.studio_business_settings from anon;
drop policy if exists studio_business_staff on public.studio_business_settings;
create policy studio_business_staff on public.studio_business_settings for all to authenticated using(true) with check(id='cdn');
insert into public.studio_business_settings(id) values('cdn') on conflict do nothing;
create table if not exists public.studio_manual_items (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80), image_path text not null,
 framing jsonb not null default '{"x":50,"y":50,"scale":1,"fit":"contain"}',
 duration_seconds integer default 60 check(duration_seconds is null or duration_seconds between 1 and 3600),
 updated_at timestamptz not null default now()
);
alter table public.studio_manual_items enable row level security;
revoke all on public.studio_manual_items from authenticated;
grant select,insert,update,delete on public.studio_manual_items to authenticated;
revoke all on public.studio_manual_items from anon;
drop policy if exists studio_manual_owner on public.studio_manual_items;
create policy studio_manual_owner on public.studio_manual_items for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create table if not exists public.studio_manual_display (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 item_id uuid not null references public.studio_manual_items(id) on delete cascade,
 payload jsonb not null, started_at timestamptz not null default now(), expires_at timestamptz
);
alter table public.studio_manual_display enable row level security;
revoke all on public.studio_manual_display from authenticated;
grant select,delete on public.studio_manual_display to authenticated;
revoke all on public.studio_manual_display from anon;
drop policy if exists studio_manual_display_owner on public.studio_manual_display;
create policy studio_manual_display_owner on public.studio_manual_display for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create or replace function public.studio_show_manual(chosen_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare item public.studio_manual_items; moment timestamptz:=clock_timestamp();
begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 select * into item from public.studio_manual_items where id=chosen_id and owner_id=auth.uid();
 if not found then raise exception 'Anuncio no encontrado'; end if;
 insert into public.studio_manual_display(owner_id,item_id,payload,started_at,expires_at)
 values(auth.uid(),item.id,jsonb_build_object('image_path',item.image_path,'framing',item.framing,'name',item.name),moment,
 case when item.duration_seconds is null then null else moment+make_interval(secs=>item.duration_seconds) end)
 on conflict(owner_id) do update set item_id=excluded.item_id,payload=excluded.payload,started_at=excluded.started_at,expires_at=excluded.expires_at;
end $$;
revoke all on function public.studio_show_manual(uuid) from public;
grant execute on function public.studio_show_manual(uuid) to authenticated;
create or replace function public.studio_read_manual(share_token uuid) returns jsonb
language sql volatile security definer set search_path=public as $$
 select jsonb_build_object('server_now',clock_timestamp(),'display',(
 select jsonb_build_object('item_id',d.item_id,'payload',d.payload,'started_at',d.started_at,'expires_at',d.expires_at)
 from public.studio_manual_display d join public.studio_overlay_links l on l.owner_id=d.owner_id
 where l.token=share_token and (d.expires_at is null or d.expires_at>clock_timestamp()) limit 1))
$$;
revoke all on function public.studio_read_manual(uuid) from public;
grant execute on function public.studio_read_manual(uuid) to anon,authenticated;
commit;
