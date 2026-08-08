-- Allow authenticated application users to read workspace data.
-- Row-level security continues to restrict every result to authorized rows.
grant select on table public.business_members to authenticated;
grant select on table public.businesses to authenticated;
grant select on table public.brand_kits to authenticated;
grant select on table public.content_preferences to authenticated;
grant select on table public.ai_settings to authenticated;
