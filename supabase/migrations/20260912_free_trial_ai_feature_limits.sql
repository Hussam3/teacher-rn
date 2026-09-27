-- Limit the free three-day trial to the three advertised AI actions.
alter table public.ai_plans
  add column if not exists feature_daily_limits jsonb not null default '{}'::jsonb;

update public.ai_plans
set
  name = 'التجربة المجانية',
  description = 'تجربة لمدة 3 أيام: خطة يومية واحدة، تدقيق واحد، وتنسيق واحد بالذكاء كل يوم.',
  allowed_features = array['daily_plan', 'question_formatting', 'question_improvement']::text[],
  feature_daily_limits = '{"daily_plan": 1, "question_improvement": 1, "question_formatting": 1}'::jsonb,
  updated_at = now()
where id = 'trial';

-- Gemini 2.5 Pro is used for activated plans; keep accounting aligned with it.
update public.ai_system_config
set
  value = jsonb_set(
    coalesce(value, '{}'::jsonb),
    '{models}',
    coalesce(value -> 'models', '{}'::jsonb) || jsonb_build_object(
      'gemini-2.5-pro',
      jsonb_build_object('input_per_million', 1.25, 'output_per_million', 10.00)
    ),
    true
  ),
  updated_at = now()
where key = 'pricing';

create or replace function public.enforce_trial_ai_feature_limits()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_plan record;
  v_daily_limit integer;
  v_used integer;
begin
  if not new.is_trial then
    new.model_id := 'gemini-2.5-pro';
    return new;
  end if;

  -- Serialize claims for one device so simultaneous requests cannot both use the last slot.
  perform pg_advisory_xact_lock(hashtext(new.installation_id::text));

  select * into v_plan
  from public.ai_plans
  where id = 'trial';

  if not found then
    raise exception using errcode = 'P0001', message = 'trial_configuration_missing';
  end if;

  if not (new.feature_type = any(v_plan.allowed_features)) then
    raise exception using errcode = 'P0001', message = 'trial_feature_not_allowed';
  end if;

  v_daily_limit := nullif(v_plan.feature_daily_limits ->> new.feature_type, '')::integer;
  if v_daily_limit is null then
    return new;
  end if;

  select count(*) into v_used
  from public.ai_usage_records
  where installation_id = new.installation_id
    and feature_type = new.feature_type
    and status in ('processing', 'success')
    and created_at >= date_trunc('day', now())
    and request_id <> new.request_id;

  if v_used < v_daily_limit then
    return new;
  end if;

  case new.feature_type
    when 'daily_plan' then
      raise exception using errcode = 'P0001', message = 'trial_daily_plan_limit';
    when 'question_improvement' then
      raise exception using errcode = 'P0001', message = 'trial_proofread_limit';
    when 'question_formatting' then
      raise exception using errcode = 'P0001', message = 'trial_formatting_limit';
    else
      raise exception using errcode = 'P0001', message = 'trial_feature_limit';
  end case;
end;
$$;

drop trigger if exists enforce_trial_ai_feature_limits_before_insert on public.ai_usage_records;
create trigger enforce_trial_ai_feature_limits_before_insert
before insert on public.ai_usage_records
for each row
execute function public.enforce_trial_ai_feature_limits();
