-- Multi-provider catalog: adds OpenRouter and NVIDIA NIM as managed AI providers.
-- Existing keys stay encrypted and environment fallbacks remain supported.
-- The execution function, routing editor, and key ecosystem now understand 4 providers.

-- 1. Widen provider_id validation everywhere it is enforced.
alter table public.ai_provider_credentials
  drop constraint if exists ai_provider_credentials_provider_id_check;

alter table public.ai_provider_credentials
  add constraint ai_provider_credentials_provider_id_check
  check (provider_id in ('gemini', 'deepseek', 'openrouter', 'nvidia_nim'));

alter table public.ai_provider_key_audit_log
  drop constraint if exists ai_provider_key_audit_log_provider_id_check;

alter table public.ai_provider_key_audit_log
  add constraint ai_provider_key_audit_log_provider_id_check
  check (provider_id in ('gemini', 'deepseek', 'openrouter', 'nvidia_nim'));

alter table public.ai_usage_records
  drop constraint if exists ai_usage_records_provider_id_check;

alter table public.ai_usage_records
  add constraint ai_usage_records_provider_id_check
  check (provider_id in ('gemini', 'deepseek', 'openrouter', 'nvidia_nim'))
  not valid;

alter table public.ai_usage_records
  validate constraint ai_usage_records_provider_id_check;

-- 2. Rotation RPC accepts the expanded provider list.
create or replace function public.rotate_ai_provider_credential(
  p_provider_id text,
  p_ciphertext text,
  p_iv text,
  p_encryption_key_id text,
  p_actor_user_id uuid,
  p_mfa_method text,
  p_mfa_verified_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous_version integer;
  v_next_version integer;
  v_rotated_at timestamptz := clock_timestamp();
begin
  if p_provider_id not in ('gemini', 'deepseek', 'openrouter', 'nvidia_nim')
    or p_ciphertext !~ '^[A-Za-z0-9_-]{16,4096}$'
    or p_iv !~ '^[A-Za-z0-9_-]{16}$'
    or p_encryption_key_id !~ '^[A-Za-z0-9_-]{1,32}$'
    or p_mfa_method not in ('totp', 'webauthn', 'phone')
    or p_actor_user_id is null
    or p_mfa_verified_at is null
    or p_mfa_verified_at < v_rotated_at - interval '5 minutes'
    or p_mfa_verified_at > v_rotated_at + interval '1 minute' then
    raise exception 'invalid provider key rotation arguments' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.license_admins
    where user_id = p_actor_user_id
      and role = 'owner'
  ) then
    raise exception 'owner role is required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('ai-provider-credential:' || p_provider_id));

  select key_version into v_previous_version
  from public.ai_provider_credentials
  where provider_id = p_provider_id
  for update;

  v_next_version := coalesce(v_previous_version, 0) + 1;

  insert into public.ai_provider_credentials (
    provider_id,
    ciphertext,
    iv,
    encryption_key_id,
    key_version,
    rotated_by,
    rotated_at
  ) values (
    p_provider_id,
    p_ciphertext,
    p_iv,
    p_encryption_key_id,
    v_next_version,
    p_actor_user_id,
    v_rotated_at
  )
  on conflict (provider_id) do update
  set
    ciphertext = excluded.ciphertext,
    iv = excluded.iv,
    encryption_key_id = excluded.encryption_key_id,
    key_version = excluded.key_version,
    rotated_by = excluded.rotated_by,
    rotated_at = excluded.rotated_at;

  insert into public.ai_provider_key_audit_log (
    provider_id,
    actor_user_id,
    action,
    key_version,
    mfa_method,
    mfa_verified_at
  ) values (
    p_provider_id,
    p_actor_user_id,
    'rotated',
    v_next_version,
    p_mfa_method,
    p_mfa_verified_at
  );

  return jsonb_build_object(
    'providerId', p_provider_id,
    'source', 'managed',
    'keyVersion', v_next_version,
    'rotatedAt', v_rotated_at
  );
end;
$$;

-- 3. Routing authorization accepts the expanded catalog while keeping the
-- business rules unchanged (Gemini for trial/vision, licensed text routes use any provider).
create or replace function public.claim_ai_request_routed(
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

  if (
    v_provider = 'gemini' and v_model = any(array[
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro'
    ])
  ) or (
    v_provider = 'deepseek' and v_model = 'deepseek-v4-pro'
  ) or (
    v_provider = 'openrouter' and v_model = any(array[
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-haiku',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b-instruct',
      'qwen/qwen-2.5-72b-instruct',
      'deepseek/deepseek-chat-v3-0324'
    ])
  ) or (
    v_provider = 'nvidia_nim' and v_model = any(array[
      'meta/llama-3.3-70b-instruct',
      'meta/llama-3.1-8b-instruct',
      'qwen/qwen2.5-72b-instruct',
      'google/gemma-2-27b-it',
      'deepseek-ai/deepseek-r1'
    ])
  ) then
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
      when 'openrouter/openai/gpt-4o-mini' then
        v_input_rate := 0.15;
        v_output_rate := 0.60;
      when 'openrouter/anthropic/claude-3.5-haiku' then
        v_input_rate := 0.80;
        v_output_rate := 4.00;
      when 'openrouter/google/gemini-2.5-flash' then
        v_input_rate := 0.075;
        v_output_rate := 0.30;
      when 'openrouter/meta-llama/llama-3.3-70b-instruct' then
        v_input_rate := 0.12;
        v_output_rate := 0.30;
      when 'openrouter/qwen/qwen-2.5-72b-instruct' then
        v_input_rate := 0.30;
        v_output_rate := 0.70;
      when 'openrouter/deepseek/deepseek-chat-v3-0324' then
        v_input_rate := 0.14;
        v_output_rate := 0.28;
      when 'nvidia_nim/meta/llama-3.3-70b-instruct',
        'nvidia_nim/meta/llama-3.1-8b-instruct',
        'nvidia_nim/qwen/qwen2.5-72b-instruct',
        'nvidia_nim/google/gemma-2-27b-it',
        'nvidia_nim/deepseek-ai/deepseek-r1' then
        v_input_rate := 0;
        v_output_rate := 0;
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

-- 4. Seed default pricing so completion never fails with missing pricing.
-- Existing owner-entered pricing for these new models is preserved by the merge.
update public.ai_system_config as cfg
set value = jsonb_build_object(
  'pricing_version', coalesce(cfg.value ->> 'pricing_version', 'unversioned'),
  'models', coalesce(cfg.value -> 'models', '{}'::jsonb) || '{
    "openrouter/openai/gpt-4o-mini": {"input_per_million": 0.15, "output_per_million": 0.60},
    "openrouter/anthropic/claude-3.5-haiku": {"input_per_million": 0.80, "output_per_million": 4.00},
    "openrouter/google/gemini-2.5-flash": {"input_per_million": 0.075, "output_per_million": 0.30},
    "openrouter/meta-llama/llama-3.3-70b-instruct": {"input_per_million": 0.12, "output_per_million": 0.30},
    "openrouter/qwen/qwen-2.5-72b-instruct": {"input_per_million": 0.30, "output_per_million": 0.70},
    "openrouter/deepseek/deepseek-chat-v3-0324": {"input_per_million": 0.14, "output_per_million": 0.28},
    "nvidia_nim/meta/llama-3.3-70b-instruct": {"input_per_million": 0, "output_per_million": 0},
    "nvidia_nim/meta/llama-3.1-8b-instruct": {"input_per_million": 0, "output_per_million": 0},
    "nvidia_nim/qwen/qwen2.5-72b-instruct": {"input_per_million": 0, "output_per_million": 0},
    "nvidia_nim/google/gemma-2-27b-it": {"input_per_million": 0, "output_per_million": 0},
    "nvidia_nim/deepseek-ai/deepseek-r1": {"input_per_million": 0, "output_per_million": 0}
  }'::jsonb
)
where cfg.key = 'pricing';