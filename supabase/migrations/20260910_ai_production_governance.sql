-- ==============================================================================
-- 20260910_ai_production_governance.sql
-- نظام الحوكمة الشامل والرقابة الذرية لاستهلاك الذكاء الاصطناعي والتراخيص
-- Single Source of Truth on Server (Self-Contained & Idempotent)
-- ==============================================================================

-- 1. جدول خطط الاشتراك (ai_plans)
create table if not exists public.ai_plans (
  id text primary key,
  name text not null,
  description text,
  trial_duration_days integer not null default 3,
  max_subjects smallint not null default 1 check (max_subjects between 1 and 20),
  max_devices smallint not null default 1 check (max_devices between 1 and 10),
  trial_max_total_tokens integer not null default 40000,
  trial_max_daily_tokens integer not null default 15000,
  trial_max_cost numeric(10, 4) not null default 0.0500,
  daily_soft_limit integer not null default 100000,
  monthly_soft_limit integer not null default 2000000,
  daily_hard_limit integer not null default 250000,
  monthly_hard_limit integer not null default 4500000,
  allowed_features text[] not null default array[
    'daily_plan', 'annual_plan', 'question_generation', 'question_regeneration',
    'question_formatting', 'question_improvement', 'curriculum_analysis',
    'lesson_summary', 'other_ai'
  ],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ai_plans (
  id, name, description, trial_duration_days, max_subjects, max_devices,
  trial_max_total_tokens, trial_max_daily_tokens, trial_max_cost,
  daily_soft_limit, monthly_soft_limit, daily_hard_limit, monthly_hard_limit
) values
  ('trial', 'الفترة التجريبية', 'تجربة مجانية لمدة 3 أيام مع سقف استهلاك ذكي', 3, 1, 1, 40000, 15000, 0.0500, 15000, 40000, 20000, 50000),
  ('single_subject', 'مادة واحدة', 'خطة المادة الواحدة مع استخدام عادل ومفتوح', 0, 1, 1, 0, 0, 0.0000, 100000, 2000000, 250000, 4500000),
  ('two_subjects', 'مادتان', 'خطة مادتين دراسيتين مع استخدام عادل ومفتوح', 0, 2, 2, 0, 0, 0.0000, 150000, 3000000, 350000, 6000000),
  ('pro', 'الخطة الاحترافية', 'خطة شاملة لعدة مواد لمدارس أو معلمين متعددين', 0, 10, 3, 0, 0, 0.0000, 300000, 6000000, 600000, 10000000)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  max_subjects = excluded.max_subjects,
  max_devices = excluded.max_devices,
  daily_soft_limit = excluded.daily_soft_limit,
  monthly_soft_limit = excluded.monthly_soft_limit,
  daily_hard_limit = excluded.daily_hard_limit,
  monthly_hard_limit = excluded.monthly_hard_limit,
  updated_at = now();

-- 2. جدول الإعدادات المركزية (ai_system_config)
create table if not exists public.ai_system_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.ai_system_config (key, value) values
  ('pricing', '{"pricing_version": "2026-v1", "models": {"gemini-2.5-flash": {"input_per_million": 0.075, "output_per_million": 0.30}, "gemini-2.5-flash-lite": {"input_per_million": 0.0375, "output_per_million": 0.15}, "gemini-1.5-pro": {"input_per_million": 1.25, "output_per_million": 5.00}}}'::jsonb),
  ('model_routing', '{"daily_plan": "gemini-2.5-flash", "annual_plan": "gemini-2.5-flash", "question_generation": "gemini-2.5-flash", "question_regeneration": "gemini-2.5-flash", "curriculum_analysis": "gemini-2.5-flash", "lesson_summary": "gemini-2.5-flash", "question_formatting": "gemini-2.5-flash-lite", "question_improvement": "gemini-2.5-flash", "other_ai": "gemini-2.5-flash"}'::jsonb),
  ('rate_limits', '{"burst_per_minute": 6, "requests_per_hour": 60, "concurrency_lock_seconds": 30}'::jsonb),
  ('anomaly_rules', '{"max_annual_plans_per_day": 12, "max_questions_burst_per_hour": 150, "cooldown_minutes_on_anomaly": 15}'::jsonb),
  ('subject_policy', '{"max_changes_allowed": 1, "cooldown_days_between_changes": 30}'::jsonb)
on conflict (key) do nothing;

-- 3. تحديث جدول التراخيص والتجربة
alter table public.licenses
  add column if not exists plan_id text references public.ai_plans (id) default 'single_subject',
  add column if not exists max_subjects smallint not null default 1,
  add column if not exists selected_subjects text[] not null default '{}',
  add column if not exists subject_changes_count smallint not null default 0,
  add column if not exists subject_last_changed_at timestamptz;

alter table public.license_trials
  add column if not exists selected_subjects text[] not null default '{}',
  add column if not exists total_tokens_used integer not null default 0,
  add column if not exists total_cost numeric(10, 6) not null default 0,
  add column if not exists is_budget_exhausted boolean not null default false;

-- 4. جدول سجل عمليات الذكاء الاصطناعي (ai_usage_records)
create table if not exists public.ai_usage_records (
  id bigint generated always as identity primary key,
  request_id uuid unique not null,
  user_id uuid references auth.users (id) on delete set null,
  installation_id uuid not null,
  license_id uuid references public.licenses (id) on delete set null,
  is_trial boolean not null default false,
  feature_type text not null check (
    feature_type in (
      'daily_plan', 'annual_plan', 'question_generation', 'question_regeneration',
      'question_formatting', 'question_improvement', 'curriculum_analysis',
      'lesson_summary', 'other_ai'
    )
  ),
  subject_id text,
  subject_name text,
  model_id text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost numeric(10, 6) not null default 0,
  estimated_tokens integer not null default 0,
  provider_cost numeric(10, 6) not null default 0,
  status text not null default 'processing' check (status in ('processing', 'success', 'failed', 'cancelled')),
  error_message text,
  failure_reason text,
  provider_error_type text,
  response_cache text,
  pricing_version text,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_records drop constraint if exists ai_usage_records_status_check;
alter table public.ai_usage_records add constraint ai_usage_records_status_check check (status in ('processing', 'success', 'failed', 'cancelled'));

alter table public.ai_usage_records
  add column if not exists estimated_tokens integer not null default 0,
  add column if not exists provider_cost numeric(10, 6) not null default 0,
  add column if not exists failure_reason text,
  add column if not exists provider_error_type text,
  add column if not exists response_cache text;

create index if not exists ai_usage_records_installation_idx on public.ai_usage_records (installation_id, created_at desc);
create index if not exists ai_usage_records_license_idx on public.ai_usage_records (license_id, created_at desc) where license_id is not null;
create index if not exists ai_usage_records_in_flight_idx on public.ai_usage_records (installation_id, status) where status = 'processing';

-- 5. دالة تطبيع اسم المادة خادمياً
create or replace function public.normalize_subject(p_raw text)
returns text
language plpgsql
immutable
as $$
declare
  v_cleaned text;
begin
  if p_raw is null or trim(p_raw) = '' then
    return 'أخرى';
  end if;

  v_cleaned := lower(trim(p_raw));
  v_cleaned := regexp_replace(v_cleaned, '[ـ\u0640]', '', 'g');
  v_cleaned := regexp_replace(v_cleaned, '[أإآ]', 'ا', 'g');
  v_cleaned := regexp_replace(v_cleaned, 'ة\b', 'ه', 'g');

  if v_cleaned ~* 'كيميا|chem' then return 'الكيمياء'; end if;
  if v_cleaned ~* 'فيزيا|phys' then return 'الفيزياء'; end if;
  if v_cleaned ~* 'احيا|علوم الحياة|بيولوج|bio' then return 'الأحياء'; end if;
  if v_cleaned ~* 'رياضيات|حساب|جبر|هندسه|math' then return 'الرياضيات'; end if;
  if v_cleaned ~* 'انكليز|انجليز|english' then return 'اللغة الإنكليزية'; end if;
  if v_cleaned ~* 'عرب|قواعد|ادب|نصوص|بلاغه|قراءه|املا' then return 'اللغة العربية'; end if;
  if v_cleaned ~* 'اسلام|دين|قران|عقيد' then return 'التربية الإسلامية'; end if;
  if v_cleaned ~* 'اجتماع|تاريخ|جغرافي|وطنيه' then return 'الاجتماعيات'; end if;
  if v_cleaned ~* 'حاسوب|كمبيوتر|برمج|computer' then return 'الحاسوب'; end if;
  if v_cleaned ~* 'فرنس|french' then return 'اللغة الفرنسية'; end if;
  if v_cleaned ~* 'اقتصاد' then return 'الاقتصاد'; end if;
  if v_cleaned ~* 'فلسف|علم النفس' then return 'الفلسفة وعلم النفس'; end if;
  if v_cleaned ~* 'فني|رسم' then return 'التربية الفنية'; end if;
  if v_cleaned ~* 'رياضه|بدني' then return 'التربية الرياضية'; end if;
  if v_cleaned ~* 'علوم|science' then return 'العلوم'; end if;

  return trim(p_raw);
end;
$$;

-- 6. دالة التحقق من ترخيص المادة
create or replace function public.is_subject_authorized(p_subject text, p_allowed_subjects text[])
returns boolean
language plpgsql
immutable
as $$
declare
  v_norm_target text;
  v_allowed text;
  v_norm_allowed text;
begin
  if p_subject is null or trim(p_subject) = '' then
    return true;
  end if;

  if p_allowed_subjects is null or array_length(p_allowed_subjects, 1) is null or array_length(p_allowed_subjects, 1) = 0 then
    return false;
  end if;

  v_norm_target := public.normalize_subject(p_subject);

  foreach v_allowed in array p_allowed_subjects loop
    if v_allowed is not null and trim(v_allowed) != '*' and lower(trim(v_allowed)) != 'all' and trim(v_allowed) != '' then
      v_norm_allowed := public.normalize_subject(v_allowed);
      if v_norm_target = v_norm_allowed or v_norm_target like '%' || v_norm_allowed || '%' or v_norm_allowed like '%' || v_norm_target || '%' then
        return true;
      end if;
    end if;
  end loop;

  return false;
end;
$$;

-- 7. دالة حجز وفحص طلب الذكاء الاصطناعي الذرية (claim_ai_request)
create or replace function public.claim_ai_request(
  p_request_id uuid,
  p_installation_id uuid,
  p_user_id uuid default null,
  p_feature_type text default 'other_ai',
  p_subject_name text default null,
  p_subject_id text default null,
  p_estimated_tokens integer default 2500,
  p_has_personal_key boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing record;
  v_burst_count integer;
  v_hourly_count integer;
  v_burst_limit integer := 6;
  v_hourly_limit integer := 60;
  v_act record;
  v_plan record;
  v_trial record;
  v_is_trial boolean := false;
  v_license_id uuid := null;
  v_allowed_subjects text[] := '{}';
  v_selected_model text;
  v_daily_used bigint := 0;
  v_daily_reserved bigint := 0;
  v_monthly_used bigint := 0;
  v_monthly_reserved bigint := 0;
  v_trial_reserved bigint := 0;
  v_norm_subject text := null;
  v_in_flight_count integer;
begin
  -- فحص الـ Idempotency
  select * into v_existing from public.ai_usage_records where request_id = p_request_id;
  if found then
    if v_existing.status = 'success' then
      return jsonb_build_object(
        'allowed', true,
        'is_duplicate', true,
        'status', 'success',
        'response_cache', v_existing.response_cache,
        'usage', jsonb_build_object('inputTokens', v_existing.input_tokens, 'outputTokens', v_existing.output_tokens, 'totalTokens', v_existing.total_tokens, 'estimatedCost', v_existing.estimated_cost)
      );
    elsif v_existing.status = 'processing' then
      if v_existing.created_at < (now() - interval '60 seconds') then
        update public.ai_usage_records set status = 'failed', failure_reason = 'stale_in_flight_timeout' where id = v_existing.id;
      else
        return jsonb_build_object('allowed', false, 'error_code', 'concurrency_in_flight', 'error', 'يوجد طلب ذكاء اصطناعي قيد المعالجة حالياً. يرجى الانتظار حتى اكتماله.');
      end if;
    end if;
  end if;

  -- فحص التزامن اللحظي لنفس الجهاز
  select count(*) into v_in_flight_count from public.ai_usage_records
  where installation_id = p_installation_id and status = 'processing' and created_at >= (now() - interval '60 seconds') and request_id != p_request_id;
  if v_in_flight_count > 0 then
    return jsonb_build_object('allowed', false, 'error_code', 'concurrency_in_flight', 'error', 'يوجد طلب ذكاء اصطناعي قيد المعالجة حالياً. يرجى الانتظار بضع ثوانٍ.');
  end if;

  -- فحص معدل التدفق
  select count(*) into v_burst_count from public.ai_usage_records where installation_id = p_installation_id and created_at >= (now() - interval '60 seconds');
  if v_burst_count >= v_burst_limit then
    return jsonb_build_object('allowed', false, 'error_code', 'rate_limit_burst', 'error', 'يرجى الانتظار بضع ثوانٍ قبل إرسال طلب جديد.');
  end if;

  select count(*) into v_hourly_count from public.ai_usage_records where installation_id = p_installation_id and created_at >= (now() - interval '1 hour');
  if v_hourly_count >= v_hourly_limit then
    return jsonb_build_object('allowed', false, 'error_code', 'rate_limit_hourly', 'error', 'تم تجاوز عدد الطلبات المسموح بها في الساعة (60 طلباً). يرجى أخذ استراحة قصيرة.');
  end if;

  -- فحص الترخيص
  select la.license_id, l.status as lic_status, l.expires_at as lic_expires_at, l.plan_id as lic_plan_id, l.max_subjects as lic_max_subjects, l.selected_subjects as lic_selected_subjects
  into v_act
  from public.license_activations la
  join public.licenses l on l.id = la.license_id
  where la.installation_id = p_installation_id and la.is_active = true
  limit 1;

  if v_act.license_id is not null then
    if v_act.lic_status != 'active' then
      return jsonb_build_object('allowed', false, 'error_code', 'license_inactive', 'error', 'الترخيص موقوف أو غير نشط. يرجى التواصل مع الدعم الفني.');
    end if;

    if v_act.lic_expires_at is not null and v_act.lic_expires_at <= now() then
      return jsonb_build_object('allowed', false, 'error_code', 'license_expired', 'error', 'انتهت صلاحية الترخيص. يرجى تجديد الاشتراك للاستمرار باستخدام الذكاء الاصطناعي.');
    end if;

    select * into v_plan from public.ai_plans where id = coalesce(v_act.lic_plan_id, 'single_subject');
    if not found then
      select * into v_plan from public.ai_plans where id = 'single_subject';
    end if;

    if not (p_feature_type = any(v_plan.allowed_features)) then
      return jsonb_build_object('allowed', false, 'error_code', 'feature_not_allowed', 'error', 'هذه الميزة غير مشمولة في باقة اشتراكك الحالية.');
    end if;

    if p_subject_name is not null and trim(p_subject_name) != '' then
      if not public.is_subject_authorized(p_subject_name, v_act.lic_selected_subjects) then
        return jsonb_build_object('allowed', false, 'error_code', 'subject_not_allowed', 'error', format('المادة المطلوبة (%s) غير مشمولة في المواد المصرحة لباقة اشتراكك.', public.normalize_subject(p_subject_name)));
      end if;
      v_norm_subject := public.normalize_subject(p_subject_name);
    end if;

    if not p_has_personal_key then
      select coalesce(sum(total_tokens), 0) into v_daily_used from public.ai_usage_records
      where license_id = v_act.license_id and status = 'success' and created_at >= date_trunc('day', now());

      select coalesce(sum(estimated_tokens), 0) into v_daily_reserved from public.ai_usage_records
      where license_id = v_act.license_id and status = 'processing' and created_at >= date_trunc('day', now()) and request_id != p_request_id;

      if (v_daily_used + v_daily_reserved + p_estimated_tokens) > v_plan.daily_hard_limit then
        return jsonb_build_object('allowed', false, 'error_code', 'daily_hard_limit', 'error', 'لقد وصلت إلى الحد اليومي الأقصى للأمان وفق سياسة الاستخدام العادل. سيتجدد رصيدك تلقائياً عند منتصف الليل.');
      end if;

      select coalesce(sum(total_tokens), 0) into v_monthly_used from public.ai_usage_records
      where license_id = v_act.license_id and status = 'success' and created_at >= date_trunc('month', now());

      select coalesce(sum(estimated_tokens), 0) into v_monthly_reserved from public.ai_usage_records
      where license_id = v_act.license_id and status = 'processing' and created_at >= date_trunc('month', now()) and request_id != p_request_id;

      if (v_monthly_used + v_monthly_reserved + p_estimated_tokens) > v_plan.monthly_hard_limit then
        return jsonb_build_object('allowed', false, 'error_code', 'monthly_hard_limit', 'error', 'لقد وصلت إلى الحد الشهري الأقصى للأمان. يرجى التواصل مع إدارة الترخيص للمساعدة.');
      end if;
    end if;

    v_is_trial := false;
    v_license_id := v_act.license_id;
    v_allowed_subjects := coalesce(v_act.lic_selected_subjects, '{}'::text[]);
  else
    -- حالة التجربة المجانية
    select * into v_trial from public.license_trials where installation_id = p_installation_id;
    if not found then
      insert into public.license_trials (installation_id, ends_at, total_tokens_used, total_cost, is_budget_exhausted)
      values (p_installation_id, now() + interval '3 days', 0, 0, false)
      returning * into v_trial;
    end if;

    if v_trial.ends_at <= now() then
      return jsonb_build_object('allowed', false, 'error_code', 'trial_expired', 'error', 'انتهت الفترة التجريبية لأدوات الذكاء الاصطناعي (3 أيام). فعّل ترخيصك للاستمرار باستخدام مريح ومفتوح.');
    end if;

    if v_trial.is_budget_exhausted or v_trial.total_tokens_used >= 40000 or v_trial.total_cost >= 0.05 then
      return jsonb_build_object('allowed', false, 'error_code', 'trial_usage_limit', 'error', 'لقد استنفدت كامل رصيد التجربة المجانية (40,000 توكن). فعّل ترخيصك للاستمرار بميزات مفتوحة.');
    end if;

    if p_subject_name is not null and trim(p_subject_name) != '' then
      v_norm_subject := public.normalize_subject(p_subject_name);
      if v_trial.selected_subjects is not null and array_length(v_trial.selected_subjects, 1) > 0 then
        if not public.is_subject_authorized(p_subject_name, v_trial.selected_subjects) then
          return jsonb_build_object('allowed', false, 'error_code', 'subject_not_allowed', 'error', format('الفترة التجريبية مخصصة لمادة (%s). فعّل ترخيصك للوصول لباقي المواد.', v_trial.selected_subjects[1]));
        end if;
      else
        update public.license_trials set selected_subjects = array[v_norm_subject] where installation_id = p_installation_id;
        v_trial.selected_subjects := array[v_norm_subject];
      end if;
    end if;

    if not p_has_personal_key then
      select coalesce(sum(estimated_tokens), 0) into v_trial_reserved from public.ai_usage_records
      where installation_id = p_installation_id and status = 'processing' and request_id != p_request_id;

      if (v_trial.total_tokens_used + v_trial_reserved + p_estimated_tokens) > 40000 then
        return jsonb_build_object('allowed', false, 'error_code', 'trial_usage_limit', 'error', 'هذا الطلب يتجاوز الرصيد المتبقي في الفترة التجريبية. فعّل ترخيصك للاستمرار.');
      end if;

      select coalesce(sum(total_tokens), 0) into v_daily_used from public.ai_usage_records
      where installation_id = p_installation_id and status = 'success' and created_at >= date_trunc('day', now());

      select coalesce(sum(estimated_tokens), 0) into v_daily_reserved from public.ai_usage_records
      where installation_id = p_installation_id and status = 'processing' and created_at >= date_trunc('day', now()) and request_id != p_request_id;

      if (v_daily_used + v_daily_reserved + p_estimated_tokens) > 15000 then
        return jsonb_build_object('allowed', false, 'error_code', 'trial_daily_limit', 'error', 'وصلت إلى الحد اليومي للتجربة المجانية (15 ألف توكن). سيتجدد غداً أو يمكنك تفعيل الترخيص الآن.');
      end if;
    end if;

    v_is_trial := true;
    v_license_id := null;
    v_allowed_subjects := coalesce(v_trial.selected_subjects, '{}'::text[]);
  end if;

  v_selected_model := case when p_feature_type = 'question_formatting' then 'gemini-2.5-flash-lite' else 'gemini-2.5-flash' end;

  insert into public.ai_usage_records (
    request_id, user_id, installation_id, license_id, is_trial, feature_type,
    subject_id, subject_name, model_id, estimated_tokens, status, created_at
  ) values (
    p_request_id, p_user_id, p_installation_id, v_license_id, v_is_trial, p_feature_type,
    p_subject_id, v_norm_subject, v_selected_model, p_estimated_tokens, 'processing', now()
  )
  on conflict (request_id) do update set
    status = 'processing',
    estimated_tokens = excluded.estimated_tokens,
    created_at = now();

  return jsonb_build_object('allowed', true, 'is_trial', v_is_trial, 'license_id', v_license_id, 'model_id', v_selected_model, 'allowed_subjects', v_allowed_subjects);
end;
$$;

-- 8. دالة إكمال طلب الذكاء الاصطناعي (complete_ai_request)
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
  v_rec record;
begin
  select * into v_rec from public.ai_usage_records where request_id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found');
  end if;

  if p_status = 'success' then
    update public.ai_usage_records set
      status = 'success',
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      total_tokens = p_total_tokens,
      estimated_tokens = 0,
      estimated_cost = p_estimated_cost,
      provider_cost = p_provider_cost,
      response_cache = p_response_text
    where request_id = p_request_id;

    if v_rec.is_trial then
      update public.license_trials set
        total_tokens_used = total_tokens_used + p_total_tokens,
        total_cost = total_cost + p_estimated_cost,
        is_budget_exhausted = (total_tokens_used + p_total_tokens >= 40000 or total_cost + p_estimated_cost >= 0.05)
      where installation_id = v_rec.installation_id;
    end if;

    return jsonb_build_object('ok', true, 'status', 'success');
  else
    update public.ai_usage_records set
      status = 'failed',
      estimated_tokens = 0,
      provider_cost = p_provider_cost,
      failure_reason = p_failure_reason,
      provider_error_type = p_provider_error_type
    where request_id = p_request_id;

    return jsonb_build_object('ok', true, 'status', 'failed');
  end if;
end;
$$;

-- 9. دالة تحديث وتثبيت المواد المصرح بها (set_licensed_subjects)
create or replace function public.set_licensed_subjects(
  p_installation_id uuid,
  p_subjects text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_activation record;
  v_max_subjects integer := 1;
  v_cooldown_days integer := 30;
  v_cleaned_subjects text[] := '{}';
  v_s text;
  v_norm text;
  v_days_since_change numeric;
begin
  if p_subjects is not null then
    foreach v_s in array p_subjects loop
      if v_s is not null and trim(v_s) != '' and trim(v_s) != '*' and lower(trim(v_s)) != 'all' then
        v_norm := public.normalize_subject(v_s);
        if not (v_norm = any(v_cleaned_subjects)) then
          v_cleaned_subjects := array_append(v_cleaned_subjects, v_norm);
        end if;
      end if;
    end loop;
  end if;

  select la.license_id, l.max_subjects, l.subject_changes_count, l.subject_last_changed_at
  into v_activation
  from public.license_activations la
  join public.licenses l on l.id = la.license_id
  where la.installation_id = p_installation_id and la.is_active = true
  limit 1;

  if v_activation.license_id is not null then
    v_max_subjects := coalesce(v_activation.max_subjects, 1);
    if array_length(v_cleaned_subjects, 1) > v_max_subjects then
      return jsonb_build_object('ok', false, 'error_code', 'max_subjects_exceeded', 'error', format('لا يمكنك اختيار أكثر من %s مواد في باقة اشتراكك الحالية.', v_max_subjects));
    end if;

    if v_activation.subject_last_changed_at is not null and coalesce(v_activation.subject_changes_count, 0) > 0 then
      select (value->>'cooldown_days_between_changes')::integer into v_cooldown_days
      from public.ai_system_config where key = 'subject_policy';
      v_cooldown_days := coalesce(v_cooldown_days, 30);

      v_days_since_change := extract(epoch from (now() - v_activation.subject_last_changed_at)) / 86400.0;
      if v_days_since_change < v_cooldown_days then
        return jsonb_build_object('ok', false, 'error_code', 'subject_cooldown_active', 'error', format('لا يمكن تغيير المادة حالياً. يُسمح بالتغيير مرة كل %s يوماً (يتبقى %s يوم).', v_cooldown_days, ceil(v_cooldown_days - v_days_since_change)));
      end if;
    end if;

    update public.licenses set
      selected_subjects = v_cleaned_subjects,
      subject_changes_count = coalesce(subject_changes_count, 0) + 1,
      subject_last_changed_at = now(),
      updated_at = now()
    where id = v_activation.license_id;

    return jsonb_build_object('ok', true, 'selected_subjects', v_cleaned_subjects);
  else
    if array_length(v_cleaned_subjects, 1) > 1 then
      return jsonb_build_object('ok', false, 'error_code', 'max_subjects_exceeded', 'error', 'الفترة التجريبية تسمح بمادة واحدة فقط.');
    end if;

    update public.license_trials set selected_subjects = v_cleaned_subjects where installation_id = p_installation_id;
    return jsonb_build_object('ok', true, 'selected_subjects', v_cleaned_subjects);
  end if;
end;
$$;

-- 10. دالة جلب الخطط الفعلية للوحة الإدارة (admin_list_plans)
create or replace function public.admin_list_plans()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_res jsonb;
begin
  select jsonb_agg(row_to_json(p))
  into v_res
  from (
    select
      id, name, description,
      trial_duration_days as "trialDurationDays",
      max_subjects as "maxSubjects",
      max_devices as "maxDevices",
      trial_max_total_tokens as "trialMaxTotalTokens",
      trial_max_daily_tokens as "trialMaxDailyTokens",
      trial_max_cost as "trialMaxCost",
      daily_soft_limit as "dailySoftLimit",
      monthly_soft_limit as "monthlySoftLimit",
      daily_hard_limit as "dailyHardLimit",
      monthly_hard_limit as "monthlyHardLimit",
      allowed_features as "allowedFeatures"
    from public.ai_plans
    order by case id
      when 'trial' then 1
      when 'single_subject' then 2
      when 'two_subjects' then 3
      when 'pro' then 4
      else 5
    end
  ) p;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;

-- 11. تفعيل RLS ومنح الصلاحيات
alter table public.ai_plans enable row level security;
alter table public.ai_system_config enable row level security;
alter table public.ai_usage_records enable row level security;

revoke all on table public.ai_plans from anon, authenticated;
revoke all on table public.ai_system_config from anon, authenticated;
revoke all on table public.ai_usage_records from anon, authenticated;

grant select on public.ai_plans to service_role;
grant select, update on public.ai_system_config to service_role;
grant select, insert, update on public.ai_usage_records to service_role;

grant execute on function public.claim_ai_request(uuid, uuid, uuid, text, text, text, integer, boolean) to service_role;
grant execute on function public.complete_ai_request(uuid, text, integer, integer, integer, numeric, numeric, text, text, text) to service_role;
grant execute on function public.set_licensed_subjects(uuid, text[]) to service_role;
grant execute on function public.admin_list_plans() to service_role;
grant execute on function public.normalize_subject(text) to service_role;
grant execute on function public.is_subject_authorized(text, text[]) to service_role;
