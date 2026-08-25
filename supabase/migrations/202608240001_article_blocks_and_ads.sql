-- Incremental multimedia article blocks, media library, and ads.
-- Safe to re-run. Does not drop content_items or existing stories.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.article_block_type as enum (
    'text',
    'heading',
    'quote',
    'image',
    'gallery',
    'video',
    'embed',
    'ad',
    'related_articles',
    'divider'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.media_asset_type as enum ('image', 'video');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.advertiser_status as enum ('active', 'paused', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ad_campaign_status as enum (
    'draft',
    'scheduled',
    'active',
    'paused',
    'ended'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ad_creative_type as enum ('image', 'video');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ad_event_type as enum ('impression', 'click');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ad_rotation_mode as enum ('priority', 'random');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  logo text,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  website text,
  notes text not null default '',
  status public.advertiser_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type public.media_asset_type not null,
  bucket text not null default 'content-media',
  storage_path text not null unique,
  url text,
  thumbnail_url text,
  filename text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  width integer,
  height integer,
  duration numeric,
  alt_text text not null default '',
  caption text not null default '',
  source text not null default '',
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists public.article_blocks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.content_items(id) on delete cascade,
  type public.article_block_type not null,
  sort_order integer not null default 0,
  content text not null default '',
  media_url text,
  thumbnail_url text,
  caption text not null default '',
  source text not null default '',
  alt_text text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create trigger article_blocks_set_updated_at
    before update on public.article_blocks
    for each row execute procedure public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

alter table public.content_items
  add column if not exists sponsored boolean not null default false;
alter table public.content_items
  add column if not exists sponsor_id uuid references public.advertisers(id) on delete set null;
alter table public.content_items
  add column if not exists sponsor_label text not null default '';

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  start_date date not null,
  end_date date not null,
  status public.ad_campaign_status not null default 'draft',
  priority integer not null default 0,
  target_url text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  type public.ad_creative_type not null default 'image',
  image_url text,
  video_url text,
  storage_bucket text,
  storage_path text,
  headline text not null default '',
  description text not null default '',
  cta_text text not null default '了解更多',
  target_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  key text not null unique,
  name text not null,
  description text not null default '',
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_campaign_placements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  placement_id uuid not null references public.ad_placements(id) on delete cascade,
  creative_id uuid references public.ad_creatives(id) on delete set null,
  rotation_mode public.ad_rotation_mode not null default 'priority',
  unique (campaign_id, placement_id)
);

create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.ad_campaigns(id) on delete set null,
  creative_id uuid references public.ad_creatives(id) on delete set null,
  placement_id uuid references public.ad_placements(id) on delete set null,
  article_id uuid references public.content_items(id) on delete set null,
  event_type public.ad_event_type not null,
  created_at timestamptz not null default now()
);

insert into public.ad_placements (id, code, key, name, description, width, height)
values
  (
    'a1000000-0000-4000-8000-0000000000a1',
    'A1',
    'homepage_hero',
    '首頁首屏大 Banner',
    '首頁 Navigation 下方。建議 1200 × 400。',
    1200,
    400
  ),
  (
    'a2000000-0000-4000-8000-0000000000a2',
    'A2',
    'homepage_feed',
    '首頁資訊流廣告',
    '新聞卡片列表中間，約每 8 篇插入一次。',
    1200,
    280
  ),
  (
    'a3000000-0000-4000-8000-0000000000a3',
    'A3',
    'article_top',
    '文章頂部廣告',
    '文章標題／作者資訊後方。',
    900,
    250
  ),
  (
    'a4000000-0000-4000-8000-0000000000a4',
    'A4',
    'article_inline',
    '文章內文廣告',
    '文章內容中，可插入多次或由編輯以廣告區塊放入。',
    900,
    250
  ),
  (
    'a5000000-0000-4000-8000-0000000000a5',
    'A5',
    'article_bottom',
    '文章底部廣告',
    '正文結束後、相關文章之前。',
    900,
    250
  ),
  (
    'a6000000-0000-4000-8000-0000000000a6',
    'A6',
    'article_sidebar',
    'Sidebar 廣告',
    'Desktop 文章右側約 300 × 600；手機改到文章內或底部。',
    300,
    600
  ),
  (
    'a7000000-0000-4000-8000-0000000000a7',
    'A7',
    'video',
    '影音廣告',
    '影片區塊附近預留版位。',
    900,
    250
  ),
  (
    'a8000000-0000-4000-8000-0000000000a8',
    'A8',
    'sponsor',
    '全站贊助／合作品牌',
    '合作品牌 Logo、名稱、介紹、連結與 CTA。',
    300,
    180
  )
on conflict (key) do nothing;

create index if not exists article_blocks_article_idx
  on public.article_blocks(article_id, sort_order);
create index if not exists media_assets_user_idx
  on public.media_assets(user_id, created_at desc);
create index if not exists media_assets_type_idx
  on public.media_assets(type, created_at desc);
create index if not exists ad_campaigns_dates_idx
  on public.ad_campaigns(status, start_date, end_date, priority desc);
create index if not exists ad_creatives_campaign_idx
  on public.ad_creatives(campaign_id);
create index if not exists ad_campaign_placements_placement_idx
  on public.ad_campaign_placements(placement_id);
create index if not exists ad_events_campaign_idx
  on public.ad_events(campaign_id, event_type, created_at desc);
create index if not exists content_items_sponsor_idx
  on public.content_items(sponsor_id)
  where sponsored;

alter table public.advertisers enable row level security;
alter table public.media_assets enable row level security;
alter table public.article_blocks enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_placements enable row level security;
alter table public.ad_campaign_placements enable row level security;
alter table public.ad_events enable row level security;

do $$ begin
  create policy "public reads published article blocks"
    on public.article_blocks
    for select to anon, authenticated
    using (
      exists (
        select 1
        from public.content_items item
        where item.id = article_id
          and item.status = 'published'
          and item.published_at <= now()
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "users manage own article blocks"
    on public.article_blocks
    for all to authenticated
    using (
      exists (
        select 1 from public.content_items item
        where item.id = article_id and item.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.content_items item
        where item.id = article_id and item.user_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "users manage own media assets"
    on public.media_assets
    for all to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "authenticated read media assets"
    on public.media_assets
    for select to authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "public reads ad placements"
    on public.ad_placements
    for select to anon, authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;

grant select on public.ad_placements to anon, authenticated;
grant select, insert on public.ad_events to anon, authenticated;
grant select, insert, update, delete on public.article_blocks to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
grant select, insert, update, delete on public.advertisers to authenticated;
grant select, insert, update, delete on public.ad_campaigns to authenticated;
grant select, insert, update, delete on public.ad_creatives to authenticated;
grant select, insert, update, delete on public.ad_campaign_placements to authenticated;
