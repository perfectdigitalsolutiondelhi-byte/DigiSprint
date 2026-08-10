-- DigiSprint Version 1.6 progressive weekly strategy engine.

create table if not exists public.weekly_strategy_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null,
  request_input jsonb not null,
  foundation_content jsonb not null,
  foundation_status text not null default 'draft' check (foundation_status in ('draft','approved')),
  foundation_version integer not null default 0 check (foundation_version >= 0),
  monthly_report jsonb,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id,idempotency_key)
);

create table if not exists public.weekly_strategy_weeks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.weekly_strategy_runs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 4),
  ai_content_id uuid not null unique references public.generated_content(id) on delete restrict,
  content jsonb not null,
  status text not null default 'draft' check (status in ('draft','approved')),
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id,week_number)
);

create table if not exists public.weekly_strategy_revisions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.weekly_strategy_runs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  stage_number integer not null check (stage_number between 0 and 4),
  revision_number integer not null check (revision_number > 0),
  editor_id uuid not null references public.profiles(id) on delete restrict,
  previous_revision_id uuid references public.weekly_strategy_revisions(id) on delete restrict,
  previous_content jsonb not null,
  created_at timestamptz not null default now(),
  unique (run_id,stage_number,revision_number),
  unique (previous_revision_id)
);

create index if not exists weekly_strategy_runs_business_idx on public.weekly_strategy_runs(business_id,created_at desc);
create index if not exists weekly_strategy_weeks_run_idx on public.weekly_strategy_weeks(run_id,week_number);
create index if not exists weekly_strategy_revisions_stage_idx on public.weekly_strategy_revisions(run_id,stage_number,revision_number desc);

alter table public.weekly_strategy_runs enable row level security;
alter table public.weekly_strategy_weeks enable row level security;
alter table public.weekly_strategy_revisions enable row level security;

drop policy if exists "members read weekly strategy runs" on public.weekly_strategy_runs;
create policy "members read weekly strategy runs" on public.weekly_strategy_runs for select using (public.is_business_member(business_id));
drop policy if exists "members read weekly strategy weeks" on public.weekly_strategy_weeks;
create policy "members read weekly strategy weeks" on public.weekly_strategy_weeks for select using (public.is_business_member(business_id));
drop policy if exists "owners read weekly strategy revisions" on public.weekly_strategy_revisions;
create policy "owners read weekly strategy revisions" on public.weekly_strategy_revisions for select using (public.is_business_owner(business_id));

grant select on table public.weekly_strategy_runs,public.weekly_strategy_weeks to authenticated;
grant select on table public.weekly_strategy_revisions to authenticated;
revoke insert,update,delete,truncate,references,trigger on table public.weekly_strategy_runs,public.weekly_strategy_weeks,public.weekly_strategy_revisions from authenticated,anon;

create or replace function public.create_weekly_strategy_run(target_business_id uuid,target_idempotency_key text,target_request_input jsonb,target_foundation_content_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare current_user_id uuid:=auth.uid(); source_content public.generated_content%rowtype; existing_id uuid; run_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_idempotency_key !~ '^[A-Za-z0-9:_-]{12,160}$' then raise exception 'Invalid idempotency key' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text||':'||target_idempotency_key,0));
  select id into existing_id from public.weekly_strategy_runs where business_id=target_business_id and idempotency_key=target_idempotency_key;
  if existing_id is not null then return existing_id; end if;
  select * into source_content from public.generated_content where id=target_foundation_content_id and business_id=target_business_id and content_type='weekly_strategy_foundation';
  if source_content.id is null then raise exception 'Foundation output not found' using errcode='P0002'; end if;
  if jsonb_typeof(source_content.structured_content)<>'object' or not source_content.structured_content ?& array['businessSummary','marketingObjective','swot','targetAudience','competitorSummary','brandPositioning','marketingChannels','budgetRecommendation','kpis'] then raise exception 'Malformed foundation output' using errcode='22023'; end if;
  insert into public.weekly_strategy_runs(business_id,created_by,idempotency_key,request_input,foundation_content) values(target_business_id,current_user_id,target_idempotency_key,target_request_input,source_content.structured_content) returning id into run_id;
  return run_id;
end; $$;

create or replace function public.attach_weekly_strategy_week(target_business_id uuid,target_run_id uuid,target_week_number integer,target_content_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare run_row public.weekly_strategy_runs%rowtype; source_content public.generated_content%rowtype; prior_approved boolean; existing_id uuid; week_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_week_number not between 1 and 4 then raise exception 'Invalid week number' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_run_id::text||':week:'||target_week_number::text,0));
  select * into run_row from public.weekly_strategy_runs where id=target_run_id and business_id=target_business_id and status='active' for update;
  if run_row.id is null then raise exception 'Weekly strategy run not found' using errcode='P0002'; end if;
  select id into existing_id from public.weekly_strategy_weeks where run_id=target_run_id and week_number=target_week_number;
  if existing_id is not null then return existing_id; end if;
  prior_approved:=case when target_week_number=1 then run_row.foundation_status='approved' else exists(select 1 from public.weekly_strategy_weeks where run_id=target_run_id and week_number=target_week_number-1 and status='approved') end;
  if not prior_approved then raise exception 'Previous stage must be approved' using errcode='22023'; end if;
  select * into source_content from public.generated_content where id=target_content_id and business_id=target_business_id and content_type='weekly_strategy_week';
  if source_content.id is null then raise exception 'Weekly output not found' using errcode='P0002'; end if;
  if jsonb_typeof(source_content.structured_content)<>'object' or not source_content.structured_content ?& array['weekNumber','weeklyGoal','weekSummary','contentCalendar','dailySocialPostIdeas','reelsIdeas','whatsAppCampaign','seoTasks','callToAction','checklist'] or (source_content.structured_content->>'weekNumber')::integer<>target_week_number or jsonb_typeof(source_content.structured_content->'contentCalendar')<>'array' or jsonb_array_length(source_content.structured_content->'contentCalendar')<>7 then raise exception 'Malformed weekly output' using errcode='22023'; end if;
  insert into public.weekly_strategy_weeks(run_id,business_id,week_number,ai_content_id,content) values(target_run_id,target_business_id,target_week_number,target_content_id,source_content.structured_content) returning id into week_id;
  return week_id;
end; $$;

create or replace function public.save_weekly_strategy_revision(target_business_id uuid,target_run_id uuid,target_stage_number integer,target_expected_version integer,target_content jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare current_version integer; current_status text; current_content jsonb; previous_id uuid; next_revision integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_stage_number not between 0 and 4 or target_content is null or jsonb_typeof(target_content)<>'object' or octet_length(target_content::text)>50000 then raise exception 'Invalid stage content' using errcode='22023'; end if;
  if target_stage_number=0 and not target_content ?& array['businessSummary','marketingObjective','swot','targetAudience','competitorSummary','brandPositioning','marketingChannels','budgetRecommendation','kpis'] then raise exception 'Malformed foundation content' using errcode='22023'; end if;
  if target_stage_number>0 and (not target_content ?& array['weekNumber','weeklyGoal','weekSummary','contentCalendar','dailySocialPostIdeas','reelsIdeas','whatsAppCampaign','seoTasks','callToAction','checklist'] or (target_content->>'weekNumber')::integer<>target_stage_number or jsonb_typeof(target_content->'contentCalendar')<>'array' or jsonb_array_length(target_content->'contentCalendar')<>7) then raise exception 'Malformed weekly content' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_run_id::text||':stage:'||target_stage_number::text,0));
  if target_stage_number=0 then
    select foundation_version,foundation_status,foundation_content into current_version,current_status,current_content from public.weekly_strategy_runs where id=target_run_id and business_id=target_business_id and status='active' for update;
  else
    select version,status,content into current_version,current_status,current_content from public.weekly_strategy_weeks where run_id=target_run_id and business_id=target_business_id and week_number=target_stage_number for update;
  end if;
  if current_status is null then raise exception 'Strategy stage not found' using errcode='P0002'; end if;
  if current_status<>'draft' then raise exception 'Approved stages are read-only' using errcode='22023'; end if;
  if current_version<>target_expected_version then raise exception 'Strategy revision conflict' using errcode='40001'; end if;
  select id,revision_number into previous_id,next_revision from public.weekly_strategy_revisions where run_id=target_run_id and stage_number=target_stage_number order by revision_number desc limit 1;
  next_revision:=coalesce(next_revision,0)+1;
  insert into public.weekly_strategy_revisions(run_id,business_id,stage_number,revision_number,editor_id,previous_revision_id,previous_content) values(target_run_id,target_business_id,target_stage_number,next_revision,auth.uid(),previous_id,current_content);
  if target_stage_number=0 then update public.weekly_strategy_runs set foundation_content=target_content,foundation_version=current_version+1,updated_at=now() where id=target_run_id;
  else update public.weekly_strategy_weeks set content=target_content,version=current_version+1,updated_at=now() where run_id=target_run_id and week_number=target_stage_number;
  end if;
  return current_version+1;
end; $$;

create or replace function public.approve_weekly_strategy_stage(target_business_id uuid,target_run_id uuid,target_stage_number integer)
returns void language plpgsql security definer set search_path='' as $$
declare run_row public.weekly_strategy_runs%rowtype; stage_status text; previous_ready boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_stage_number not between 0 and 4 then raise exception 'Invalid stage number' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_run_id::text||':approval',0));
  select * into run_row from public.weekly_strategy_runs where id=target_run_id and business_id=target_business_id and status='active' for update;
  if run_row.id is null then raise exception 'Weekly strategy run not found' using errcode='P0002'; end if;
  if target_stage_number=0 then
    if run_row.foundation_status<>'draft' then raise exception 'Invalid stage transition' using errcode='22023'; end if;
    update public.weekly_strategy_runs set foundation_status='approved',updated_at=now() where id=target_run_id;
    return;
  end if;
  select status into stage_status from public.weekly_strategy_weeks where run_id=target_run_id and week_number=target_stage_number for update;
  if stage_status is null then raise exception 'Strategy week not found' using errcode='P0002'; end if;
  if stage_status<>'draft' then raise exception 'Invalid stage transition' using errcode='22023'; end if;
  previous_ready:=case when target_stage_number=1 then run_row.foundation_status='approved' else exists(select 1 from public.weekly_strategy_weeks where run_id=target_run_id and week_number=target_stage_number-1 and status='approved') end;
  if not previous_ready then raise exception 'Previous stage must be approved' using errcode='22023'; end if;
  update public.weekly_strategy_weeks set status='approved',updated_at=now() where run_id=target_run_id and week_number=target_stage_number;
  if target_stage_number=4 then
    update public.weekly_strategy_runs set status='completed',monthly_report=jsonb_build_object('foundation',foundation_content,'weeks',(select jsonb_agg(content order by week_number) from public.weekly_strategy_weeks where run_id=target_run_id)),updated_at=now() where id=target_run_id;
  end if;
end; $$;

revoke all on function public.create_weekly_strategy_run(uuid,text,jsonb,uuid) from public;
revoke all on function public.attach_weekly_strategy_week(uuid,uuid,integer,uuid) from public;
revoke all on function public.save_weekly_strategy_revision(uuid,uuid,integer,integer,jsonb) from public;
revoke all on function public.approve_weekly_strategy_stage(uuid,uuid,integer) from public;
grant execute on function public.create_weekly_strategy_run(uuid,text,jsonb,uuid) to authenticated;
grant execute on function public.attach_weekly_strategy_week(uuid,uuid,integer,uuid) to authenticated;
grant execute on function public.save_weekly_strategy_revision(uuid,uuid,integer,integer,jsonb) to authenticated;
grant execute on function public.approve_weekly_strategy_stage(uuid,uuid,integer) to authenticated;
