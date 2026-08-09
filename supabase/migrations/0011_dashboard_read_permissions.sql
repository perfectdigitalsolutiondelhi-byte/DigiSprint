-- Allow authenticated dashboard reads while preserving row-level security.
grant select on table public.posts to authenticated;
grant select on table public.generated_content to authenticated;
