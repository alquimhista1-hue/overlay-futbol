-- CDN Studio: isolated schema. Existing overlay tables are not modified.
begin;
create table if not exists public.studio_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',business_name text not null default '',phone text not null default '',address text not null default '',logo_path text
);
create table if not exists public.studio_documents (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check(kind in ('quotation','design')),title text not null default '',payload jsonb not null default '{}',updated_at timestamptz not null default now()
);
create table if not exists public.studio_overlay_state (
 id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 name_home text not null default 'EQUIPO LOCAL',name_away text not null default 'EQUIPO VISITANTE',score_home integer not null default 0 check(score_home>=0),score_away integer not null default 0 check(score_away>=0),
 timer_seconds integer not null default 0,is_running boolean not null default false,session_start bigint not null default 0,visible boolean not null default true
);
create table if not exists public.studio_overlay_links (
 owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 token uuid not null unique default gen_random_uuid()
);
create table if not exists public.studio_sponsors (
 id text primary key,owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80),image_path text not null,bundled boolean not null default false,
 active boolean not null default true,sort_order integer not null default 0
);
create index if not exists studio_docs_owner on public.studio_documents(owner_id,updated_at desc);
create index if not exists studio_partners_owner on public.studio_sponsors(owner_id,sort_order);
alter table public.studio_profiles enable row level security;
alter table public.studio_documents enable row level security;
alter table public.studio_overlay_state enable row level security;
alter table public.studio_overlay_links enable row level security;
alter table public.studio_sponsors enable row level security;
revoke all on public.studio_profiles,public.studio_documents,public.studio_overlay_state,public.studio_overlay_links,public.studio_sponsors from anon;
grant select,insert,update,delete on public.studio_profiles,public.studio_documents,public.studio_overlay_state,public.studio_overlay_links,public.studio_sponsors to authenticated;
drop policy if exists studio_profile_owner on public.studio_profiles;
create policy studio_profile_owner on public.studio_profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists studio_doc_owner on public.studio_documents;
create policy studio_doc_owner on public.studio_documents for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists studio_state_owner on public.studio_overlay_state;
create policy studio_state_owner on public.studio_overlay_state for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists studio_link_owner on public.studio_overlay_links;
create policy studio_link_owner on public.studio_overlay_links for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists studio_partner_owner on public.studio_sponsors;
create policy studio_partner_owner on public.studio_sponsors for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

-- Public image files for OBS; private documents and profile logos in another bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('studio-files','studio-files',true,5242880,array['image/png','image/jpeg','image/webp']),
 ('studio-private','studio-private',false,52428800,array['image/png','image/jpeg','image/webp','application/json'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists studio_file_owner on storage.objects;
create policy studio_file_owner on storage.objects for all to authenticated
 using(bucket_id in ('studio-files','studio-private') and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id in ('studio-files','studio-private') and (storage.foldername(name))[1]=auth.uid()::text);

-- Read-only OBS endpoints. A random revocable token grants display access only.
create or replace function public.studio_read_overlay(share_token uuid) returns jsonb
language sql stable security definer set search_path=public
as $$ select to_jsonb(s)-'id' from public.studio_overlay_state s join public.studio_overlay_links l on l.owner_id=s.id where l.token=share_token limit 1 $$;
create or replace function public.studio_read_sponsors(share_token uuid) returns jsonb
language sql stable security definer set search_path=public
as $$ select coalesce(jsonb_agg(to_jsonb(s)-'owner_id' order by s.sort_order,s.id),'[]'::jsonb) from public.studio_sponsors s join public.studio_overlay_links l on l.owner_id=s.owner_id where l.token=share_token and s.active=true $$;
revoke all on function public.studio_read_overlay(uuid),public.studio_read_sponsors(uuid) from public;
grant execute on function public.studio_read_overlay(uuid),public.studio_read_sponsors(uuid) to anon,authenticated;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='studio_overlay_state') then
 alter publication supabase_realtime add table public.studio_overlay_state;
 end if;
end $$;
commit;
