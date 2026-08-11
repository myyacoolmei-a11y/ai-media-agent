alter type public.content_status add value if not exists 'scheduled' before 'published';

alter table public.content_items
  add column if not exists social_copy jsonb not null default '{}'::jsonb,
  add column if not exists production_data jsonb not null default '{}'::jsonb,
  add column if not exists scheduled_at timestamptz;

alter table public.content_assets
  add column if not exists transform_settings jsonb not null default '{}'::jsonb,
  add column if not exists variant_of uuid references public.content_assets(id) on delete set null;

alter table public.brand_style_profiles
  add column if not exists brand_name text not null default '',
  add column if not exists article_tone text not null default '',
  add column if not exists text_style text not null default '',
  add column if not exists forbidden_expressions text not null default '',
  add column if not exists preferred_video_length text not null default '',
  add column if not exists preferred_image_ratio text not null default '1:1',
  add column if not exists image_visual_style text not null default '',
  add column if not exists social_copy_style text not null default '';

update public.brand_style_profiles
set
  brand_name = case when brand_name = '' then style_name else brand_name end,
  article_tone = case when article_tone = '' then preferred_tone else article_tone end,
  text_style = case
    when text_style = '' then concat_ws(
      E'\n',
      brand_personality,
      preferred_hook_style,
      preferred_story_structure
    )
    else text_style
  end,
  forbidden_expressions = case
    when forbidden_expressions = '' then concat_ws(
      E'\n',
      forbidden_tone,
      negative_examples
    )
    else forbidden_expressions
  end,
  preferred_video_length = case
    when preferred_video_length = '' then preferred_editing_pace
    else preferred_video_length
  end,
  image_visual_style = case
    when image_visual_style = '' then preferred_color_direction
    else image_visual_style
  end,
  social_copy_style = case
    when social_copy_style = '' then preferred_tone
    else social_copy_style
  end;

alter table public.render_jobs
  alter column project_id drop not null,
  add column if not exists content_item_id uuid references public.content_items(id) on delete cascade,
  add column if not exists output_asset_id uuid references public.content_assets(id) on delete set null;

alter table public.render_jobs
  add constraint render_jobs_owner_target_check
  check (project_id is not null or content_item_id is not null);

create index if not exists render_jobs_content_item_idx
  on public.render_jobs(content_item_id, created_at desc);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  feature text not null,
  provider text not null,
  model text not null,
  status text not null check (status in ('requested', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_idx
  on public.ai_usage_events(user_id, created_at desc);

alter table public.ai_usage_events enable row level security;

create policy "users read own AI usage" on public.ai_usage_events
  for select using (auth.uid() = user_id);
create policy "users create own AI usage" on public.ai_usage_events
  for insert with check (auth.uid() = user_id);
