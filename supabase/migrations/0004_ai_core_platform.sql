-- DigiSprint Version 1.4 reusable AI core platform (additive and rerunnable)
do $$ begin
  create type public.generated_content_status as enum ('generated', 'accepted', 'edited', 'archived', 'rejected');
exception when duplicate_object then null;
end $$;

alter table public.ai_jobs add column if not exists feature_key text;
alter table public.ai_jobs add column if not exists prompt_key text;
alter table public.ai_jobs add column if not exists prompt_version integer;
alter table public.ai_jobs add column if not exists provider_request_id text;
alter table public.ai_jobs add column if not exists duration_ms integer;
alter table public.ai_jobs add column if not exists retry_count smallint not null default 0;
alter table public.ai_jobs add column if not exists context_snapshot jsonb not null default '{}'::jsonb;
alter table public.ai_jobs add column if not exists error_details jsonb;

create table if not exists public.ai_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  is_enabled boolean not null default true,
  provider text not null default 'openai',
  model_profile text not null default 'balanced' check (model_profile in ('fast','balanced','quality')),
  default_language text not null default 'en',
  creativity_profile text not null default 'balanced' check (creativity_profile in ('precise','balanced','creative')),
  monthly_request_limit integer not null default 100 check (monthly_request_limit >= 0),
  max_output_tokens integer not null default 2000 check (max_output_tokens between 100 and 16000),
  include_business_context boolean not null default true,
  data_processing_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ai_job_id uuid not null unique references public.ai_jobs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  content_type text not null,
  prompt_key text not null,
  prompt_version integer not null check (prompt_version > 0),
  language text not null default 'en',
  title text,
  structured_content jsonb not null,
  plain_text_preview text,
  context_snapshot jsonb not null default '{}'::jsonb,
  status public.generated_content_status not null default 'generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  ai_job_id uuid not null unique references public.ai_jobs(id) on delete cascade,
  feature_key text not null,
  prompt_version integer not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  total_tokens integer generated always as (input_tokens + output_tokens) stored,
  estimated_input_cost numeric(14,8) not null default 0 check (estimated_input_cost >= 0),
  estimated_output_cost numeric(14,8) not null default 0 check (estimated_output_cost >= 0),
  total_estimated_cost numeric(14,8) generated always as (estimated_input_cost + estimated_output_cost) stored,
  duration_ms integer check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

alter table public.ai_usage_events add column if not exists prompt_version integer;
alter table public.ai_usage_events add column if not exists estimated_input_cost numeric(14,8) not null default 0;
alter table public.ai_usage_events add column if not exists estimated_output_cost numeric(14,8) not null default 0;
alter table public.ai_usage_events add column if not exists total_estimated_cost numeric(14,8) generated always as (estimated_input_cost + estimated_output_cost) stored;

create index if not exists ai_jobs_feature_created_idx on public.ai_jobs(business_id, feature_key, created_at desc);
create index if not exists ai_jobs_prompt_idx on public.ai_jobs(prompt_key, prompt_version);
create unique index if not exists ai_jobs_provider_request_uidx on public.ai_jobs(provider, provider_request_id) where provider_request_id is not null;
create index if not exists generated_content_business_idx on public.generated_content(business_id, content_type, status, created_at desc);
create index if not exists ai_usage_business_created_idx on public.ai_usage_events(business_id, created_at desc);
create index if not exists ai_usage_feature_created_idx on public.ai_usage_events(business_id, feature_key, created_at desc);

alter table public.ai_settings enable row level security;
alter table public.generated_content enable row level security;
alter table public.ai_usage_events enable row level security;

insert into public.ai_settings (business_id) select id from public.businesses on conflict (business_id) do nothing;

create or replace function public.create_default_ai_settings()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.ai_settings (business_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_business_created_ai_settings on public.businesses;
create trigger on_business_created_ai_settings after insert on public.businesses for each row execute procedure public.create_default_ai_settings();

drop policy if exists "members read ai settings" on public.ai_settings;
drop policy if exists "owners manage ai settings" on public.ai_settings;
drop policy if exists "members read generated content" on public.generated_content;
drop policy if exists "members update generated content status" on public.generated_content;
drop policy if exists "members read ai usage" on public.ai_usage_events;
create policy "members read ai settings" on public.ai_settings for select using (public.is_business_member(business_id));
create policy "owners manage ai settings" on public.ai_settings for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy "members read generated content" on public.generated_content for select using (public.is_business_member(business_id));
create policy "members update generated content status" on public.generated_content for update using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "members read ai usage" on public.ai_usage_events for select using (public.is_business_member(business_id));

revoke insert, delete, truncate, references, trigger on public.generated_content from authenticated, anon;
revoke update on public.generated_content from authenticated, anon;
grant update (title, structured_content, plain_text_preview, status, updated_at) on public.generated_content to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.ai_jobs from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.ai_usage_events from authenticated, anon;

create or replace function public.start_ai_job(target_business_id uuid,target_feature_key text,target_prompt_key text,target_prompt_version integer,target_provider text,target_model text,target_input jsonb,target_context jsonb,target_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); new_job_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not public.is_business_member(target_business_id) then raise exception 'Business access denied'; end if;
  if length(target_feature_key)>50 or length(target_prompt_key)>80 or length(target_idempotency_key)>160 then raise exception 'Invalid AI job metadata'; end if;
  insert into public.ai_jobs (business_id,user_id,job_type,feature_key,prompt_key,prompt_version,provider,model,status,input,context_snapshot,idempotency_key,started_at)
  values (target_business_id,current_user_id,target_feature_key,target_feature_key,target_prompt_key,target_prompt_version,target_provider,target_model,'running',target_input,target_context,target_idempotency_key,now()) returning id into new_job_id;
  return new_job_id;
end; $$;

create or replace function public.complete_ai_job(target_job_id uuid,target_content_type text,target_prompt_key text,target_prompt_version integer,target_language text,target_content jsonb,target_provider_request_id text,target_input_tokens integer,target_output_tokens integer,target_estimated_input_cost numeric,target_estimated_output_cost numeric,target_duration_ms integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); target_job public.ai_jobs%rowtype; new_content_id uuid;
begin
  if target_input_tokens<0 or target_output_tokens<0 or target_estimated_input_cost<0 or target_estimated_output_cost<0 or target_duration_ms<0 then raise exception 'Invalid usage telemetry'; end if;
  select * into target_job from public.ai_jobs where id=target_job_id and user_id=current_user_id and status='running' for update;
  if target_job.id is null then raise exception 'Active AI job not found'; end if;
  update public.ai_jobs set status='succeeded',provider_request_id=target_provider_request_id,input_tokens=target_input_tokens,output_tokens=target_output_tokens,provider_cost=target_estimated_input_cost+target_estimated_output_cost,duration_ms=target_duration_ms,completed_at=now() where id=target_job_id;
  insert into public.generated_content (business_id,ai_job_id,created_by,content_type,prompt_key,prompt_version,language,structured_content,context_snapshot)
  values (target_job.business_id,target_job_id,current_user_id,target_content_type,target_prompt_key,target_prompt_version,target_language,target_content,target_job.context_snapshot) returning id into new_content_id;
  insert into public.ai_usage_events (business_id,user_id,ai_job_id,feature_key,prompt_version,provider,model,input_tokens,output_tokens,estimated_input_cost,estimated_output_cost,duration_ms)
  values (target_job.business_id,current_user_id,target_job_id,target_job.feature_key,target_job.prompt_version,target_job.provider,target_job.model,target_input_tokens,target_output_tokens,target_estimated_input_cost,target_estimated_output_cost,target_duration_ms);
  return new_content_id;
end; $$;

create or replace function public.fail_ai_job(target_job_id uuid,target_error_code text,target_duration_ms integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.ai_jobs set status='failed',error_code=left(target_error_code,80),duration_ms=target_duration_ms,completed_at=now() where id=target_job_id and user_id=auth.uid() and status in ('queued','running');
end; $$;

revoke all on function public.start_ai_job(uuid,text,text,integer,text,text,jsonb,jsonb,text) from public;
revoke all on function public.complete_ai_job(uuid,text,text,integer,text,jsonb,text,integer,integer,numeric,numeric,integer) from public;
revoke all on function public.fail_ai_job(uuid,text,integer) from public;
grant execute on function public.start_ai_job(uuid,text,text,integer,text,text,jsonb,jsonb,text) to authenticated;
grant execute on function public.complete_ai_job(uuid,text,text,integer,text,jsonb,text,integer,integer,numeric,numeric,integer) to authenticated;
grant execute on function public.fail_ai_job(uuid,text,integer) to authenticated;
