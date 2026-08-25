do $$ begin
  create type public.social_platform as enum (
    'facebook',
    'instagram',
    'threads',
    'tiktok'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.social_publication_status as enum (
    'draft',
    'queued',
    'publishing',
    'published',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.social_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  platform public.social_platform not null,
  social_text text not null default '',
  media_url text,
  status public.social_publication_status not null default 'draft',
  external_post_id text,
  external_url text,
  error_message text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_item_id, platform)
);

do $$ begin
  create trigger social_publications_set_updated_at
    before update on public.social_publications
    for each row execute procedure public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

create index if not exists social_publications_content_idx
  on public.social_publications(content_item_id, platform);
create index if not exists social_publications_user_status_idx
  on public.social_publications(user_id, status, updated_at desc);
create index if not exists social_publications_recent_idx
  on public.social_publications(updated_at desc);

alter table public.social_publications enable row level security;

do $$ begin
  create policy "users manage own social publications"
    on public.social_publications
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;
