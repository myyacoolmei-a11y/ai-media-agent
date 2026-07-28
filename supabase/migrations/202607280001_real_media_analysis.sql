alter table public.projects
  alter column user_id drop not null,
  add column if not exists brief jsonb not null default '{}'::jsonb,
  add column if not exists access_token_hash text,
  add column if not exists ai_task_summary text,
  add column if not exists selected_copy_version text,
  add column if not exists selected_editing_version text,
  add column if not exists error text;

create unique index if not exists projects_access_token_hash_idx
  on public.projects(access_token_hash)
  where access_token_hash is not null;

alter table public.projects
  add constraint projects_selected_copy_version_check
    check (selected_copy_version is null or selected_copy_version in ('short', 'story', 'professional')),
  add constraint projects_selected_editing_version_check
    check (selected_editing_version is null or selected_editing_version in ('quick', 'social', 'full'));

update storage.buckets
set allowed_mime_types = array[
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'image/jpeg',
  'image/png',
  'image/webp'
]
where id = 'project-media';

comment on column public.projects.brief is
  'Original user production requirements, platforms, purpose, style, target duration and notes.';
comment on column public.projects.access_token_hash is
  'SHA-256 hash of the anonymous project access token stored in an HTTP-only cookie.';
