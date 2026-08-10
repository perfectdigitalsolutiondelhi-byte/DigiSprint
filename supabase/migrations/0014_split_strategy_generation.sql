-- Resumable two-part marketing strategy generation.

create or replace function public.start_ai_job(target_business_id uuid,target_feature_key text,target_prompt_key text,target_prompt_version integer,target_provider text,target_model text,target_input jsonb,target_context jsonb,target_idempotency_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid:=auth.uid(); existing_job public.ai_jobs%rowtype; new_job_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_member(target_business_id) then raise exception 'Business access denied' using errcode='42501'; end if;
  if length(target_feature_key)>50 or length(target_prompt_key)>80 or length(target_idempotency_key)>160 then raise exception 'Invalid AI job metadata' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text||':'||target_idempotency_key,0));
  select * into existing_job from public.ai_jobs where business_id=target_business_id and idempotency_key=target_idempotency_key for update;
  if existing_job.id is not null then
    if existing_job.user_id<>current_user_id or existing_job.status<>'failed' then raise exception 'AI request already submitted' using errcode='23505'; end if;
    update public.ai_jobs set job_type=target_feature_key,feature_key=target_feature_key,prompt_key=target_prompt_key,prompt_version=target_prompt_version,provider=target_provider,model=target_model,status='running',input=target_input,output=null,error_code=null,context_snapshot=target_context,provider_request_id=null,input_tokens=null,output_tokens=null,provider_cost=null,duration_ms=null,started_at=now(),completed_at=null,retry_count=retry_count+1 where id=existing_job.id returning id into new_job_id;
    return new_job_id;
  end if;
  insert into public.ai_jobs(business_id,user_id,job_type,feature_key,prompt_key,prompt_version,provider,model,status,input,context_snapshot,idempotency_key,started_at) values(target_business_id,current_user_id,target_feature_key,target_feature_key,target_prompt_key,target_prompt_version,target_provider,target_model,'running',target_input,target_context,target_idempotency_key,now()) returning id into new_job_id;
  return new_job_id;
end; $$;

create or replace function public.finalize_marketing_strategy_parts(target_business_id uuid,target_foundation_content_id uuid,target_execution_content_id uuid,target_calendar_content_id uuid,target_idempotency_key text,target_language text,target_request_input jsonb,target_request_fingerprint text)
returns uuid language plpgsql security definer set search_path='' as $$
declare current_user_id uuid:=auth.uid(); foundation_row public.generated_content%rowtype; execution_row public.generated_content%rowtype; calendar_row public.generated_content%rowtype; existing_job public.ai_jobs%rowtype; existing_content_id uuid; final_job_id uuid; final_content_id uuid; final_output jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not public.is_business_member(target_business_id) then raise exception 'Business access denied' using errcode='42501'; end if;
  if target_idempotency_key is null or target_idempotency_key !~ '^[A-Za-z0-9:_-]{12,160}$' or target_request_fingerprint is null or target_request_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'Invalid finalization metadata' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text||':'||target_idempotency_key,0));
  select * into existing_job from public.ai_jobs where business_id=target_business_id and idempotency_key=target_idempotency_key for update;
  if existing_job.id is not null and existing_job.status='succeeded' then
    select id into existing_content_id from public.generated_content where ai_job_id=existing_job.id and business_id=target_business_id and content_type='marketing_strategy';
    if existing_content_id is null then raise exception 'Strategy finalization conflict' using errcode='40001'; end if;
    return existing_content_id;
  end if;
  if existing_job.id is not null and (existing_job.user_id<>current_user_id or existing_job.status<>'failed') then raise exception 'Strategy finalization conflict' using errcode='40001'; end if;
  select * into foundation_row from public.generated_content where id=target_foundation_content_id and business_id=target_business_id and content_type='marketing_strategy_foundation' for share;
  select * into execution_row from public.generated_content where id=target_execution_content_id and business_id=target_business_id and content_type='marketing_strategy_execution' for share;
  select * into calendar_row from public.generated_content where id=target_calendar_content_id and business_id=target_business_id and content_type='marketing_strategy_calendar' for share;
  if foundation_row.id is null or execution_row.id is null or calendar_row.id is null then raise exception 'Strategy generation part not found' using errcode='P0002'; end if;
  if jsonb_typeof(foundation_row.structured_content)<>'object' or jsonb_typeof(execution_row.structured_content)<>'object' or jsonb_typeof(calendar_row.structured_content->'contentCalendar')<>'array' or jsonb_array_length(calendar_row.structured_content->'contentCalendar')<>30 then raise exception 'Invalid strategy generation part' using errcode='22023'; end if;
  final_output:=foundation_row.structured_content||execution_row.structured_content||calendar_row.structured_content;
  if existing_job.id is not null then
    update public.ai_jobs set job_type='marketing_strategy',feature_key='marketing_strategy',prompt_key='marketing_strategy_complete',prompt_version=1,provider='openai',model='split_pipeline',status='succeeded',input=target_request_input,output=final_output,error_code=null,context_snapshot=foundation_row.context_snapshot,input_tokens=0,output_tokens=0,provider_cost=0,duration_ms=0,started_at=now(),completed_at=now(),retry_count=retry_count+1 where id=existing_job.id returning id into final_job_id;
  else
    insert into public.ai_jobs(business_id,user_id,job_type,feature_key,prompt_key,prompt_version,provider,model,status,input,output,idempotency_key,input_tokens,output_tokens,provider_cost,context_snapshot,started_at,completed_at,duration_ms) values(target_business_id,current_user_id,'marketing_strategy','marketing_strategy','marketing_strategy_complete',1,'openai','split_pipeline','succeeded',target_request_input,final_output,target_idempotency_key,0,0,0,foundation_row.context_snapshot,now(),now(),0) returning id into final_job_id;
  end if;
  insert into public.generated_content(business_id,ai_job_id,created_by,content_type,prompt_key,prompt_version,language,title,request_input,request_fingerprint,structured_content,context_snapshot) values(target_business_id,final_job_id,current_user_id,'marketing_strategy','marketing_strategy_complete',1,target_language,final_output->>'title',target_request_input,target_request_fingerprint,final_output,foundation_row.context_snapshot) returning id into final_content_id;
  return final_content_id;
end; $$;

revoke all on function public.finalize_marketing_strategy_parts(uuid,uuid,uuid,uuid,text,text,jsonb,text) from public;
grant execute on function public.finalize_marketing_strategy_parts(uuid,uuid,uuid,uuid,text,text,jsonb,text) to authenticated;
