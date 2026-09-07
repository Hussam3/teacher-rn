-- نظام إدارة استهلاك وتكاليف الذكاء الاصطناعي وخطط الاشتراكات المرنة.
-- متوافق تماماً مع الترحيلات السابقة ولا يؤثر على البيانات الحالية.

-- 1. جدول خطط الاشتراك (Subscription / AI Plans)
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
    'daily_plan',
    'annual_plan',
    'question_generation',
    'question_regeneration',
    'question_formatting',
    'question_improvement',
    'curriculum_analysis',
    'lesson_summary',
    'other_ai'
  ],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- إدخال الخطط الافتراضية الأولية
insert into public.ai_plans (
  id, name, description, trial_duration_days, max_subjects, max_devices,
  trial_max_total_tokens, trial_max_daily_tokens, trial_max_cost,
  daily_soft_limit, monthly_soft_limit, daily_hard_limit, monthly_hard_limit
) values
  ('trial', 'الفترة التجريبية', 'تجربة مجانية لمدة 3 أيام مع سقف استهلاك ذكي', 3, 1, 1, 40000, 15000, 0.0500, 15000, 40000, 20000, 50000),
  ('single_subject', 'مادة واحدة', 'خطة المادة الواحدة مع استخدام عادل ومفتوح', 0, 1, 1, 0, 0, 0.0000, 100000, 2000000, 250000, 4500000),
  ('two_subjects', 'مادتان', 'خطة مادتين دراسيتين مع استخدام عادل ومفتوح', 0, 2, 2, 0, 0, 0.0000, 150000, 3000000, 350000, 6000000),
  ('pro', 'الخطة الاحترافية', 'خطة شاملة لعدة مواد لمدارس أو معلمين متعددين', 0, 5, 3, 0, 0, 0.0000, 300000, 6000000, 600000, 10000000)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

-- 2. جدول الإعدادات المركزية والأسعار وقواعد النظام (Dynamic Config)
create table if not exists public.ai_system_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.ai_system_config (key, value) values
  ('pricing', '{
    "pricing_version": "2026-v1",
    "models": {
      "gemini-2.5-flash": { "input_per_million": 0.075, "output_per_million": 0.30 },
      "gemini-2.5-flash-lite": { "input_per_million": 0.0375, "output_per_million": 0.15 },
      "gemini-1.5-pro": { "input_per_million": 1.25, "output_per_million": 5.00 }
    }
  }'::jsonb),
  ('model_routing', '{
    "daily_plan": "gemini-2.5-flash",
    "annual_plan": "gemini-2.5-flash",
    "question_generation": "gemini-2.5-flash",
    "question_regeneration": "gemini-2.5-flash",
    "curriculum_analysis": "gemini-2.5-flash",
    "lesson_summary": "gemini-2.5-flash",
    "question_formatting": "gemini-2.5-flash-lite",
    "question_improvement": "gemini-2.5-flash",
    "other_ai": "gemini-2.5-flash"
  }'::jsonb),
  ('rate_limits', '{
    "burst_per_minute": 5,
    "requests_per_hour": 50,
    "concurrency_lock_seconds": 30
  }'::jsonb),
  ('anomaly_rules', '{
    "max_annual_plans_per_day": 12,
    "max_questions_burst_per_hour": 150,
    "cooldown_minutes_on_anomaly": 15
  }'::jsonb),
  ('subject_policy', '{
    "max_changes_allowed": 1,
    "cooldown_days_between_changes": 30
  }'::jsonb)
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

-- 4. جدول سجل عمليات الذكاء الاصطناعي المفصل (Detailed AI Usage Records)
create table if not exists public.ai_usage_records (
  id bigint generated always as identity primary key,
  request_id uuid unique not null,
  user_id uuid references auth.users (id) on delete set null,
  installation_id uuid not null,
  license_id uuid references public.licenses (id) on delete set null,
  is_trial boolean not null default false,
  feature_type text not null check (
    feature_type in (
      'daily_plan',
      'annual_plan',
      'question_generation',
      'question_regeneration',
      'question_formatting',
      'question_improvement',
      'curriculum_analysis',
      'lesson_summary',
      'other_ai'
    )
  ),
  subject_id text,
  subject_name text,
  model_id text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost numeric(10, 6) not null default 0,
  status text not null default 'success' check (status in ('success', 'failed', 'cancelled')),
  error_message text,
  pricing_version text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_records_installation_idx
  on public.ai_usage_records (installation_id, created_at desc);

create index if not exists ai_usage_records_license_idx
  on public.ai_usage_records (license_id, created_at desc)
  where license_id is not null;

create index if not exists ai_usage_records_feature_idx
  on public.ai_usage_records (feature_type, created_at desc);

create index if not exists ai_usage_records_created_at_idx
  on public.ai_usage_records (created_at desc);

-- 5. تفعيل الأمان وصلاحيات الجداول
alter table public.ai_plans enable row level security;
alter table public.ai_system_config enable row level security;
alter table public.ai_usage_records enable row level security;

revoke all on table public.ai_plans from anon, authenticated;
revoke all on table public.ai_system_config from anon, authenticated;
revoke all on table public.ai_usage_records from anon, authenticated;

grant select on public.ai_plans to service_role;
grant select, update on public.ai_system_config to service_role;
grant select, insert, update on public.ai_usage_records to service_role;

-- 6. دوال التحليلات والإحصائيات الإدارية (Admin Analytics RPCs)

-- ملخص الاستهلاك العام وتكاليف المستخدمين
create or replace function public.get_ai_consumption_overview()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total_users bigint;
  v_active_trial_users bigint;
  v_active_paid_users bigint;
  v_total_input_tokens bigint;
  v_total_output_tokens bigint;
  v_total_tokens bigint;
  v_total_cost numeric;
  v_trial_cost numeric;
  v_paid_cost numeric;
  v_avg_cost_trial numeric;
  v_avg_cost_paid numeric;
  v_today_cost numeric;
  v_this_month_cost numeric;
begin
  select count(distinct installation_id) into v_total_users from public.ai_usage_records;
  select count(*) into v_active_trial_users from public.license_trials where ends_at > now() and not is_budget_exhausted;
  select count(*) into v_active_paid_users from public.license_activations where is_active;

  select
    coalesce(sum(input_tokens), 0),
    coalesce(sum(output_tokens), 0),
    coalesce(sum(total_tokens), 0),
    coalesce(sum(estimated_cost), 0)
  into v_total_input_tokens, v_total_output_tokens, v_total_tokens, v_total_cost
  from public.ai_usage_records
  where status = 'success';

  select coalesce(sum(estimated_cost), 0) into v_trial_cost
  from public.ai_usage_records
  where status = 'success' and is_trial = true;

  select coalesce(sum(estimated_cost), 0) into v_paid_cost
  from public.ai_usage_records
  where status = 'success' and is_trial = false;

  select coalesce(sum(estimated_cost), 0) into v_today_cost
  from public.ai_usage_records
  where status = 'success' and created_at >= date_trunc('day', now());

  select coalesce(sum(estimated_cost), 0) into v_this_month_cost
  from public.ai_usage_records
  where status = 'success' and created_at >= date_trunc('month', now());

  v_avg_cost_trial := case when v_active_trial_users > 0 then v_trial_cost / v_active_trial_users else 0 end;
  v_avg_cost_paid := case when v_active_paid_users > 0 then v_paid_cost / v_active_paid_users else 0 end;

  return jsonb_build_object(
    'totalUsers', v_total_users,
    'activeTrialUsers', v_active_trial_users,
    'activePaidUsers', v_active_paid_users,
    'totalInputTokens', v_total_input_tokens,
    'totalOutputTokens', v_total_output_tokens,
    'totalTokens', v_total_tokens,
    'totalCost', round(v_total_cost, 4),
    'trialCost', round(v_trial_cost, 4),
    'paidCost', round(v_paid_cost, 4),
    'avgCostPerTrialUser', round(v_avg_cost_trial, 4),
    'avgCostPerPaidUser', round(v_avg_cost_paid, 4),
    'todayCost', round(v_today_cost, 4),
    'thisMonthCost', round(v_this_month_cost, 4)
  );
end;
$$;

-- تفصيل الاستهلاك ومتوسط التكلفة والتوكنات لكل ميزة
create or replace function public.get_ai_features_breakdown()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_agg(f)
  into v_result
  from (
    select
      feature_type as "featureType",
      count(*)::integer as "totalCalls",
      coalesce(sum(total_tokens), 0)::bigint as "totalTokens",
      round(coalesce(avg(input_tokens), 0), 0)::integer as "avgInputTokens",
      round(coalesce(avg(output_tokens), 0), 0)::integer as "avgOutputTokens",
      round(coalesce(avg(total_tokens), 0), 0)::integer as "avgTotalTokens",
      round(coalesce(sum(estimated_cost), 0), 4) as "totalCost",
      round(coalesce(avg(estimated_cost), 0), 6) as "avgCost"
    from public.ai_usage_records
    where status = 'success'
    group by feature_type
    order by "totalTokens" desc
  ) f;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

-- أعلى المستخدمين استهلاكاً لمراقبة إساءة الاستخدام
create or replace function public.get_ai_top_consumers(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_agg(c)
  into v_result
  from (
    select
      r.installation_id as "installationId",
      r.license_id as "licenseId",
      bool_or(r.is_trial) as "isTrial",
      count(*)::integer as "requestCount",
      coalesce(sum(r.total_tokens), 0)::bigint as "totalTokens",
      round(coalesce(sum(r.estimated_cost), 0), 4) as "totalCost",
      max(r.created_at) as "lastActiveAt"
    from public.ai_usage_records r
    group by r.installation_id, r.license_id
    order by "totalTokens" desc
    limit greatest(1, least(p_limit, 100))
  ) c;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

grant execute on function public.get_ai_consumption_overview() to service_role;
grant execute on function public.get_ai_features_breakdown() to service_role;
grant execute on function public.get_ai_top_consumers(integer) to service_role;

