-- DigiSprint Version 1.5.2 Strategy Review Workspace.
alter table public.generated_content add column if not exists review_reason text;

create table if not exists public.strategy_revisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  strategy_id uuid not null references public.generated_content(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  editor_id uuid not null references public.profiles(id) on delete restrict,
  edited_section text not null check (edited_section in ('businessSummary','objective','language','specialFocus','executiveSummary','swot','targetAudience','positioning','marketingChannels','weeklyPlan','calendar','budget','kpis','checklist')),
  section_content jsonb not null,
  previous_revision_id uuid references public.strategy_revisions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (strategy_id, revision_number),
  unique (previous_revision_id)
);

create index if not exists strategy_revisions_strategy_idx on public.strategy_revisions(strategy_id, revision_number);
alter table public.strategy_revisions enable row level security;
drop policy if exists "owners read strategy revisions" on public.strategy_revisions;
create policy "owners read strategy revisions" on public.strategy_revisions for select using (public.is_business_owner(business_id));
revoke insert, update, delete, truncate, references, trigger on public.strategy_revisions from authenticated, anon;
grant select on table public.strategy_revisions to authenticated;

create or replace function public.create_strategy_revision(target_business_id uuid,target_strategy_id uuid,target_section text,target_content jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); previous_id uuid; next_number integer; current_status text;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_section not in ('businessSummary','objective','language','specialFocus','executiveSummary','swot','targetAudience','positioning','marketingChannels','weeklyPlan','calendar','budget','kpis','checklist') then raise exception 'Invalid strategy section' using errcode='22023'; end if;
  if target_content is null or octet_length(target_content::text)>100000 then raise exception 'Invalid section content' using errcode='22023'; end if;
  if target_section in ('objective','language','specialFocus','executiveSummary') and jsonb_typeof(target_content)<>'string' then raise exception 'Section content must be text' using errcode='22023'; end if;
  if target_section in ('businessSummary','swot','positioning','budget') and jsonb_typeof(target_content)<>'object' then raise exception 'Section content must be an object' using errcode='22023'; end if;
  if target_section in ('targetAudience','marketingChannels','weeklyPlan','calendar','kpis','checklist') and jsonb_typeof(target_content)<>'array' then raise exception 'Section content must be a list' using errcode='22023'; end if;
  if target_section='language' and target_content#>>'{}' not in ('en','hi','hinglish') then raise exception 'Invalid strategy language' using errcode='22023'; end if;
  if target_section='objective' and length(btrim(target_content#>>'{}')) not between 2 and 500 then raise exception 'Invalid strategy objective' using errcode='22023'; end if;
  if target_section='specialFocus' and length(target_content#>>'{}')>1000 then raise exception 'Invalid special focus' using errcode='22023'; end if;
  if target_section='executiveSummary' and length(btrim(target_content#>>'{}')) not between 1 and 2000 then raise exception 'Invalid executive summary' using errcode='22023'; end if;
  if target_section='calendar' and jsonb_array_length(target_content)<>30 then raise exception 'Calendar must contain exactly 30 days' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_strategy_id::text||':revision',0));
  select status::text into current_status from public.generated_content where id=target_strategy_id and business_id=target_business_id and content_type='marketing_strategy' for update;
  if current_status is null then raise exception 'Strategy not found' using errcode='P0002'; end if;
  if current_status in ('accepted','archived') then raise exception 'Accepted or archived strategies cannot be edited' using errcode='22023'; end if;
  select id,revision_number into previous_id,next_number from public.strategy_revisions where strategy_id=target_strategy_id order by revision_number desc limit 1;
  next_number:=coalesce(next_number,0)+1;
  insert into public.strategy_revisions(business_id,strategy_id,revision_number,editor_id,edited_section,section_content,previous_revision_id)
  values(target_business_id,target_strategy_id,next_number,current_user_id,target_section,target_content,previous_id);
  update public.generated_content set status='edited',review_reason=null,updated_at=now() where id=target_strategy_id;
  return next_number;
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
  if current_status='archived' then raise exception 'Archived strategies cannot change state' using errcode='22023'; end if;
  if target_status='accepted' then
    update public.generated_content set status='archived',updated_at=now() where business_id=target_business_id and content_type='marketing_strategy' and status='accepted' and id<>target_strategy_id;
    update public.generated_content set status='accepted',review_reason=null,updated_at=now() where id=target_strategy_id;
  elsif target_status='rejected' then
    update public.generated_content set status='rejected',review_reason=nullif(btrim(target_reason),''),updated_at=now() where id=target_strategy_id;
  else
    update public.generated_content set status='archived',review_reason=nullif(btrim(target_reason),''),updated_at=now() where id=target_strategy_id;
  end if;
end; $$;

create or replace function public.accept_marketing_strategy(target_business_id uuid,target_strategy_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.set_strategy_review_status(target_business_id,target_strategy_id,'accepted',null);
end; $$;

revoke all on function public.create_strategy_revision(uuid,uuid,text,jsonb) from public;
revoke all on function public.set_strategy_review_status(uuid,uuid,text,text) from public;
revoke all on function public.accept_marketing_strategy(uuid,uuid) from public;
grant execute on function public.create_strategy_revision(uuid,uuid,text,jsonb) to authenticated;
grant execute on function public.set_strategy_review_status(uuid,uuid,text,text) to authenticated;
grant execute on function public.accept_marketing_strategy(uuid,uuid) to authenticated;