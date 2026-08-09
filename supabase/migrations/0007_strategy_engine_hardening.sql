-- DigiSprint Version 1.5.1 strategy engine hardening
alter table public.generated_content
  add column if not exists request_input jsonb not null default '{}'::jsonb,
  add column if not exists request_fingerprint text;

update public.generated_content as content
set request_input = job.input
from public.ai_jobs as job
where content.ai_job_id = job.id
  and content.request_input = '{}'::jsonb;

create index if not exists generated_content_request_fingerprint_idx
  on public.generated_content (business_id, content_type, request_fingerprint, created_at desc)
  where request_fingerprint is not null;

with ranked as (
  select id, row_number() over (partition by business_id order by updated_at desc, created_at desc, id desc) as position
  from public.generated_content
  where content_type = 'marketing_strategy' and status = 'accepted'
)
update public.generated_content as content
set status = 'archived', updated_at = now()
from ranked
where content.id = ranked.id and ranked.position > 1;

create unique index if not exists generated_content_one_accepted_strategy_uidx
  on public.generated_content (business_id)
  where content_type = 'marketing_strategy' and status = 'accepted';

drop function if exists public.complete_ai_job(uuid,text,text,integer,text,jsonb,text,integer,integer,numeric,numeric,integer);

create or replace function public.complete_ai_job(
  target_job_id uuid,
  target_content_type text,
  target_prompt_key text,
  target_prompt_version integer,
  target_language text,
  target_request_input jsonb,
  target_request_fingerprint text,
  target_content jsonb,
  target_provider_request_id text,
  target_input_tokens integer,
  target_output_tokens integer,
  target_estimated_input_cost numeric,
  target_estimated_output_cost numeric,
  target_duration_ms integer
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); target_job public.ai_jobs%rowtype; new_content_id uuid;
begin
  if target_input_tokens < 0 or target_output_tokens < 0 or target_estimated_input_cost < 0 or target_estimated_output_cost < 0 or target_duration_ms < 0 then
    raise exception 'Invalid usage telemetry';
  end if;
  if target_language is null or length(target_language) > 20 then raise exception 'Invalid output language'; end if;
  if target_request_fingerprint is not null and target_request_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'Invalid request fingerprint'; end if;

  select * into target_job from public.ai_jobs where id = target_job_id and user_id = current_user_id and status = 'running' for update;
  if target_job.id is null then raise exception 'Active AI job not found'; end if;

  update public.ai_jobs
  set status = 'succeeded', provider_request_id = target_provider_request_id,
      input_tokens = target_input_tokens, output_tokens = target_output_tokens,
      provider_cost = target_estimated_input_cost + target_estimated_output_cost,
      duration_ms = target_duration_ms, completed_at = now()
  where id = target_job_id;

  insert into public.generated_content (
    business_id, ai_job_id, created_by, content_type, prompt_key, prompt_version,
    language, request_input, request_fingerprint, structured_content, context_snapshot
  )
  values (
    target_job.business_id, target_job_id, current_user_id, target_content_type,
    target_prompt_key, target_prompt_version, target_language, target_request_input,
    target_request_fingerprint, target_content, target_job.context_snapshot
  )
  returning id into new_content_id;

  insert into public.ai_usage_events (
    business_id, user_id, ai_job_id, feature_key, prompt_version, provider, model,
    input_tokens, output_tokens, estimated_input_cost, estimated_output_cost, duration_ms
  )
  values (
    target_job.business_id, current_user_id, target_job_id, target_job.feature_key,
    target_job.prompt_version, target_job.provider, target_job.model, target_input_tokens,
    target_output_tokens, target_estimated_input_cost, target_estimated_output_cost, target_duration_ms
  );

  return new_content_id;
end; $$;

create or replace function public.accept_marketing_strategy(target_business_id uuid, target_strategy_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); target_exists boolean;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not public.is_business_member(target_business_id) then raise exception 'Business access denied'; end if;

  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text || ':marketing_strategy', 0));

  select exists (
    select 1 from public.generated_content
    where id = target_strategy_id
      and business_id = target_business_id
      and content_type = 'marketing_strategy'
  ) into target_exists;
  if not target_exists then raise exception 'Marketing strategy not found'; end if;

  update public.generated_content
  set status = 'archived', updated_at = now()
  where business_id = target_business_id
    and content_type = 'marketing_strategy'
    and status = 'accepted'
    and id <> target_strategy_id;

  update public.generated_content
  set status = 'accepted', updated_at = now()
  where id = target_strategy_id
    and business_id = target_business_id
    and content_type = 'marketing_strategy';
end; $$;

revoke all on function public.complete_ai_job(uuid,text,text,integer,text,jsonb,text,jsonb,text,integer,integer,numeric,numeric,integer) from public;
revoke all on function public.accept_marketing_strategy(uuid,uuid) from public;
grant execute on function public.complete_ai_job(uuid,text,text,integer,text,jsonb,text,jsonb,text,integer,integer,numeric,numeric,integer) to authenticated;
grant execute on function public.accept_marketing_strategy(uuid,uuid) to authenticated;