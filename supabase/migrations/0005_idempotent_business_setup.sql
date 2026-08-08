-- DigiSprint idempotent business onboarding
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
  target_business_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if trim(business_name) = '' or trim(business_industry) = '' or trim(business_description) = '' or trim(business_city) = '' or trim(business_state) = '' or trim(brand_tone) = '' or trim(audience_description) = '' then raise exception 'Required setup information is missing'; end if;
  if weekly_post_count < 1 or weekly_post_count > 14 then raise exception 'Weekly post count must be between 1 and 14'; end if;
  if coalesce(array_length(preferred_languages, 1), 0) = 0 or coalesce(array_length(marketing_platforms, 1), 0) = 0 or coalesce(array_length(marketing_goals, 1), 0) = 0 then raise exception 'A language, platform and goal are required'; end if;

  -- Serialize setup attempts for this user so concurrent submissions cannot
  -- create more than one workspace.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text, 0)
  );

  -- Prefer the workspace the user already actively owns or belongs to.
  select member.business_id
    into target_business_id
    from public.business_members as member
    join public.businesses as business on business.id = member.business_id
   where member.user_id = current_user_id
     and member.is_active
   order by
     case when business.owner_id = current_user_id or member.role = 'owner' then 0 else 1 end,
     member.created_at,
     member.business_id
   limit 1
   for update of member, business;

  -- Repair a missing or inactive membership for an already-owned workspace.
  if target_business_id is null then
    select business.id
      into target_business_id
      from public.businesses as business
     where business.owner_id = current_user_id
     order by business.created_at, business.id
     limit 1
     for update;
  end if;

  if target_business_id is null then
    select member.business_id
      into target_business_id
      from public.business_members as member
     where member.user_id = current_user_id
     order by member.created_at, member.business_id
     limit 1
     for update;
  end if;

  -- A new workspace is created only when no existing workspace relationship
  -- can be recovered for the authenticated user.
  if target_business_id is null then
    insert into public.businesses (
      owner_id, name, business_type, industry, description, city, state,
      whatsapp, setup_status
    )
    values (
      current_user_id, trim(business_name), trim(business_industry),
      trim(business_industry), trim(business_description), trim(business_city),
      trim(business_state), nullif(trim(coalesce(business_whatsapp, '')), ''),
      'complete'
    )
    returning id into target_business_id;
  else
    update public.businesses
       set name = trim(business_name),
           business_type = trim(business_industry),
           industry = trim(business_industry),
           description = trim(business_description),
           city = trim(business_city),
           state = trim(business_state),
           whatsapp = nullif(trim(coalesce(business_whatsapp, '')), ''),
           setup_status = 'complete',
           updated_at = now()
     where id = target_business_id;
  end if;

  insert into public.business_members (business_id, user_id, role, is_active)
  values (target_business_id, current_user_id, 'owner', true)
  on conflict (business_id, user_id) do update
    set is_active = true,
        role = case
          when public.business_members.role = 'owner' then public.business_members.role
          when exists (
            select 1 from public.businesses
             where id = target_business_id and owner_id = current_user_id
          ) then 'owner'::public.business_role
          else public.business_members.role
        end;

  insert into public.brand_kits (
    business_id, primary_color, tone, language_preferences
  )
  values (
    target_business_id, brand_primary_color, trim(brand_tone), preferred_languages
  )
  on conflict (business_id) do update
    set primary_color = excluded.primary_color,
        tone = excluded.tone,
        language_preferences = excluded.language_preferences,
        updated_at = now();

  insert into public.content_preferences (
    business_id, platforms, content_goals, target_audience, posts_per_week
  )
  values (
    target_business_id, marketing_platforms, marketing_goals,
    trim(audience_description), weekly_post_count
  )
  on conflict (business_id) do update
    set platforms = excluded.platforms,
        content_goals = excluded.content_goals,
        target_audience = excluded.target_audience,
        posts_per_week = excluded.posts_per_week,
        updated_at = now();

  insert into public.ai_settings (business_id)
  values (target_business_id)
  on conflict (business_id) do nothing;

  return target_business_id;
end;
$$;

revoke all on function public.complete_business_setup(text,text,text,text,text,text,text,text,text[],text[],text[],text,smallint) from public;
grant execute on function public.complete_business_setup(text,text,text,text,text,text,text,text,text[],text[],text[],text,smallint) to authenticated;
