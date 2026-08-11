-- Separate AI Post Generator consuming approved weekly strategy days.

create table if not exists public.ai_post_days (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  week_id uuid not null references public.weekly_strategy_weeks(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  generated_content_id uuid not null unique references public.generated_content(id) on delete restrict,
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  prompt_key text not null,
  prompt_version integer not null check (prompt_version > 0),
  current_content jsonb not null,
  version integer not null default 0 check (version >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id,day_number)
);

create index if not exists ai_post_days_business_week_idx on public.ai_post_days(business_id,week_id,day_number);
alter table public.ai_post_days enable row level security;
drop policy if exists "members read ai post days" on public.ai_post_days;
create policy "members read ai post days" on public.ai_post_days for select using (public.is_business_member(business_id));
grant select on table public.ai_post_days to authenticated;
revoke insert,update,delete,truncate,references,trigger on table public.ai_post_days from authenticated,anon;

create or replace function public.is_valid_ai_post_content(target_content jsonb,target_day_number integer)
returns boolean language sql immutable set search_path='' as $$
  select case when jsonb_typeof(target_content) <> 'object' then false else
    (select count(*) from jsonb_object_keys(target_content)) = 11
    and target_content ?& array['dayNumber','facebookPost','instagramCaption','linkedInPost','whatsAppMessage','xPost','reelScript','voiceOverScript','aiImagePrompt','callToAction','hashtags']
    and jsonb_typeof(target_content->'dayNumber') = 'number'
    and target_content->'dayNumber' = to_jsonb(target_day_number)
    and jsonb_typeof(target_content->'facebookPost') = 'string' and char_length(btrim(target_content->>'facebookPost')) between 1 and 4000
    and jsonb_typeof(target_content->'instagramCaption') = 'string' and char_length(btrim(target_content->>'instagramCaption')) between 1 and 4000
    and jsonb_typeof(target_content->'linkedInPost') = 'string' and char_length(btrim(target_content->>'linkedInPost')) between 1 and 4000
    and jsonb_typeof(target_content->'whatsAppMessage') = 'string' and char_length(btrim(target_content->>'whatsAppMessage')) between 1 and 4000
    and jsonb_typeof(target_content->'xPost') = 'string' and char_length(btrim(target_content->>'xPost')) between 1 and 280
    and jsonb_typeof(target_content->'reelScript') = 'string' and char_length(btrim(target_content->>'reelScript')) between 1 and 4000
    and jsonb_typeof(target_content->'voiceOverScript') = 'string' and char_length(btrim(target_content->>'voiceOverScript')) between 1 and 4000
    and jsonb_typeof(target_content->'aiImagePrompt') = 'string' and char_length(btrim(target_content->>'aiImagePrompt')) between 1 and 4000
    and jsonb_typeof(target_content->'callToAction') = 'string' and char_length(btrim(target_content->>'callToAction')) between 1 and 1000
    and case when jsonb_typeof(target_content->'hashtags') = 'array' then
      jsonb_array_length(target_content->'hashtags') between 3 and 20
      and not exists (
        select 1 from jsonb_array_elements(target_content->'hashtags') as item
        where jsonb_typeof(item) <> 'string'
          or char_length(btrim(item #>> '{}')) not between 2 and 80
          or btrim(item #>> '{}') !~ '^#[[:alnum:]_]+$'
      )
    else false end
  end;
$$;

drop function if exists public.attach_ai_post_day(uuid,uuid,integer,uuid,integer);
create or replace function public.attach_ai_post_day(target_business_id uuid,target_week_id uuid,target_day_number integer,target_content_id uuid,target_expected_version integer,target_input_fingerprint text)
returns uuid language plpgsql security definer set search_path='' as $$
declare week_row public.weekly_strategy_weeks%rowtype; source_row public.generated_content%rowtype; job_row public.ai_jobs%rowtype; existing_row public.ai_post_days%rowtype; result_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_day_number not between 1 and 7 or target_input_fingerprint is null or target_input_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'Invalid post attachment metadata' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_week_id::text||':post-day:'||target_day_number::text,0));
  select * into week_row from public.weekly_strategy_weeks where id=target_week_id and business_id=target_business_id and status='approved' for share;
  if week_row.id is null then raise exception 'Approved strategy week not found' using errcode='P0002'; end if;
  select * into source_row from public.generated_content where id=target_content_id and business_id=target_business_id and content_type='ai_post_day' for share;
  if source_row.id is null then raise exception 'Generated post content not found' using errcode='P0002'; end if;
  select * into job_row from public.ai_jobs where id=source_row.ai_job_id and business_id=target_business_id and status='succeeded' for share;
  if job_row.id is null
    or job_row.feature_key<>'ai_post_day' or job_row.prompt_key<>'weekly_post_generator' or job_row.prompt_version<>1
    or source_row.prompt_key<>'weekly_post_generator' or source_row.prompt_version<>1
    or source_row.request_fingerprint is distinct from target_input_fingerprint
    or source_row.request_input is distinct from job_row.input
    or source_row.request_input->>'weekId' is distinct from target_week_id::text
    or source_row.request_input->>'dayNumber' is distinct from target_day_number::text
  then raise exception 'Generated content does not match the approved week' using errcode='40001'; end if;
  if not public.is_valid_ai_post_content(source_row.structured_content,target_day_number) then raise exception 'Malformed generated post content' using errcode='22023'; end if;
  select * into existing_row from public.ai_post_days where week_id=target_week_id and business_id=target_business_id and day_number=target_day_number for update;
  if existing_row.id is null then
    if target_expected_version is not null and target_expected_version<>0 then raise exception 'Post content conflict' using errcode='40001'; end if;
    insert into public.ai_post_days(business_id,week_id,day_number,generated_content_id,input_fingerprint,prompt_key,prompt_version,current_content,created_by)
    values(target_business_id,target_week_id,target_day_number,target_content_id,target_input_fingerprint,source_row.prompt_key,source_row.prompt_version,source_row.structured_content,auth.uid()) returning id into result_id;
    return result_id;
  end if;
  if existing_row.generated_content_id=target_content_id and existing_row.input_fingerprint=target_input_fingerprint then return existing_row.id; end if;
  if target_expected_version is null or existing_row.version<>target_expected_version then raise exception 'Post content conflict' using errcode='40001'; end if;
  update public.ai_post_days set generated_content_id=target_content_id,input_fingerprint=target_input_fingerprint,prompt_key=source_row.prompt_key,prompt_version=source_row.prompt_version,current_content=source_row.structured_content,version=version+1,updated_at=now() where id=existing_row.id returning id into result_id;
  return result_id;
end; $$;

create or replace function public.update_ai_post_day(target_business_id uuid,target_week_id uuid,target_day_number integer,target_expected_version integer,target_content jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare week_row public.weekly_strategy_weeks%rowtype; existing_row public.ai_post_days%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_day_number not between 1 and 7 or target_expected_version<0 or target_content is null or octet_length(target_content::text)>30000 then raise exception 'Invalid post content' using errcode='22023'; end if;
  if not public.is_valid_ai_post_content(target_content,target_day_number) then raise exception 'Malformed post content' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_week_id::text||':post-day:'||target_day_number::text,0));
  select * into week_row from public.weekly_strategy_weeks where id=target_week_id and business_id=target_business_id and status='approved' for share;
  if week_row.id is null then raise exception 'Approved strategy week not found' using errcode='P0002'; end if;
  select * into existing_row from public.ai_post_days where week_id=target_week_id and business_id=target_business_id and day_number=target_day_number for update;
  if existing_row.id is null then raise exception 'Post day not found' using errcode='P0002'; end if;
  if existing_row.version<>target_expected_version then raise exception 'Post content conflict' using errcode='40001'; end if;
  update public.ai_post_days set current_content=target_content,version=version+1,updated_at=now() where id=existing_row.id;
  return existing_row.version+1;
end; $$;

create or replace function public.list_approved_post_generator_weeks(target_business_id uuid,target_offset integer,target_limit integer)
returns table(id uuid,week_number integer,weekly_goal text,updated_at timestamptz,total_count bigint)
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_owner(target_business_id) then raise exception 'Business owner access required' using errcode='42501'; end if;
  if target_offset<0 or target_limit not between 1 and 20 then raise exception 'Invalid pagination' using errcode='22023'; end if;
  return query select week.id,week.week_number,week.content->>'weeklyGoal',week.updated_at,count(*) over()
    from public.weekly_strategy_weeks as week
    where week.business_id=target_business_id and week.status='approved'
    order by week.updated_at desc,week.id desc offset target_offset limit target_limit;
end; $$;

revoke all on function public.is_valid_ai_post_content(jsonb,integer) from public;
revoke all on function public.attach_ai_post_day(uuid,uuid,integer,uuid,integer,text) from public;
revoke all on function public.update_ai_post_day(uuid,uuid,integer,integer,jsonb) from public;
revoke all on function public.list_approved_post_generator_weeks(uuid,integer,integer) from public;
grant execute on function public.attach_ai_post_day(uuid,uuid,integer,uuid,integer,text) to authenticated;
grant execute on function public.update_ai_post_day(uuid,uuid,integer,integer,jsonb) to authenticated;
grant execute on function public.list_approved_post_generator_weeks(uuid,integer,integer) to authenticated;
