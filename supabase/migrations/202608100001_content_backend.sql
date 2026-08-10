create type public.content_type as enum (
  'article',
  'video',
  'short_video',
  'image',
  'audio_report',
  'interview'
);

create type public.content_status as enum (
  'draft',
  'preview',
  'published',
  'archived'
);

create type public.content_asset_type as enum ('image', 'video', 'audio');
create type public.content_asset_status as enum ('pending', 'ready', 'failed');

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  style_profile_id uuid,
  title text not null default '',
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary text not null default '',
  content text not null default '',
  video_url text,
  category text not null default '未分類',
  content_type public.content_type not null,
  status public.content_status not null default 'draft',
  cover_asset_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (style_profile_id, user_id)
    references public.brand_style_profiles(id, user_id)
    on delete restrict,
  check (
    (status = 'published' and published_at is not null)
    or status <> 'published'
  )
);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute procedure public.set_updated_at();

create table public.content_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  asset_type public.content_asset_type not null,
  status public.content_asset_status not null default 'pending',
  bucket text not null default 'content-media',
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width integer,
  height integer,
  duration_seconds numeric,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, content_item_id)
);

alter table public.content_items
  add constraint content_items_cover_asset_fk
  foreign key (cover_asset_id, id)
  references public.content_assets(id, content_item_id)
  on delete set null (cover_asset_id);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (content_item_id, version)
);

create index content_items_user_status_idx
  on public.content_items(user_id, status, updated_at desc);
create index content_items_public_idx
  on public.content_items(published_at desc)
  where status = 'published';
create unique index content_items_project_id_unique
  on public.content_items(project_id)
  where project_id is not null;
create index content_assets_content_idx
  on public.content_assets(content_item_id, sort_order);
create index content_revisions_content_idx
  on public.content_revisions(content_item_id, version desc);

alter table public.content_items enable row level security;
alter table public.content_assets enable row level security;
alter table public.content_revisions enable row level security;

create policy "users manage own content items" on public.content_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public reads published content items" on public.content_items
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "users manage own content assets" on public.content_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public reads assets of published content" on public.content_assets
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.content_items item
      where item.id = content_item_id
        and item.status = 'published'
        and item.published_at <= now()
    )
  );

create policy "users read own content revisions" on public.content_revisions
  for select using (auth.uid() = user_id);
create policy "users create own content revisions" on public.content_revisions
  for insert with check (auth.uid() = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'content-media',
  'content-media',
  false,
  1073741824,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/mp4'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users manage own content media objects" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'content-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'content-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
