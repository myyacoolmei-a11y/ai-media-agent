-- Store interleaved article body blocks on the existing content_items row.
-- This is not a new articles table. Cover remains content_items.cover_asset_id.
alter table public.content_items
  add column if not exists article_blocks jsonb not null default '[]'::jsonb;
