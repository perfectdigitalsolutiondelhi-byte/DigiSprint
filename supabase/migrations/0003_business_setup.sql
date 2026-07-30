-- DigiSprint Version 1.2 atomic business setup
create or replace function public.complete_business_setup(
  business_name text, business_industry text, business_description text,
  business_city text, business_state text, business_whatsapp text,
  brand_tone text, brand_primary_color text, preferred_languages text[],
  marketing_platforms text[], marketing_goals text[], audience_description text,
  weekly_post_count smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_business_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.business_members where user_id = current_user_id and is_active) then raise exception 'A business workspace already exists'; end if;
  if trim(business_name) = '' or trim(business_industry) = '' or trim(business_description) = '' or trim(business_city) = '' or trim(business_state) = '' or trim(brand_tone) = '' or trim(audience_description) = '' then raise exception 'Required setup information is missing'; end if;
  if weekly_post_count < 1 or weekly_post_count > 14 then raise exception 'Weekly post count must be between 1 and 14'; end if;
  if coalesce(array_length(preferred_languages, 1), 0) = 0 or coalesce(array_length(marketing_platforms, 1), 0) = 0 or coalesce(array_length(marketing_goals, 1), 0) = 0 then raise exception 'A language, platform and goal are required'; end if;

  insert into public.businesses (owner_id, name, business_type, industry, description, city, state, whatsapp, setup_status)
  values (current_user_id, trim(business_name), trim(business_industry), trim(business_industry), trim(business_description), trim(business_city), trim(business_state), nullif(trim(coalesce(business_whatsapp, '')), ''), 'complete')
  returning id into new_business_id;
  insert into public.business_members (business_id, user_id, role) values (new_business_id, current_user_id, 'owner');
  insert into public.brand_kits (business_id, primary_color, tone, language_preferences) values (new_business_id, brand_primary_color, brand_tone, preferred_languages);
  insert into public.content_preferences (business_id, platforms, content_goals, target_audience, posts_per_week) values (new_business_id, marketing_platforms, marketing_goals, trim(audience_description), weekly_post_count);
  return new_business_id;
end;
$$;

revoke all on function public.complete_business_setup(text,text,text,text,text,text,text,text,text[],text[],text[],text,smallint) from public;
grant execute on function public.complete_business_setup(text,text,text,text,text,text,text,text,text[],text[],text[],text,smallint) to authenticated;
