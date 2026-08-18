do $$ begin
  create type public.brand_access_role as enum (
    'super_admin',
    'owner',
    'admin',
    'editor'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create trigger brands_set_updated_at
    before update on public.brands
    for each row execute procedure public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_brand_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  role public.brand_access_role not null default 'editor',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, brand_id)
);

create unique index if not exists user_brand_access_default_idx
  on public.user_brand_access(user_id)
  where is_default;

create index if not exists user_brand_access_brand_idx
  on public.user_brand_access(brand_id, role);

insert into public.brands (id, name, slug, is_active)
values (
  '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b',
  '風曝',
  'fengbao',
  true
)
on conflict (slug) do nothing;

alter table public.content_items
  add column if not exists brand_id uuid references public.brands(id);
alter table public.content_assets
  add column if not exists brand_id uuid references public.brands(id);
alter table public.content_revisions
  add column if not exists brand_id uuid references public.brands(id);
alter table public.projects
  add column if not exists brand_id uuid references public.brands(id);
alter table public.brand_style_profiles
  add column if not exists brand_id uuid references public.brands(id);
alter table public.media
  add column if not exists brand_id uuid references public.brands(id);

do $$ begin
  if to_regclass('public.social_publications') is not null then
    alter table public.social_publications
      add column if not exists brand_id uuid references public.brands(id);
    update public.social_publications
    set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
    where brand_id is null;
    alter table public.social_publications alter column brand_id set not null;
    create index if not exists social_publications_brand_idx
      on public.social_publications(brand_id, status, updated_at desc);
  end if;
end $$;

update public.content_items
set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
where brand_id is null;
update public.content_assets
set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
where brand_id is null;
update public.content_revisions
set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
where brand_id is null;
update public.projects
set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
where brand_id is null;
update public.brand_style_profiles
set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
where brand_id is null;
update public.media
set brand_id = '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b'
where brand_id is null;

alter table public.content_items alter column brand_id set not null;
alter table public.content_assets alter column brand_id set not null;
alter table public.content_revisions alter column brand_id set not null;
alter table public.projects alter column brand_id set not null;
alter table public.brand_style_profiles alter column brand_id set not null;
alter table public.media alter column brand_id set not null;

alter table public.content_items drop constraint if exists content_items_slug_key;
drop index if exists content_items_slug_key;
create unique index if not exists content_items_brand_slug_idx
  on public.content_items(brand_id, slug);

create index if not exists content_items_brand_status_idx
  on public.content_items(brand_id, status, updated_at desc);
create index if not exists projects_brand_idx
  on public.projects(brand_id, updated_at desc);
create index if not exists brand_style_profiles_brand_idx
  on public.brand_style_profiles(brand_id, user_id);
create index if not exists media_brand_idx
  on public.media(brand_id);

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_brand_access access
    where access.user_id = uid
      and access.role = 'super_admin'
  );
$$;

create or replace function public.has_brand_access(uid uuid, bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin(uid)
    or exists (
      select 1
      from public.user_brand_access access
      join public.brands brand on brand.id = access.brand_id
      where access.user_id = uid
        and access.brand_id = bid
        and brand.is_active
    );
$$;

create or replace function public.grant_fengbao_editor_if_limited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fengbao_id uuid := '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b';
  email_local text;
begin
  email_local := split_part(lower(coalesce(new.email, '')), '@', 1);
  if email_local = 'cfac07151025' then
    insert into public.user_brand_access (user_id, brand_id, role, is_default)
    values (new.id, fengbao_id, 'editor', true)
    on conflict (user_id, brand_id) do update
      set role = 'editor';
  end if;
  return new;
end;
$$;

drop trigger if exists grant_fengbao_editor_on_user on auth.users;
create trigger grant_fengbao_editor_on_user
  after insert on auth.users
  for each row execute procedure public.grant_fengbao_editor_if_limited();

insert into public.user_brand_access (user_id, brand_id, role, is_default)
select
  users.id,
  '8f0c1b2a-9d3e-4c7f-a1b2-0d4e6f8a9c1b',
  case
    when split_part(lower(coalesce(users.email, '')), '@', 1) = 'cfac07151025'
      then 'editor'::public.brand_access_role
    else 'super_admin'::public.brand_access_role
  end,
  true
from auth.users as users
on conflict (user_id, brand_id) do update
  set role = excluded.role,
      is_default = true;

alter table public.brands enable row level security;
alter table public.user_brand_access enable row level security;

do $$ begin
  create policy "users read accessible brands"
    on public.brands
    for select
    using (
      public.is_super_admin(auth.uid())
      or exists (
        select 1
        from public.user_brand_access access
        where access.user_id = auth.uid()
          and access.brand_id = brands.id
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "super admins manage brands"
    on public.brands
    for all
    using (public.is_super_admin(auth.uid()))
    with check (public.is_super_admin(auth.uid()));
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "users read own brand access"
    on public.user_brand_access
    for select
    using (
      user_id = auth.uid()
      or public.is_super_admin(auth.uid())
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "super admins manage brand access"
    on public.user_brand_access
    for all
    using (public.is_super_admin(auth.uid()))
    with check (public.is_super_admin(auth.uid()));
exception
  when duplicate_object then null;
end $$;

grant select on public.brands to authenticated;
grant select, insert, update, delete on public.user_brand_access to authenticated;
grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.has_brand_access(uuid, uuid) to authenticated;
