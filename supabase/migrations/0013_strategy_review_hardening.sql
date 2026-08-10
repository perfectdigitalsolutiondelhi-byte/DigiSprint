-- DigiSprint Version 1.5.2 Strategy Review Workspace production hardening.

create or replace function public.validate_strategy_review_section(target_section text, target_content jsonb)
returns void language plpgsql immutable set search_path = '' as $$
declare item jsonb; nested jsonb; expected_day integer := 1;
begin
  if target_content is null or octet_length(target_content::text) > 100000 then raise exception 'Invalid section content' using errcode='22023'; end if;

  if target_section in ('objective','language','specialFocus','executiveSummary') then
    if jsonb_typeof(target_content) <> 'string' then raise exception 'Section content must be text' using errcode='22023'; end if;
    if target_section='language' and target_content#>>'{}' not in ('en','hi','hinglish') then raise exception 'Invalid strategy language' using errcode='22023'; end if;
    if target_section='objective' and length(btrim(target_content#>>'{}')) not between 2 and 500 then raise exception 'Invalid strategy objective' using errcode='22023'; end if;
    if target_section='specialFocus' and length(btrim(target_content#>>'{}')) > 1000 then raise exception 'Invalid special focus' using errcode='22023'; end if;
    if target_section='executiveSummary' and length(btrim(target_content#>>'{}')) not between 1 and 2000 then raise exception 'Invalid executive summary' using errcode='22023'; end if;
    return;
  end if;

  if target_section='businessSummary' then
    if jsonb_typeof(target_content)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(target_content) as keys(key)) is distinct from array['description','industry','location','name'] then raise exception 'Invalid business summary' using errcode='22023'; end if;
    if jsonb_typeof(target_content->'name')<>'string' or length(btrim(target_content->>'name')) not between 1 and 240 or jsonb_typeof(target_content->'industry')<>'string' or length(btrim(target_content->>'industry')) not between 1 and 240 or jsonb_typeof(target_content->'description')<>'string' or length(btrim(target_content->>'description'))>2000 or jsonb_typeof(target_content->'location')<>'string' or length(btrim(target_content->>'location'))>240 then raise exception 'Invalid business summary fields' using errcode='22023'; end if;
    return;
  end if;

  if target_section='swot' then
    if jsonb_typeof(target_content)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(target_content) as keys(key)) is distinct from array['opportunities','strengths','threats','weaknesses'] then raise exception 'Invalid SWOT' using errcode='22023'; end if;
    foreach nested in array array[target_content->'strengths',target_content->'weaknesses',target_content->'opportunities',target_content->'threats'] loop
      if jsonb_typeof(nested)<>'array' or jsonb_array_length(nested) not between 1 and 8 or exists(select 1 from jsonb_array_elements(nested) value where jsonb_typeof(value)<>'string' or length(btrim(value#>>'{}')) not between 1 and 240) then raise exception 'Invalid SWOT list' using errcode='22023'; end if;
    end loop;
    return;
  end if;

  if target_section in ('targetAudience','marketingChannels','kpis','checklist','calendar','weeklyPlan') then
    if jsonb_typeof(target_content)<>'array' then raise exception 'Section content must be a list' using errcode='22023'; end if;
  elsif target_section in ('positioning','budget') then
    if jsonb_typeof(target_content)<>'object' then raise exception 'Section content must be an object' using errcode='22023'; end if;
  else raise exception 'Invalid strategy section' using errcode='22023';
  end if;

  if target_section='targetAudience' then
    if jsonb_array_length(target_content) not between 1 and 5 then raise exception 'Invalid audience count' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content) loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['description','priority','segment'] or jsonb_typeof(item->'segment')<>'string' or length(btrim(item->>'segment')) not between 1 and 240 or jsonb_typeof(item->'description')<>'string' or length(btrim(item->>'description')) not between 1 and 900 or item->>'priority' not in ('primary','secondary','emerging') then raise exception 'Invalid audience entry' using errcode='22023'; end if;
    end loop;
  elsif target_section='marketingChannels' then
    if jsonb_array_length(target_content) not between 1 and 8 then raise exception 'Invalid channel count' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content) loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['cadence','contentMix','objective','platform','successSignals'] then raise exception 'Invalid channel entry' using errcode='22023'; end if;
      if exists(select 1 from jsonb_each(item) pair where pair.key in ('platform','objective','cadence') and (jsonb_typeof(pair.value)<>'string' or length(btrim(pair.value#>>'{}')) not between 1 and 240)) then raise exception 'Invalid channel text' using errcode='22023'; end if;
      foreach nested in array array[item->'contentMix',item->'successSignals'] loop if jsonb_typeof(nested)<>'array' or jsonb_array_length(nested) not between 1 and 6 or exists(select 1 from jsonb_array_elements(nested) value where jsonb_typeof(value)<>'string' or length(btrim(value#>>'{}')) not between 1 and 240) then raise exception 'Invalid channel list' using errcode='22023'; end if; end loop;
      if jsonb_array_length(item->'contentMix')<2 or jsonb_array_length(item->'successSignals')>5 then raise exception 'Invalid channel list size' using errcode='22023'; end if;
    end loop;
  elsif target_section='kpis' then
    if jsonb_array_length(target_content) not between 1 and 12 then raise exception 'Invalid KPI count' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content) loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['channel','signals'] or jsonb_typeof(item->'channel')<>'string' or length(btrim(item->>'channel')) not between 1 and 240 or jsonb_typeof(item->'signals')<>'array' or jsonb_array_length(item->'signals') not between 1 and 8 or exists(select 1 from jsonb_array_elements(item->'signals') value where jsonb_typeof(value)<>'string' or length(btrim(value#>>'{}')) not between 1 and 240) then raise exception 'Invalid KPI entry' using errcode='22023'; end if;
    end loop;
  elsif target_section='checklist' then
    if jsonb_array_length(target_content) not between 5 and 15 then raise exception 'Invalid checklist count' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content) loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['action','outcome','timeframe'] or exists(select 1 from jsonb_each(item) pair where jsonb_typeof(pair.value)<>'string' or length(btrim(pair.value#>>'{}')) not between 1 and 240) then raise exception 'Invalid checklist entry' using errcode='22023'; end if;
    end loop;
  elsif target_section='calendar' then
    if jsonb_array_length(target_content)<>30 then raise exception 'Calendar must contain exactly 30 days' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content) loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['callToAction','day','format','objective','platform','topic'] or jsonb_typeof(item->'day')<>'number' or item->'day'<>to_jsonb(expected_day) or exists(select 1 from jsonb_each(item) pair where pair.key<>'day' and (jsonb_typeof(pair.value)<>'string' or length(btrim(pair.value#>>'{}')) not between 1 and 240)) then raise exception 'Invalid calendar entry' using errcode='22023'; end if;
      expected_day:=expected_day+1;
    end loop;
  elsif target_section='positioning' then
    if (select array_agg(key order by key) from jsonb_object_keys(target_content) as keys(key)) is distinct from array['growthBarriers','position','strengthsToLeverage'] or jsonb_typeof(target_content->'position')<>'string' or length(btrim(target_content->>'position')) not between 1 and 900 then raise exception 'Invalid positioning' using errcode='22023'; end if;
    foreach nested in array array[target_content->'strengthsToLeverage',target_content->'growthBarriers'] loop if jsonb_typeof(nested)<>'array' or jsonb_array_length(nested) not between 1 and 8 or exists(select 1 from jsonb_array_elements(nested) value where jsonb_typeof(value)<>'string' or length(btrim(value#>>'{}')) not between 1 and 240) then raise exception 'Invalid positioning list' using errcode='22023'; end if; end loop;
  elsif target_section='weeklyPlan' then
    if jsonb_array_length(target_content) not between 3 and 8 then raise exception 'Invalid weekly plan count' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content) loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['priority','rank','reason','timeframe'] or not (case when jsonb_typeof(item->'rank')='number' then (item->>'rank')::numeric=trunc((item->>'rank')::numeric) and (item->>'rank')::numeric between 1 and 10 else false end) or jsonb_typeof(item->'priority')<>'string' or length(btrim(item->>'priority')) not between 1 and 240 or jsonb_typeof(item->'timeframe')<>'string' or length(btrim(item->>'timeframe')) not between 1 and 240 or jsonb_typeof(item->'reason')<>'string' or length(btrim(item->>'reason')) not between 1 and 900 then raise exception 'Invalid weekly plan entry' using errcode='22023'; end if;
    end loop;
  elsif target_section='budget' then
    if (select array_agg(key order by key) from jsonb_object_keys(target_content) as keys(key)) is distinct from array['advertising','allocation'] or jsonb_typeof(target_content->'allocation')<>'object' or jsonb_typeof(target_content->'advertising')<>'array' then raise exception 'Invalid budget' using errcode='22023'; end if;
    item:=target_content->'allocation';
    if (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['allocationNote','approach','growthBudget','lowBudget'] or exists(select 1 from jsonb_each(item) pair where pair.key in ('approach','allocationNote') and (jsonb_typeof(pair.value)<>'string' or length(btrim(pair.value#>>'{}')) not between 1 and 900)) then raise exception 'Invalid budget allocation' using errcode='22023'; end if;
    foreach nested in array array[item->'lowBudget',item->'growthBudget'] loop if jsonb_typeof(nested)<>'array' or jsonb_array_length(nested) not between 1 and 8 or exists(select 1 from jsonb_array_elements(nested) value where jsonb_typeof(value)<>'string' or length(btrim(value#>>'{}')) not between 1 and 240) then raise exception 'Invalid budget list' using errcode='22023'; end if; end loop;
    if jsonb_array_length(target_content->'advertising') not between 1 and 5 then raise exception 'Invalid advertising count' using errcode='22023'; end if;
    for item in select value from jsonb_array_elements(target_content->'advertising') loop
      if jsonb_typeof(item)<>'object' or (select array_agg(key order by key) from jsonb_object_keys(item) as keys(key)) is distinct from array['audience','channel','creativeDirection','measurement','objective'] or exists(select 1 from jsonb_each(item) pair where pair.key in ('audience','channel','objective') and (jsonb_typeof(pair.value)<>'string' or length(btrim(pair.value#>>'{}')) not between 1 and 240)) or jsonb_typeof(item->'creativeDirection')<>'string' or length(btrim(item->>'creativeDirection')) not between 1 and 900 or jsonb_typeof(item->'measurement')<>'array' or jsonb_array_length(item->'measurement') not between 1 and 8 or exists(select 1 from jsonb_array_elements(item->'measurement') value where jsonb_typeof(value)<>'string' or length(btrim(value#>>'{}')) not between 1 and 240) then raise exception 'Invalid advertising entry' using errcode='22023'; end if;
    end loop;
  end if;
end; $$;

create or replace function public.create_strategy_revision(target_business_id uuid,target_strategy_id uuid,target_section text,target_content jsonb,target_expected_revision_number integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid:=auth.uid(); previous_id uuid; current_number integer; current_status text;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_expected_revision_number is null or target_expected_revision_number<0 then raise exception 'Expected revision number is required' using errcode='22023'; end if;
  perform public.validate_strategy_review_section(target_section,target_content);
  perform pg_advisory_xact_lock(hashtextextended(target_strategy_id::text||':revision',0));
  select status::text into current_status from public.generated_content where id=target_strategy_id and business_id=target_business_id and content_type='marketing_strategy' for update;
  if current_status is null then raise exception 'Strategy not found' using errcode='P0002'; end if;
  if current_status not in ('generated','edited') then raise exception 'Only draft strategies can be edited' using errcode='22023'; end if;
  select id,revision_number into previous_id,current_number from public.strategy_revisions where strategy_id=target_strategy_id order by revision_number desc limit 1;
  current_number:=coalesce(current_number,0);
  if current_number<>target_expected_revision_number then raise exception 'Strategy revision conflict' using errcode='40001',detail='The strategy has a newer revision. Reload before saving.'; end if;
  insert into public.strategy_revisions(business_id,strategy_id,revision_number,editor_id,edited_section,section_content,previous_revision_id) values(target_business_id,target_strategy_id,current_number+1,current_user_id,target_section,target_content,previous_id);
  update public.generated_content set status='edited',review_reason=null,updated_at=now() where id=target_strategy_id;
  return current_number+1;
end; $$;

create or replace function public.set_strategy_review_status(target_business_id uuid,target_strategy_id uuid,target_status text,target_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid:=auth.uid(); current_status text;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_status not in ('accepted','rejected','archived') then raise exception 'Invalid strategy status' using errcode='22023'; end if;
  if target_reason is not null and length(btrim(target_reason))>500 then raise exception 'Review reason must be 500 characters or fewer' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text||':marketing_strategy',0));
  select status::text into current_status from public.generated_content where id=target_strategy_id and business_id=target_business_id and content_type='marketing_strategy' for update;
  if current_status is null then raise exception 'Strategy not found' using errcode='P0002'; end if;
  if not ((current_status in ('generated','edited') and target_status in ('accepted','rejected','archived')) or (current_status in ('accepted','rejected') and target_status='archived')) then raise exception 'Invalid strategy state transition' using errcode='22023',detail='Archived strategies are immutable.'; end if;
  if target_status='accepted' then
    update public.generated_content set status='archived',updated_at=now() where business_id=target_business_id and content_type='marketing_strategy' and status='accepted' and id<>target_strategy_id;
    update public.generated_content set status='accepted',review_reason=null,updated_at=now() where id=target_strategy_id;
  elsif target_status='rejected' then update public.generated_content set status='rejected',review_reason=nullif(btrim(target_reason),''),updated_at=now() where id=target_strategy_id;
  else update public.generated_content set status='archived',review_reason=null,updated_at=now() where id=target_strategy_id;
  end if;
end; $$;

create or replace function public.get_strategy_revision_snapshot(target_business_id uuid,target_strategy_id uuid,target_revision_number integer)
returns table(edited_section text,section_content jsonb) language sql stable security definer set search_path='' as $$
  select distinct on (revision.edited_section) revision.edited_section,revision.section_content
  from public.strategy_revisions revision
  where auth.uid() is not null and public.is_business_owner(target_business_id) and revision.business_id=target_business_id and revision.strategy_id=target_strategy_id and revision.revision_number<=target_revision_number
  order by revision.edited_section,revision.revision_number desc
$$;

drop function if exists public.create_strategy_revision(uuid,uuid,text,jsonb);
revoke all on function public.validate_strategy_review_section(text,jsonb) from public;
revoke all on function public.create_strategy_revision(uuid,uuid,text,jsonb,integer) from public;
revoke all on function public.get_strategy_revision_snapshot(uuid,uuid,integer) from public;
grant execute on function public.create_strategy_revision(uuid,uuid,text,jsonb,integer) to authenticated;
grant execute on function public.get_strategy_revision_snapshot(uuid,uuid,integer) to authenticated;
