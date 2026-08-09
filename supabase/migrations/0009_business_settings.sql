-- DigiSprint Version 1.5.2 business settings.
alter table public.businesses
  add column if not exists email text,
  add column if not exists address text;

create or replace function public.update_business_settings(
  target_business_id uuid,
  business_name text,
  business_industry text,
  business_description text,
  audience_description text,
  business_website text,
  business_phone text,
  business_email text,
  business_address text,
  business_city text,
  business_state text,
  business_country text
)
returns void language plpgsql security definer set search_path = '' as $$
declare updated_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode = '42501'; end if;

  update public.businesses
  set name = business_name,
      industry = business_industry,
      description = business_description,
      website = business_website,
      phone = business_phone,
      email = business_email,
      address = business_address,
      city = business_city,
      state = business_state,
      country = business_country,
      updated_at = now()
  where id = target_business_id;

  get diagnostics updated_count = row_count;
  if updated_count <> 1 then raise exception 'Business workspace not found' using errcode = 'P0002'; end if;

  update public.content_preferences
  set target_audience = audience_description,
      updated_at = now()
  where business_id = target_business_id;

  get diagnostics updated_count = row_count;
  if updated_count <> 1 then raise exception 'Business preferences not found' using errcode = 'P0002'; end if;
end; $$;

revoke all on function public.update_business_settings(uuid,text,text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.update_business_settings(uuid,text,text,text,text,text,text,text,text,text,text,text) to authenticated;