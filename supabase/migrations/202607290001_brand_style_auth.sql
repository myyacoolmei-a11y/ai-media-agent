-- Anonymous MVP projects cannot be safely assigned to an authenticated owner.
-- Remove them before enforcing permanent auth.users ownership.
delete from public.projects where user_id is null;

alter table public.projects
  alter column user_id set not null,
  drop column if exists access_token_hash;

create table public.brand_style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  style_name text not null check (char_length(style_name) between 2 and 100),
  brand_description text not null,
  target_audience text not null,
  brand_personality text not null,
  preferred_tone text not null,
  forbidden_tone text not null default '',
  preferred_hook_style text not null,
  preferred_story_structure text not null,
  preferred_editing_pace text not null,
  preferred_subtitle_style text not null,
  preferred_color_direction text not null,
  preferred_music_direction text not null,
  preferred_cta text not null,
  logo_position text not null,
  intro_template text not null default '',
  outro_template text not null default '',
  reference_content jsonb not null default '[]'::jsonb,
  negative_examples text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, style_name)
);

create trigger brand_style_profiles_set_updated_at
  before update on public.brand_style_profiles
  for each row execute procedure public.set_updated_at();

alter table public.projects
  add column style_profile_id uuid,
  add column selected_cover_text text,
  add constraint projects_style_owner_fk
    foreign key (style_profile_id, user_id)
    references public.brand_style_profiles(id, user_id)
    on delete restrict;

alter table public.projects alter column style_profile_id set not null;

alter table public.media
  add column user_id uuid not null references auth.users(id) on delete cascade;
alter table public.transcripts
  add column user_id uuid not null references auth.users(id) on delete cascade;
alter table public.ai_results
  add column user_id uuid not null references auth.users(id) on delete cascade;
alter table public.ai_tasks
  add column user_id uuid not null references auth.users(id) on delete cascade;

create table public.style_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  style_profile_id uuid not null,
  original_suggestion jsonb not null,
  user_action text not null,
  final_choice jsonb not null,
  feedback_type text not null,
  created_at timestamptz not null default now(),
  foreign key (style_profile_id, user_id)
    references public.brand_style_profiles(id, user_id)
    on delete cascade
);

create table public.preference_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  style_profile_id uuid not null,
  feedback_type text not null,
  occurrence_count integer not null check (occurrence_count >= 3),
  explanation text not null,
  suggested_changes jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  foreign key (style_profile_id, user_id)
    references public.brand_style_profiles(id, user_id)
    on delete cascade
);

create unique index preference_suggestions_pending_idx
  on public.preference_suggestions(style_profile_id, feedback_type)
  where status = 'pending';

create table public.personal_editors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  active_style_profile_id uuid,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (active_style_profile_id, user_id)
    references public.brand_style_profiles(id, user_id)
    on delete no action
);

create trigger personal_editors_set_updated_at
  before update on public.personal_editors
  for each row execute procedure public.set_updated_at();

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.task_status not null default 'queued',
  settings jsonb not null default '{}'::jsonb,
  output_storage_path text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index brand_style_profiles_user_id_idx
  on public.brand_style_profiles(user_id);
create index style_feedback_user_profile_idx
  on public.style_feedback(user_id, style_profile_id, feedback_type);
create index preference_suggestions_user_idx
  on public.preference_suggestions(user_id, status);
create index media_user_id_idx on public.media(user_id);
create index transcripts_user_id_idx on public.transcripts(user_id);
create index ai_results_user_id_idx on public.ai_results(user_id);
create index ai_tasks_user_id_idx on public.ai_tasks(user_id);
create index render_jobs_user_id_idx on public.render_jobs(user_id);

alter table public.brand_style_profiles enable row level security;
alter table public.style_feedback enable row level security;
alter table public.preference_suggestions enable row level security;
alter table public.personal_editors enable row level security;
alter table public.render_jobs enable row level security;

create policy "users manage own brand styles" on public.brand_style_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own style feedback" on public.style_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own preference suggestions" on public.preference_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own personal editor" on public.personal_editors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own render jobs" on public.render_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage media by owner" on public.media
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage transcripts by owner" on public.transcripts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage AI results by owner" on public.ai_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage AI tasks by owner" on public.ai_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.ai_results is
  'Persisted AiAnalysis output. Every row is permanently owned by auth.users.id.';
comment on table public.preference_suggestions is
  'Style updates inferred from repeated feedback. Profiles change only after explicit acceptance.';
