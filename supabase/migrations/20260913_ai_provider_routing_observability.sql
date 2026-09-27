-- Provider-aware AI routing and owner observability.
-- API keys remain Supabase Edge Function secrets and are never stored here.

alter table public.ai_usage_records
  add column if not exists provider_id text not null default 'gemini',
  add column if not exists completed_at timestamptz,
  add column if not exists latency_ms bigint,
  add column if not exists pricing_input_per_million numeric(12, 6),
  add column if not exists pricing_output_per_million numeric(12, 6),
  add column if not exists uses_personal_key boolean not null default false;

-- Touch only rows whose historic model indicates a different provider.
update public.ai_usage_records
set provider_id = case
  when model_id like 'deepseek-%' then 'deepseek'
  else 'gemini'
end
where provider_id is distinct from case
  when model_id like 'deepseek-%' then 'deepseek'
  else 'gemini'
end;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_usage_records_provider_id_check'
      and conrelid = 'public.ai_usage_records'::regclass
  ) then
    alter table public.ai_usage_records
      add constraint ai_usage_records_provider_id_check
      check (provider_id in ('gemini', 'deepseek')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_usage_records_latency_ms_check'
      and conrelid = 'public.ai_usage_records'::regclass
  ) then
    alter table public.ai_usage_records
      add constraint ai_usage_records_latency_ms_check
      check (latency_ms is null or latency_ms >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_usage_records_pricing_snapshot_check'
      and conrelid = 'public.ai_usage_records'::regclass
  ) then
    alter table public.ai_usage_records
      add constraint ai_usage_records_pricing_snapshot_check
      check (
        (pricing_input_per_million is null and pricing_output_per_million is null)
        or (
          pricing_input_per_million >= 0
          and pricing_output_per_million >= 0
        )
      ) not valid;
  end if;
end;
$$;

-- Preserve owner-managed pricing if DeepSeek was already configured.
update public.ai_system_config
set
  value = jsonb_set(
    coalesce(value, '{}'::jsonb),
    '{models}',
    coalesce(value -> 'models', '{}'::jsonb) || jsonb_build_object(
      'deepseek-v4-pro',
      jsonb_build_object('input_per_million', 1.32, 'output_per_million', 3.96)
    ),
    true
  ),
  updated_at = now()
where key = 'pricing'
  and not (coalesce(value -> 'models', '{}'::jsonb) ? 'deepseek-v4-pro');

-- Defaults preserve the release behavior: Gemini for all routes, Pro for paid users.
insert into public.ai_system_config (key, value)
values (
  'provider_model_routing',
  '{
    "version": 1,
    "trial": {
      "daily_plan": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "annual_plan": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "question_generation": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "question_regeneration": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "question_formatting": {"provider": "gemini", "model": "gemini-2.5-flash-lite"},
      "question_improvement": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "curriculum_analysis": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "lesson_summary": {"provider": "gemini", "model": "gemini-2.5-flash"},
      "other_ai": {"provider": "gemini", "model": "gemini-2.5-flash"}
    },
    "licensed": {
      "daily_plan": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "annual_plan": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "question_generation": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "question_regeneration": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "question_formatting": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "question_improvement": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "curriculum_analysis": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "lesson_summary": {"provider": "gemini", "model": "gemini-2.5-pro"},
      "other_ai": {"provider": "gemini", "model": "gemini-2.5-pro"}
    },
    "emergency": {
      "pausedProviders": [],
      "paidFallback": {"provider": "gemini", "model": "gemini-2.5-pro"}
    }
  }'::jsonb
)
on conflict (key) do nothing;

drop function if exists public.claim_ai_request_routed(
  uuid, uuid, uuid, text, text, text, integer, boolean
);
drop function if exists public.claim_ai_request_routed(
  uuid, uuid, uuid, text, text, text, integer, boolean, boolean
);

create function public.claim_ai_request_routed(
  p_request_id uuid,
  p_installation_id uuid,
  p_user_id uuid default null,
  p_feature_type text default 'other_ai',
  p_subject_name text default null,
  p_subject_id text default null,
  p_estimated_tokens integer default 2500,
  p_has_personal_key boolean default false,
  p_requires_vision boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.ai_usage_records%rowtype;
  v_claim jsonb;
  v_config jsonb;
  v_pricing jsonb;
  v_scope text;
  v_entitlement record;
  v_route jsonb;
  v_fallback jsonb;
  v_paused_providers jsonb;
  v_provider text;
  v_model text;
  v_pricing_version text;
  v_input_rate numeric;
  v_output_rate numeric;
  v_provider_paused boolean;
  v_fallback_paused boolean;
  v_now timestamptz := clock_timestamp();
begin
  if p_estimated_tokens is null or p_estimated_tokens < 1 or p_estimated_tokens > 50000 then
    raise exception using errcode = 'P0001', message = 'ai_invalid_estimated_tokens';
  end if;

  if p_feature_type not in (
    'daily_plan', 'annual_plan', 'question_generation', 'question_regeneration',
    'question_formatting', 'question_improvement', 'curriculum_analysis',
    'lesson_summary', 'other_ai'
  ) then
    raise exception using errcode = 'P0001', message = 'ai_invalid_feature';
  end if;

  -- Serialize a request key before looking it up, then serialize all quotas for its device.
  perform pg_advisory_xact_lock(hashtext('ai-request:' || p_request_id::text));
  perform pg_advisory_xact_lock(hashtext('ai-installation:' || p_installation_id::text));

  select * into v_existing
  from public.ai_usage_records
  where request_id = p_request_id
  for update;

  if found then
    if v_existing.installation_id is distinct from p_installation_id
      or v_existing.user_id is distinct from p_user_id then
      raise exception using errcode = 'P0001', message = 'ai_request_id_conflict';
    end if;

    if v_existing.status = 'success' then
      return jsonb_build_object(
        'allowed', true,
        'is_duplicate', true,
        'status', 'success',
        'is_trial', v_existing.is_trial,
        'license_id', v_existing.license_id,
        'response_cache', v_existing.response_cache,
        'provider_id', coalesce(v_existing.provider_id, 'gemini'),
        'model_id', v_existing.model_id,
        'pricing_version', v_existing.pricing_version,
        'usage', jsonb_build_object(
          'inputTokens', v_existing.input_tokens,
          'outputTokens', v_existing.output_tokens,
          'totalTokens', v_existing.total_tokens,
          'estimatedCost', v_existing.estimated_cost,
          'providerId', coalesce(v_existing.provider_id, 'gemini'),
          'modelId', v_existing.model_id
        )
      );
    end if;

    if v_existing.status = 'processing' then
      if v_existing.created_at >= v_now - interval '5 minutes' then
        return jsonb_build_object(
          'allowed', false,
          'error_code', 'concurrency_in_flight',
          'error', 'يوجد طلب ذكاء اصطناعي قيد المعالجة حالياً. يرجى الانتظار حتى اكتماله.'
        );
      end if;

      update public.ai_usage_records
      set
        status = 'failed',
        estimated_tokens = 0,
        failure_reason = 'stale_in_flight_timeout',
        provider_error_type = 'stale_in_flight_timeout',
        completed_at = v_now,
        latency_ms = greatest(
          0::bigint,
          floor(extract(epoch from (v_now - v_existing.created_at)) * 1000)::bigint
        )
      where id = v_existing.id;

      return jsonb_build_object(
        'allowed', false,
        'error_code', 'request_expired',
        'error', 'انتهت مهلة الطلب السابق. أرسل طلباً جديداً.'
      );
    end if;

    return jsonb_build_object(
      'allowed', false,
      'error_code', 'request_not_reusable',
      'error', 'لا يمكن إعادة استخدام معرّف طلب مكتمل أو فاشل. أرسل طلباً جديداً.'
    );
  end if;

  -- A shared license quota is serialized across all of its activated devices.
  select la.license_id, l.status, l.expires_at
  into v_entitlement
  from public.license_activations la
  join public.licenses l on l.id = la.license_id
  where la.installation_id = p_installation_id
    and la.is_active = true
  limit 1
  for share of la, l;

  if found then
    perform pg_advisory_xact_lock(hashtext('ai-license:' || v_entitlement.license_id::text));
    v_scope := 'licensed';
  else
    v_scope := 'trial';
    -- Ensure the legacy claim routine never races the public trial-start insert.
    insert into public.license_trials (
      installation_id,
      ends_at,
      total_tokens_used,
      total_cost,
      is_budget_exhausted
    ) values (
      p_installation_id,
      now() + interval '3 days',
      0,
      0,
      false
    )
    on conflict (installation_id) do nothing;
  end if;

  select value into v_config
  from public.ai_system_config
  where key = 'provider_model_routing';

  if v_config is null then
    raise exception using errcode = 'P0001', message = 'ai_route_configuration_missing';
  end if;

  v_route := v_config -> v_scope -> p_feature_type;
  v_paused_providers := v_config #> '{emergency,pausedProviders}';
  if jsonb_typeof(v_route) <> 'object'
    or jsonb_typeof(v_paused_providers) <> 'array' then
    raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
  end if;

  v_provider := v_route ->> 'provider';
  v_model := v_route ->> 'model';
  v_provider_paused := exists(
    select 1
    from jsonb_array_elements_text(v_paused_providers) as paused(provider_id)
    where paused.provider_id = v_provider
  );

  if v_provider_paused then
    if v_scope = 'trial' then
      raise exception using errcode = 'P0001', message = 'ai_provider_paused';
    end if;

    v_fallback := v_config #> '{emergency,paidFallback}';
    if jsonb_typeof(v_fallback) <> 'object' then
      raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
    end if;

    v_provider := v_fallback ->> 'provider';
    v_model := v_fallback ->> 'model';
    v_fallback_paused := exists(
      select 1
      from jsonb_array_elements_text(v_paused_providers) as paused(provider_id)
      where paused.provider_id = v_provider
    );
    if v_provider = v_route ->> 'provider' or v_fallback_paused then
      raise exception using errcode = 'P0001', message = 'ai_provider_paused';
    end if;
  end if;

  -- Vision requests must never reserve a text-only provider.
  if coalesce(p_requires_vision, false) and v_provider <> 'gemini' then
    if v_scope <> 'licensed' then
      raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
    end if;

    v_fallback := v_config #> '{emergency,paidFallback}';
    if jsonb_typeof(v_fallback) <> 'object' then
      raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
    end if;

    v_provider := v_fallback ->> 'provider';
    v_model := v_fallback ->> 'model';
    v_fallback_paused := exists(
      select 1
      from jsonb_array_elements_text(v_paused_providers) as paused(provider_id)
      where paused.provider_id = v_provider
    );
    if v_provider <> 'gemini' or v_fallback_paused then
      raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
    end if;
  end if;

  if v_provider = 'gemini' and v_model in (
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro'
  ) then
    null;
  elsif v_provider = 'deepseek' and v_model = 'deepseek-v4-pro' then
    null;
  else
    raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
  end if;

  if (v_scope = 'trial' or p_feature_type = 'other_ai') and v_provider <> 'gemini' then
    raise exception using errcode = 'P0001', message = 'ai_route_configuration_invalid';
  end if;

  v_claim := public.claim_ai_request(
    p_request_id,
    p_installation_id,
    p_user_id,
    p_feature_type,
    p_subject_name,
    p_subject_id,
    p_estimated_tokens,
    coalesce(p_has_personal_key, false) and v_provider = 'gemini'
  );

  if coalesce((v_claim ->> 'allowed')::boolean, false) = false then
    return v_claim;
  end if;

  -- A concurrent activation/deactivation must not give a request the wrong route.
  if coalesce((v_claim ->> 'is_trial')::boolean, true) <> (v_scope = 'trial') then
    raise exception using errcode = 'P0001', message = 'ai_entitlement_changed';
  end if;

  select value into v_pricing
  from public.ai_system_config
  where key = 'pricing';

  v_pricing_version := coalesce(nullif(trim(v_pricing ->> 'pricing_version'), ''), 'unversioned');
  if (v_pricing #>> array['models', v_model, 'input_per_million']) ~ '^[0-9]+([.][0-9]+)?$' then
    v_input_rate := (v_pricing #>> array['models', v_model, 'input_per_million'])::numeric;
  end if;
  if (v_pricing #>> array['models', v_model, 'output_per_million']) ~ '^[0-9]+([.][0-9]+)?$' then
    v_output_rate := (v_pricing #>> array['models', v_model, 'output_per_million'])::numeric;
  end if;

  if v_input_rate is null or v_output_rate is null then
    case v_model
      when 'gemini-2.5-flash' then
        v_input_rate := 0.075;
        v_output_rate := 0.30;
      when 'gemini-2.5-flash-lite' then
        v_input_rate := 0.0375;
        v_output_rate := 0.15;
      when 'gemini-2.5-pro' then
        v_input_rate := 1.25;
        v_output_rate := 10.00;
      when 'deepseek-v4-pro' then
        v_input_rate := 1.32;
        v_output_rate := 3.96;
    end case;
  end if;

  update public.ai_usage_records
  set
    provider_id = v_provider,
    model_id = v_model,
    pricing_version = v_pricing_version,
    pricing_input_per_million = v_input_rate,
    pricing_output_per_million = v_output_rate,
    uses_personal_key = coalesce(p_has_personal_key, false) and v_provider = 'gemini'
  where request_id = p_request_id;

  return v_claim || jsonb_build_object(
    'provider_id', v_provider,
    'model_id', v_model,
    'pricing_version', v_pricing_version,
    'input_rate_per_million', v_input_rate,
    'output_rate_per_million', v_output_rate,
    'uses_personal_key', coalesce(p_has_personal_key, false) and v_provider = 'gemini',
    'usage', jsonb_build_object('providerId', v_provider, 'modelId', v_model)
  );
end;
$$;

create or replace function public.complete_ai_request(
  p_request_id uuid,
  p_status text,
  p_input_tokens integer default 0,
  p_output_tokens integer default 0,
  p_total_tokens integer default 0,
  p_estimated_cost numeric default 0,
  p_provider_cost numeric default 0,
  p_failure_reason text default null,
  p_provider_error_type text default null,
  p_response_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rec public.ai_usage_records%rowtype;
  v_completed_at timestamptz := clock_timestamp();
  v_provider_cost numeric;
  v_estimated_cost numeric;
begin
  if p_status is null or p_status not in ('success', 'failed', 'cancelled') then
    return jsonb_build_object('ok', false, 'error', 'Invalid completion status');
  end if;

  if p_input_tokens is null or p_output_tokens is null or p_total_tokens is null
    or p_input_tokens < 0 or p_output_tokens < 0 or p_total_tokens < 0
    or p_estimated_cost is null or p_provider_cost is null
    or p_estimated_cost < 0 or p_provider_cost < 0 then
    return jsonb_build_object('ok', false, 'error', 'Invalid usage values');
  end if;

  select * into v_rec
  from public.ai_usage_records
  where request_id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found');
  end if;

  if v_rec.status <> 'processing' then
    return jsonb_build_object('ok', true, 'status', v_rec.status, 'replayed', true);
  end if;

  if p_status = 'success' then
    if v_rec.pricing_input_per_million is not null
      and v_rec.pricing_output_per_million is not null then
      v_provider_cost := round(
        (
          p_input_tokens::numeric * v_rec.pricing_input_per_million
          + p_output_tokens::numeric * v_rec.pricing_output_per_million
        ) / 1000000,
        6
      );
    else
      v_provider_cost := p_provider_cost;
    end if;
    v_estimated_cost := case
      when v_rec.uses_personal_key then 0
      else v_provider_cost
    end;

    update public.ai_usage_records
    set
      status = 'success',
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      total_tokens = p_total_tokens,
      estimated_tokens = 0,
      estimated_cost = v_estimated_cost,
      provider_cost = v_provider_cost,
      response_cache = p_response_text,
      error_message = null,
      failure_reason = null,
      provider_error_type = null,
      completed_at = v_completed_at,
      latency_ms = greatest(
        0::bigint,
        floor(extract(epoch from (v_completed_at - v_rec.created_at)) * 1000)::bigint
      )
    where id = v_rec.id;

    if v_rec.is_trial then
      update public.license_trials
      set
        total_tokens_used = total_tokens_used + p_total_tokens,
        total_cost = total_cost + v_estimated_cost,
        is_budget_exhausted = (
          total_tokens_used + p_total_tokens >= 40000
          or total_cost + v_estimated_cost >= 0.05
        )
      where installation_id = v_rec.installation_id;
    end if;

    return jsonb_build_object('ok', true, 'status', 'success');
  end if;

  update public.ai_usage_records
  set
    status = p_status,
    estimated_tokens = 0,
    provider_cost = p_provider_cost,
    error_message = p_failure_reason,
    failure_reason = p_failure_reason,
    provider_error_type = p_provider_error_type,
    completed_at = v_completed_at,
    latency_ms = greatest(
      0::bigint,
      floor(extract(epoch from (v_completed_at - v_rec.created_at)) * 1000)::bigint
    )
  where id = v_rec.id;

  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

create or replace function public.get_ai_provider_monitoring(
  p_window_hours integer default 24
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_hours integer := greatest(1, least(coalesce(p_window_hours, 24), 720));
  v_result jsonb;
begin
  with windowed as (
    select
      provider_id,
      model_id,
      status,
      input_tokens,
      output_tokens,
      total_tokens,
      estimated_cost,
      provider_cost,
      latency_ms,
      created_at,
      completed_at,
      provider_error_type
    from public.ai_usage_records
    where created_at >= now() - make_interval(hours => v_window_hours)
  ), summaries as (
    select
      provider_id,
      model_id,
      count(*)::integer as request_count,
      count(*) filter (where status = 'success')::integer as success_count,
      count(*) filter (where status = 'failed')::integer as failure_count,
      count(*) filter (where status = 'processing')::integer as processing_count,
      coalesce(sum(input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(total_tokens), 0)::bigint as total_tokens,
      round(coalesce(sum(estimated_cost), 0), 6) as estimated_cost,
      round(coalesce(sum(provider_cost), 0), 6) as provider_cost,
      round(avg(latency_ms))::bigint as average_latency_ms,
      percentile_cont(0.95) within group (order by latency_ms)
        filter (where latency_ms is not null) as p95_latency_ms,
      max(created_at) as last_request_at,
      max(coalesce(completed_at, created_at)) filter (where status = 'success') as last_success_at,
      max(coalesce(completed_at, created_at)) filter (where status = 'failed') as last_failure_at
    from windowed
    group by provider_id, model_id
  ), error_groups as (
    select
      provider_id,
      model_id,
      jsonb_agg(
        jsonb_build_object('type', error_type, 'count', error_count)
        order by error_count desc, error_type
      ) as errors
    from (
      select
        provider_id,
        model_id,
        coalesce(provider_error_type, 'unknown') as error_type,
        count(*)::integer as error_count
      from windowed
      where status = 'failed'
      group by provider_id, model_id, coalesce(provider_error_type, 'unknown')
    ) grouped_errors
    group by provider_id, model_id
  )
  select jsonb_build_object(
    'windowHours', v_window_hours,
    'generatedAt', now(),
    'providers', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'providerId', summaries.provider_id,
          'modelId', summaries.model_id,
          'requestCount', summaries.request_count,
          'successCount', summaries.success_count,
          'failureCount', summaries.failure_count,
          'processingCount', summaries.processing_count,
          'inputTokens', summaries.input_tokens,
          'outputTokens', summaries.output_tokens,
          'totalTokens', summaries.total_tokens,
          'estimatedCost', summaries.estimated_cost,
          'providerCost', summaries.provider_cost,
          'averageLatencyMs', coalesce(summaries.average_latency_ms, 0),
          'p95LatencyMs', coalesce(round(summaries.p95_latency_ms)::bigint, 0),
          'lastRequestAt', summaries.last_request_at,
          'lastSuccessAt', summaries.last_success_at,
          'lastFailureAt', summaries.last_failure_at,
          'health', case
            when summaries.success_count = 0 and summaries.failure_count > 0 then 'down'
            when summaries.failure_count > 0
              and summaries.failure_count::numeric / greatest(summaries.request_count, 1) > 0.20 then 'degraded'
            when summaries.success_count > 0 then 'healthy'
            else 'unknown'
          end,
          'errors', coalesce(error_groups.errors, '[]'::jsonb)
        )
        order by summaries.provider_id, summaries.model_id
      ),
      '[]'::jsonb
    )
  ) into v_result
  from summaries
  left join error_groups
    on error_groups.provider_id = summaries.provider_id
    and error_groups.model_id = summaries.model_id;

  return coalesce(v_result, jsonb_build_object(
    'windowHours', v_window_hours,
    'generatedAt', now(),
    'providers', '[]'::jsonb
  ));
end;
$$;

-- AI RPCs are internal service operations. The app only reaches them through Edge Functions.
do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'public.claim_ai_request(uuid,uuid,uuid,text,text,text,integer,boolean)',
    'public.claim_ai_request_routed(uuid,uuid,uuid,text,text,text,integer,boolean,boolean)',
    'public.complete_ai_request(uuid,text,integer,integer,integer,numeric,numeric,text,text,text)',
    'public.set_licensed_subjects(uuid,text[])',
    'public.get_ai_consumption_overview()',
    'public.get_ai_features_breakdown()',
    'public.get_ai_top_consumers(integer)',
    'public.get_ai_provider_monitoring(integer)',
    'public.admin_list_plans()'
  ] loop
    if to_regprocedure(v_signature) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', v_signature);
      execute format('grant execute on function %s to service_role', v_signature);
    end if;
  end loop;
end;
$$;
