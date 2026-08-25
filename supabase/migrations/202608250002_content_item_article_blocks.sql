-- 文章內文多圖片：只在既有 content_items 加上 article_blocks。
-- 不會新建文章表，不會刪除既有文章，封面仍使用 cover_asset_id。
-- 可重複執行。

alter table public.content_items
  add column if not exists article_blocks jsonb not null default '[]'::jsonb;

alter table public.content_items enable row level security;
alter table public.content_assets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_items'
      and policyname = 'users manage own content items'
  ) then
    create policy "users manage own content items" on public.content_items
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_items'
      and policyname = 'public reads published content items'
  ) then
    create policy "public reads published content items" on public.content_items
      for select to anon, authenticated
      using (status = 'published' and published_at <= now());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_assets'
      and policyname = 'users manage own content assets'
  ) then
    create policy "users manage own content assets" on public.content_assets
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'content_assets'
      and policyname = 'public reads assets of published content'
  ) then
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
  end if;
end $$;

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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'users manage own content media objects'
  ) then
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
  end if;
end $$;
