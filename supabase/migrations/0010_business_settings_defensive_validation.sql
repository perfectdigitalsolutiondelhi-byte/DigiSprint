-- Enforce Business Settings validation for direct RPC callers.
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

  if business_name is null or length(btrim(business_name)) < 1 or length(btrim(business_name)) > 120 then
    raise exception using errcode = '22023', message = 'Business name must be between 1 and 120 characters', detail = 'field=name';
  end if;
  if business_industry is null or length(btrim(business_industry)) < 1 or length(btrim(business_industry)) > 120 then
    raise exception using errcode = '22023', message = 'Industry must be between 1 and 120 characters', detail = 'field=industry';
  end if;
  if business_description is not null and length(btrim(business_description)) > 2000 then
    raise exception using errcode = '22023', message = 'Business description must be 2000 characters or fewer', detail = 'field=description';
  end if;
  if audience_description is not null and length(btrim(audience_description)) > 1000 then
    raise exception using errcode = '22023', message = 'Target audience must be 1000 characters or fewer', detail = 'field=targetAudience';
  end if;
  if business_website is not null and (
    length(btrim(business_website)) > 500 or
    btrim(business_website) !~* '^https?://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'
  ) then
    raise exception using errcode = '22023', message = 'Website must be a valid HTTP or HTTPS URL', detail = 'field=website';
  end if;

  update public.businesses
  set name = btrim(business_name),
      industry = btrim(business_industry),
      description = nullif(btrim(business_description), ''),
      website = nullif(btrim(business_website), ''),
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
  set target_audience = nullif(btrim(audience_description), ''),
      updated_at = now()
  where business_id = target_business_id;

  get diagnostics updated_count = row_count;
  if updated_count <> 1 then raise exception 'Business preferences not found' using errcode = 'P0002'; end if;
end; $$;

revoke all on function public.update_business_settings(uuid,text,text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.update_business_settings(uuid,text,text,text,text,text,text,text,text,text,text,text) to authenticated;