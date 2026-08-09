-- Lock the selected strategy and verify acceptance before committing.
create or replace function public.accept_marketing_strategy(target_business_id uuid, target_strategy_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  locked_strategy_id uuid;
  accepted_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not public.is_business_member(target_business_id) then raise exception 'Business access denied'; end if;

  perform pg_advisory_xact_lock(hashtextextended(target_business_id::text || ':marketing_strategy', 0));

  select id into locked_strategy_id
  from public.generated_content
  where id = target_strategy_id
    and business_id = target_business_id
    and content_type = 'marketing_strategy'
  for update;

  if locked_strategy_id is null then
    raise exception using errcode = 'P0002', message = 'Marketing strategy no longer exists';
  end if;

  update public.generated_content
  set status = 'archived', updated_at = now()
  where business_id = target_business_id
    and content_type = 'marketing_strategy'
    and status = 'accepted'
    and id <> locked_strategy_id;

  update public.generated_content
  set status = 'accepted', updated_at = now()
  where id = locked_strategy_id
    and business_id = target_business_id
    and content_type = 'marketing_strategy';

  get diagnostics accepted_count = row_count;
  if accepted_count <> 1 then
    raise exception using errcode = 'P0002', message = 'Marketing strategy could not be accepted';
  end if;
end; $$;

revoke all on function public.accept_marketing_strategy(uuid,uuid) from public;
grant execute on function public.accept_marketing_strategy(uuid,uuid) to authenticated;