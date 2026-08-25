-- Add divider block type. Safe to re-run. Does not alter existing rows.

do $$ begin
  alter type public.article_block_type add value if not exists 'divider';
exception
  when duplicate_object then null;
end $$;
