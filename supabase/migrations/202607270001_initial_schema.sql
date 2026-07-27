create extension if not exists "pgcrypto";

create type public.project_status as enum ('draft', 'uploading', 'processing', 'completed', 'failed');
create type public.media_type as enum ('video', 'image', 'audio');
create type public.task_status as enum ('queued', 'processing', 'completed', 'failed');
create type public.ai_task_type as enum (
  'extract_audio',
  'transcribe',
  'analyze_visuals',
  'summarize',
  'generate_copy',
  'generate_seo',
  'generate_cover'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  status public.project_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create table public.media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type public.media_type not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  duration_seconds integer check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null unique references public.media(id) on delete cascade,
  language text not null default 'zh-TW',
  text text not null,
  segments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  model text not null,
  version integer not null default 1,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type public.ai_task_type not null,
  status public.task_status not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index media_project_id_idx on public.media(project_id);
create index ai_results_project_id_idx on public.ai_results(project_id);
create index ai_tasks_project_status_idx on public.ai_tasks(project_id, status);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.media enable row level security;
alter table public.transcripts enable row level security;
alter table public.ai_results enable row level security;
alter table public.ai_tasks enable row level security;

create policy "users can read own profile" on public.users
  for select using (auth.uid() = id);
create policy "users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "users manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage media in own projects" on public.media
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "users manage transcripts in own projects" on public.transcripts
  for all using (
    exists (
      select 1 from public.media m
      join public.projects p on p.id = m.project_id
      where m.id = media_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.media m
      join public.projects p on p.id = m.project_id
      where m.id = media_id and p.user_id = auth.uid()
    )
  );

create policy "users manage results in own projects" on public.ai_results
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "users manage tasks in own projects" on public.ai_tasks
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  false,
  524288000,
  array['video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "users manage own project media objects" on storage.objects
  for all to authenticated
  using (bucket_id = 'project-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'project-media' and (storage.foldername(name))[1] = auth.uid()::text);
