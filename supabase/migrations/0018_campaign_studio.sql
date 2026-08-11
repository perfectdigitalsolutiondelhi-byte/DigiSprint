-- DigiSprint Version 1.7 standalone AI Campaign Studio.

create table if not exists public.campaign_studio_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  week_id uuid not null references public.weekly_strategy_weeks(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 3 and 120),
  objective text not null check (char_length(btrim(objective)) between 3 and 500),
  status text not null default 'draft' check (status in ('draft','active','completed','archived')),
  ai_content_id uuid unique references public.generated_content(id) on delete restrict,
  input_fingerprint text check (input_fingerprint is null or input_fingerprint ~ '^[0-9a-f]{64}$'),
  current_plan jsonb,
  has_plan boolean generated always as (current_plan is not null) stored,
  plan_status text not null default 'awaiting_generation' check (plan_status in ('awaiting_generation','ready')),
  last_generated_at timestamptz,
  version integer not null default 0 check (version >= 0),
  idempotency_key text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id,idempotency_key),
  unique (id,business_id)
);

create table if not exists public.campaign_studio_source_posts (
  campaign_id uuid not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  post_day_id uuid not null references public.ai_post_days(id) on delete restrict,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  primary key (campaign_id,post_day_id),
  foreign key (campaign_id,business_id) references public.campaign_studio_campaigns(id,business_id) on delete cascade
);

create table if not exists public.campaign_studio_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  asset_type text not null check (asset_type in ('copy','image','video','audio','landing_page','other')),
  title text not null check (char_length(btrim(title)) between 1 and 500),
  brief text not null check (char_length(btrim(brief)) between 1 and 1500),
  status text not null default 'planned' check (status in ('planned','in_progress','ready','published')),
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id,day_number,title),
  foreign key (campaign_id,business_id) references public.campaign_studio_campaigns(id,business_id) on delete cascade
);

create index if not exists campaign_studio_campaigns_business_idx on public.campaign_studio_campaigns(business_id,updated_at desc);
create index if not exists campaign_studio_sources_campaign_idx on public.campaign_studio_source_posts(campaign_id);
create index if not exists campaign_studio_assets_campaign_idx on public.campaign_studio_assets(campaign_id,day_number);
alter table public.campaign_studio_campaigns enable row level security;
alter table public.campaign_studio_source_posts enable row level security;
alter table public.campaign_studio_assets enable row level security;
drop policy if exists "members read campaign studio campaigns" on public.campaign_studio_campaigns;
drop policy if exists "members read campaign studio sources" on public.campaign_studio_source_posts;
drop policy if exists "members read campaign studio assets" on public.campaign_studio_assets;
create policy "members read campaign studio campaigns" on public.campaign_studio_campaigns for select using (public.is_business_member(business_id));
create policy "members read campaign studio sources" on public.campaign_studio_source_posts for select using (public.is_business_member(business_id));
create policy "members read campaign studio assets" on public.campaign_studio_assets for select using (public.is_business_member(business_id));
grant select on table public.campaign_studio_campaigns,public.campaign_studio_source_posts,public.campaign_studio_assets to authenticated;
revoke insert,update,delete,truncate,references,trigger on table public.campaign_studio_campaigns,public.campaign_studio_source_posts,public.campaign_studio_assets from authenticated,anon;

create or replace function public.list_campaign_studio_approved_weeks(target_business_id uuid,target_offset integer,target_limit integer)
returns table(id uuid,week_number integer,weekly_goal text,total_count bigint)
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_offset is null or target_offset<0 or target_limit is null or target_limit not between 1 and 20 then raise exception 'Invalid pagination' using errcode='22023'; end if;
  return query select week.id,week.week_number,week.content->>'weeklyGoal',count(*) over() from public.weekly_strategy_weeks week where week.business_id=target_business_id and week.status='approved' order by week.updated_at desc offset target_offset limit target_limit;
end; $$;
create or replace function public.create_campaign_studio_campaign(target_business_id uuid,target_week_id uuid,target_name text,target_objective text,target_post_day_ids uuid[],target_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid; existing_id uuid; source_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_name is null or target_objective is null or target_idempotency_key is null or target_post_day_ids is null or char_length(btrim(target_name)) not between 3 and 120 or char_length(btrim(target_objective)) not between 3 and 500 or target_idempotency_key !~ '^[A-Za-z0-9:_-]{12,160}$' or cardinality(target_post_day_ids) not between 1 and 7 then raise exception 'Invalid campaign input' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text||':campaign:'||target_idempotency_key,0));
  select id into existing_id from public.campaign_studio_campaigns where business_id=target_business_id and idempotency_key=target_idempotency_key and week_id=target_week_id and name=btrim(target_name) and objective=btrim(target_objective) and not exists (select post_day_id from public.campaign_studio_source_posts where campaign_id=campaign_studio_campaigns.id except select selected.value from unnest(target_post_day_ids) as selected(value)) and not exists (select selected.value from unnest(target_post_day_ids) as selected(value) except select post_day_id from public.campaign_studio_source_posts where campaign_id=campaign_studio_campaigns.id);
  if existing_id is not null then return existing_id; end if;
  if exists(select 1 from public.campaign_studio_campaigns where business_id=target_business_id and idempotency_key=target_idempotency_key) then raise exception 'Campaign request conflict' using errcode='40001'; end if;
  if not exists(select 1 from public.weekly_strategy_weeks where id=target_week_id and business_id=target_business_id and status='approved') then raise exception 'Approved strategy week not found' using errcode='P0002'; end if;
  select count(*) into source_count from public.ai_post_days where id=any(target_post_day_ids) and business_id=target_business_id and week_id=target_week_id;
  if source_count<>cardinality(target_post_day_ids) or source_count<>(select count(distinct selected.value) from unnest(target_post_day_ids) as selected(value)) then raise exception 'Approved post selection is invalid' using errcode='22023'; end if;
  insert into public.campaign_studio_campaigns(business_id,week_id,name,objective,idempotency_key,created_by) values(target_business_id,target_week_id,btrim(target_name),btrim(target_objective),target_idempotency_key,auth.uid()) returning id into result_id;
  insert into public.campaign_studio_source_posts(campaign_id,business_id,post_day_id,approved_by) select result_id,target_business_id,selected.value,auth.uid() from unnest(target_post_day_ids) as selected(value);
  return result_id;
end; $$;

create or replace function public.is_valid_campaign_studio_plan(target_plan jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare item jsonb; item_index integer; seen_values text[];
begin
  if target_plan is null or jsonb_typeof(target_plan)<>'object' or (select count(*) from jsonb_object_keys(target_plan))<>9 or not target_plan ?& array['campaignSummary','audience','coreMessage','channels','calendar','assets','suggestions','kpis','milestones'] then return false; end if;
  if jsonb_typeof(target_plan->'campaignSummary')<>'string' or char_length(btrim(target_plan->>'campaignSummary')) not between 1 and 1500 or jsonb_typeof(target_plan->'audience')<>'string' or char_length(btrim(target_plan->>'audience')) not between 1 and 1500 or jsonb_typeof(target_plan->'coreMessage')<>'string' or char_length(btrim(target_plan->>'coreMessage')) not between 1 and 1500 then return false; end if;

  if jsonb_typeof(target_plan->'channels')<>'array' or jsonb_array_length(target_plan->'channels') not between 1 and 8 then return false; end if;
  seen_values:=array[]::text[];
  for item in select value from jsonb_array_elements(target_plan->'channels') loop
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>3 or not item ?& array['channel','role','cadence'] or jsonb_typeof(item->'channel')<>'string' or char_length(btrim(item->>'channel')) not between 1 and 500 or jsonb_typeof(item->'role')<>'string' or char_length(btrim(item->>'role')) not between 1 and 500 or jsonb_typeof(item->'cadence')<>'string' or char_length(btrim(item->>'cadence')) not between 1 and 500 or btrim(item->>'channel')=any(seen_values) then return false; end if;
    seen_values:=array_append(seen_values,btrim(item->>'channel'));
  end loop;

  if jsonb_typeof(target_plan->'calendar')<>'array' or jsonb_array_length(target_plan->'calendar')<>7 then return false; end if;
  item_index:=0;
  for item in select value from jsonb_array_elements(target_plan->'calendar') loop
    item_index:=item_index+1;
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>5 or not item ?& array['dayNumber','focus','channel','deliverable','callToAction'] or jsonb_typeof(item->'dayNumber')<>'number' or item->'dayNumber'<>to_jsonb(item_index) or jsonb_typeof(item->'focus')<>'string' or char_length(btrim(item->>'focus')) not between 1 and 500 or jsonb_typeof(item->'channel')<>'string' or char_length(btrim(item->>'channel')) not between 1 and 500 or jsonb_typeof(item->'deliverable')<>'string' or char_length(btrim(item->>'deliverable')) not between 1 and 500 or jsonb_typeof(item->'callToAction')<>'string' or char_length(btrim(item->>'callToAction')) not between 1 and 500 then return false; end if;
  end loop;

  if jsonb_typeof(target_plan->'assets')<>'array' or jsonb_array_length(target_plan->'assets') not between 1 and 20 then return false; end if;
  seen_values:=array[]::text[];
  for item in select value from jsonb_array_elements(target_plan->'assets') loop
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>4 or not item ?& array['dayNumber','assetType','title','brief'] or jsonb_typeof(item->'dayNumber')<>'number' or (item->>'dayNumber')::integer not between 1 and 7 or jsonb_typeof(item->'assetType')<>'string' or item->>'assetType' not in ('copy','image','video','audio','landing_page','other') or jsonb_typeof(item->'title')<>'string' or char_length(btrim(item->>'title')) not between 1 and 500 or jsonb_typeof(item->'brief')<>'string' or char_length(btrim(item->>'brief')) not between 1 and 1500 or concat(item->>'dayNumber',':',btrim(item->>'title'))=any(seen_values) then return false; end if;
    seen_values:=array_append(seen_values,concat(item->>'dayNumber',':',btrim(item->>'title')));
  end loop;

  if jsonb_typeof(target_plan->'suggestions')<>'array' or jsonb_array_length(target_plan->'suggestions') not between 1 and 10 then return false; end if;
  seen_values:=array[]::text[];
  for item in select value from jsonb_array_elements(target_plan->'suggestions') loop
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>3 or not item ?& array['title','recommendation','impact'] or jsonb_typeof(item->'title')<>'string' or char_length(btrim(item->>'title')) not between 1 and 500 or jsonb_typeof(item->'recommendation')<>'string' or char_length(btrim(item->>'recommendation')) not between 1 and 1500 or jsonb_typeof(item->'impact')<>'string' or item->>'impact' not in ('high','medium','low') or btrim(item->>'title')=any(seen_values) then return false; end if;
    seen_values:=array_append(seen_values,btrim(item->>'title'));
  end loop;

  if jsonb_typeof(target_plan->'kpis')<>'array' or jsonb_array_length(target_plan->'kpis') not between 1 and 10 then return false; end if;
  seen_values:=array[]::text[];
  for item in select value from jsonb_array_elements(target_plan->'kpis') loop
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>3 or not item ?& array['metric','target','cadence'] or jsonb_typeof(item->'metric')<>'string' or char_length(btrim(item->>'metric')) not between 1 and 500 or jsonb_typeof(item->'target')<>'string' or char_length(btrim(item->>'target')) not between 1 and 500 or jsonb_typeof(item->'cadence')<>'string' or char_length(btrim(item->>'cadence')) not between 1 and 500 or btrim(item->>'metric')=any(seen_values) then return false; end if;
    seen_values:=array_append(seen_values,btrim(item->>'metric'));
  end loop;

  if jsonb_typeof(target_plan->'milestones')<>'array' or jsonb_array_length(target_plan->'milestones') not between 1 and 8 then return false; end if;
  seen_values:=array[]::text[];
  for item in select value from jsonb_array_elements(target_plan->'milestones') loop
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>2 or not item ?& array['name','successCriteria'] or jsonb_typeof(item->'name')<>'string' or char_length(btrim(item->>'name')) not between 1 and 500 or jsonb_typeof(item->'successCriteria')<>'array' or jsonb_array_length(item->'successCriteria') not between 1 and 12 or btrim(item->>'name')=any(seen_values) then return false; end if;
    seen_values:=array_append(seen_values,btrim(item->>'name'));
    if exists(select 1 from jsonb_array_elements(item->'successCriteria') criterion where jsonb_typeof(criterion)<>'string' or char_length(btrim(criterion#>>'{}')) not between 1 and 500) or (select count(*) from jsonb_array_elements_text(item->'successCriteria'))<>(select count(distinct btrim(value)) from jsonb_array_elements_text(item->'successCriteria') as criteria(value)) then return false; end if;
  end loop;
  return true;
exception when others then return false;
end; $$;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='campaign_studio_plan_valid' and conrelid='public.campaign_studio_campaigns'::regclass) then
    alter table public.campaign_studio_campaigns add constraint campaign_studio_plan_valid check (current_plan is null or public.is_valid_campaign_studio_plan(current_plan));
  end if;
end $$;

create or replace function public.attach_campaign_studio_plan(target_business_id uuid,target_campaign_id uuid,target_content_id uuid,target_input_fingerprint text)
returns integer language plpgsql security definer set search_path='' as $$
declare campaign_row public.campaign_studio_campaigns%rowtype; source_row public.generated_content%rowtype; job_row public.ai_jobs%rowtype; asset record;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_input_fingerprint is null or target_input_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'Invalid campaign fingerprint' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_campaign_id::text||':campaign-plan',0));
  select * into campaign_row from public.campaign_studio_campaigns where id=target_campaign_id and business_id=target_business_id and status<>'archived' for update;
  if campaign_row.id is null then raise exception 'Campaign not found' using errcode='P0002'; end if;
  if campaign_row.ai_content_id is not null then
    if campaign_row.ai_content_id=target_content_id and campaign_row.input_fingerprint=target_input_fingerprint then return campaign_row.version; end if;
    raise exception 'Campaign plan already exists' using errcode='40001';
  end if;
  select * into source_row from public.generated_content where id=target_content_id and business_id=target_business_id and content_type='campaign_studio_plan' for share;
  if source_row.id is null then raise exception 'Campaign AI output not found' using errcode='P0002'; end if;
  select * into job_row from public.ai_jobs where id=source_row.ai_job_id and business_id=target_business_id and status='succeeded' for share;
  if job_row.id is null or job_row.feature_key<>'campaign_studio_plan' or job_row.prompt_key<>'campaign_studio_plan' or job_row.prompt_version<>1 or source_row.prompt_key<>'campaign_studio_plan' or source_row.prompt_version<>1 or source_row.request_fingerprint is distinct from target_input_fingerprint or source_row.request_input is distinct from job_row.input or source_row.request_input->>'campaignId' is distinct from target_campaign_id::text then raise exception 'Campaign AI output mismatch' using errcode='40001'; end if;
  if source_row.request_input#>>'{approvedWeek,weekId}' is distinct from campaign_row.week_id::text or exists (select post_day_id::text from public.campaign_studio_source_posts where campaign_id=target_campaign_id except select item->>'postDayId' from jsonb_array_elements(source_row.request_input->'approvedPosts') as item) or exists (select item->>'postDayId' from jsonb_array_elements(source_row.request_input->'approvedPosts') as item except select post_day_id::text from public.campaign_studio_source_posts where campaign_id=target_campaign_id) then raise exception 'Campaign source mismatch' using errcode='40001'; end if;
  if not public.is_valid_campaign_studio_plan(source_row.structured_content) then raise exception 'Malformed campaign AI output' using errcode='22023'; end if;
  update public.campaign_studio_campaigns set ai_content_id=target_content_id,input_fingerprint=target_input_fingerprint,current_plan=source_row.structured_content,plan_status='ready',last_generated_at=now(),version=version+1,updated_at=now() where id=target_campaign_id;
  for asset in select * from jsonb_to_recordset(source_row.structured_content->'assets') as item("dayNumber" integer,"assetType" text,title text,brief text) loop
    if asset."dayNumber" not between 1 and 7 or asset."assetType" not in ('copy','image','video','audio','landing_page','other') or char_length(btrim(asset.title)) not between 1 and 500 or char_length(btrim(asset.brief)) not between 1 and 1500 then raise exception 'Malformed campaign asset' using errcode='22023'; end if;
    insert into public.campaign_studio_assets(campaign_id,business_id,day_number,asset_type,title,brief) values(target_campaign_id,target_business_id,asset."dayNumber",asset."assetType",btrim(asset.title),btrim(asset.brief)) on conflict(campaign_id,day_number,title) do nothing;
  end loop;
  return campaign_row.version+1;
end; $$;

create or replace function public.update_campaign_studio_status(target_business_id uuid,target_campaign_id uuid,target_expected_version integer,target_status text)
returns integer language plpgsql security definer set search_path='' as $$
declare current_row public.campaign_studio_campaigns%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_expected_version is null or target_expected_version<0 or target_status is null or target_status not in ('active','completed','archived') then raise exception 'Invalid campaign status' using errcode='22023'; end if;
  select * into current_row from public.campaign_studio_campaigns where id=target_campaign_id and business_id=target_business_id for update;
  if current_row.id is null then raise exception 'Campaign not found' using errcode='P0002'; end if;
  if current_row.version<>target_expected_version then raise exception 'Campaign conflict' using errcode='40001'; end if;
  if not ((current_row.status='draft' and target_status in ('active','archived')) or (current_row.status='active' and target_status in ('completed','archived')) or (current_row.status='completed' and target_status='archived')) then raise exception 'Invalid campaign transition' using errcode='22023'; end if;
  if target_status='active' and current_row.current_plan is null then raise exception 'Campaign plan required' using errcode='22023'; end if;
  update public.campaign_studio_campaigns set status=target_status,version=version+1,updated_at=now() where id=target_campaign_id;
  return current_row.version+1;
end; $$;

create or replace function public.update_campaign_studio_asset(target_business_id uuid,target_campaign_id uuid,target_asset_id uuid,target_expected_version integer,target_status text)
returns integer language plpgsql security definer set search_path='' as $$
declare asset_row public.campaign_studio_assets%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_expected_version is null or target_expected_version<0 or target_status is null or target_status not in ('planned','in_progress','ready','published') then raise exception 'Invalid asset status' using errcode='22023'; end if;
  if not exists(select 1 from public.campaign_studio_campaigns where id=target_campaign_id and business_id=target_business_id and status<>'archived') then raise exception 'Campaign is immutable' using errcode='22023'; end if;
  select * into asset_row from public.campaign_studio_assets where id=target_asset_id and campaign_id=target_campaign_id and business_id=target_business_id for update;
  if asset_row.id is null then raise exception 'Campaign asset not found' using errcode='P0002'; end if;
  if asset_row.version<>target_expected_version then raise exception 'Campaign asset conflict' using errcode='40001'; end if;
  update public.campaign_studio_assets set status=target_status,version=version+1,updated_at=now() where id=target_asset_id;
  return asset_row.version+1;
end; $$;

revoke all on function public.list_campaign_studio_approved_weeks(uuid,integer,integer) from public;
revoke all on function public.create_campaign_studio_campaign(uuid,uuid,text,text,uuid[],text) from public;
revoke all on function public.attach_campaign_studio_plan(uuid,uuid,uuid,text) from public;
revoke all on function public.update_campaign_studio_status(uuid,uuid,integer,text) from public;
revoke all on function public.update_campaign_studio_asset(uuid,uuid,uuid,integer,text) from public;
grant execute on function public.list_campaign_studio_approved_weeks(uuid,integer,integer) to authenticated;
grant execute on function public.create_campaign_studio_campaign(uuid,uuid,text,text,uuid[],text) to authenticated;
grant execute on function public.attach_campaign_studio_plan(uuid,uuid,uuid,text) to authenticated;
grant execute on function public.update_campaign_studio_status(uuid,uuid,integer,text) to authenticated;
grant execute on function public.update_campaign_studio_asset(uuid,uuid,uuid,integer,text) to authenticated;
