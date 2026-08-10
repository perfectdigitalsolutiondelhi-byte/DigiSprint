-- Reconcile authenticated workspace table privileges with RLS policies.

alter table public.business_members enable row level security;
alter table public.businesses enable row level security;
alter table public.brand_kits enable row level security;
alter table public.content_preferences enable row level security;
alter table public.posts enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.ai_settings enable row level security;
alter table public.generated_content enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.strategy_revisions enable row level security;

drop policy if exists "members read membership" on public.business_members;
create policy "members read membership" on public.business_members
  for select using (public.is_business_member(business_id));

drop policy if exists "business members read business" on public.businesses;
create policy "business members read business" on public.businesses
  for select using (public.is_business_member(id));
drop policy if exists "owners update business" on public.businesses;
create policy "owners update business" on public.businesses
  for update using (public.is_business_owner(id)) with check (public.is_business_owner(id));

drop policy if exists "members read brand kit" on public.brand_kits;
create policy "members read brand kit" on public.brand_kits
  for select using (public.is_business_member(business_id));
drop policy if exists "owners manage brand kit" on public.brand_kits;
create policy "owners manage brand kit" on public.brand_kits
  for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));

drop policy if exists "members read content preferences" on public.content_preferences;
create policy "members read content preferences" on public.content_preferences
  for select using (public.is_business_member(business_id));
drop policy if exists "owners manage content preferences" on public.content_preferences;
create policy "owners manage content preferences" on public.content_preferences
  for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));

drop policy if exists "members manage posts" on public.posts;
create policy "members manage posts" on public.posts
  for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

drop policy if exists "members read ai jobs" on public.ai_jobs;
create policy "members read ai jobs" on public.ai_jobs
  for select using (public.is_business_member(business_id));

drop policy if exists "members read ai settings" on public.ai_settings;
create policy "members read ai settings" on public.ai_settings
  for select using (public.is_business_member(business_id));
drop policy if exists "owners manage ai settings" on public.ai_settings;
create policy "owners manage ai settings" on public.ai_settings
  for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));

drop policy if exists "members read generated content" on public.generated_content;
create policy "members read generated content" on public.generated_content
  for select using (public.is_business_member(business_id));
drop policy if exists "members update generated content status" on public.generated_content;
create policy "members update generated content status" on public.generated_content
  for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

drop policy if exists "members read ai usage" on public.ai_usage_events;
create policy "members read ai usage" on public.ai_usage_events
  for select using (public.is_business_member(business_id));

drop policy if exists "owners read strategy revisions" on public.strategy_revisions;
create policy "owners read strategy revisions" on public.strategy_revisions
  for select using (public.is_business_owner(business_id));

grant select on table public.business_members to authenticated;
grant select, update on table public.businesses to authenticated;
grant select, insert, update, delete on table public.brand_kits to authenticated;
grant select, insert, update, delete on table public.content_preferences to authenticated;
grant select, insert, update, delete on table public.posts to authenticated;
grant select on table public.ai_jobs to authenticated;
grant select, insert, update, delete on table public.ai_settings to authenticated;
grant select on table public.generated_content to authenticated;
grant update (title, structured_content, plain_text_preview, status, updated_at) on table public.generated_content to authenticated;
grant select on table public.ai_usage_events to authenticated;
grant select on table public.strategy_revisions to authenticated;

revoke insert, update, delete, truncate, references, trigger on table public.ai_jobs from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on table public.ai_usage_events from authenticated, anon;
revoke insert, delete, truncate, references, trigger on table public.generated_content from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on table public.strategy_revisions from authenticated, anon;
