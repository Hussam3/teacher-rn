-- اختيار المواد المرخصة إلزامي، وأول اختيار لا يستهلك من تغييرات الشهر.
-- تستعمل بداية الشهر بتوقيت العراق حتى تكون القاعدة ثابتة لجميع الأجهزة.

alter table public.licenses
  add column if not exists subject_changes_month date,
  add column if not exists subject_changes_this_month smallint not null default 0;

alter table public.license_trials
  add column if not exists subject_changes_month date,
  add column if not exists subject_changes_this_month smallint not null default 0,
  add column if not exists subject_last_changed_at timestamptz;

alter table public.licenses
  drop constraint if exists licenses_subject_changes_this_month_check,
  add constraint licenses_subject_changes_this_month_check
    check (subject_changes_this_month between 0 and 2);

alter table public.license_trials
  drop constraint if exists license_trials_subject_changes_this_month_check,
  add constraint license_trials_subject_changes_this_month_check
    check (subject_changes_this_month between 0 and 2);

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
  v_trial record;
  v_max_subjects integer := 1;
  v_cleaned_subjects text[] := ARRAY[]::text[];
  v_existing_subjects text[] := '{}'::text[];
  v_allowed_subjects text[] := array[
    'الكيمياء', 'الفيزياء', 'الأحياء', 'الرياضيات', 'اللغة العربية',
    'اللغة الإنكليزية', 'التربية الإسلامية', 'الاجتماعيات', 'العلوم',
    'الحاسوب', 'التربية الفنية', 'التربية الرياضية', 'اللغة الفرنسية',
    'الاقتصاد', 'الفلسفة وعلم النفس'
  ]::text[];
  v_subject text;
  v_normalized_subject text;
  v_current_month date := date_trunc(
    'month', timezone('Asia/Baghdad', now())
  )::date;
  v_changes_this_month integer := 0;
begin
  if p_installation_id is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_installation',
      'error', 'تعذر التحقق من هذا الجهاز. أعد تشغيل التطبيق ثم حاول مرة أخرى.'
    );
  end if;

  if p_subjects is not null then
    foreach v_subject in array p_subjects loop
      if v_subject is not null
        and trim(v_subject) != ''
        and trim(v_subject) != '*'
        and lower(trim(v_subject)) != 'all' then
        v_normalized_subject := public.normalize_subject(v_subject);
        if not (v_normalized_subject = any(v_allowed_subjects)) then
          return jsonb_build_object(
            'ok', false,
            'error_code', 'invalid_subject',
            'error', 'اختر المواد من القائمة المعتمدة فقط.'
          );
        end if;
        if not (v_normalized_subject = any(v_cleaned_subjects)) then
          v_cleaned_subjects := array_append(
            v_cleaned_subjects,
            v_normalized_subject
          );
        end if;
      end if;
    end loop;
  end if;

  select coalesce(array_agg(subject_name order by subject_name), '{}'::text[])
  into v_cleaned_subjects
  from unnest(v_cleaned_subjects) as subjects(subject_name);

  if cardinality(v_cleaned_subjects) = 0 then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'subjects_required',
      'error', 'يرجى اختيار مادة واحدة على الأقل.'
    );
  end if;

  -- قفل صف الترخيص يجعل حد التغيير مشتركاً وآمناً بين كل الأجهزة المفعلة.
  select
    la.license_id,
    l.status as license_status,
    l.expires_at as license_expires_at,
    l.max_subjects,
    l.selected_subjects,
    l.subject_changes_month,
    l.subject_changes_this_month
  into v_activation
  from public.license_activations la
  join public.licenses l on l.id = la.license_id
  where la.installation_id = p_installation_id
    and la.is_active = true
  limit 1
  for update of l;

  if v_activation.license_id is not null then
    if v_activation.license_status != 'active'
      or (
        v_activation.license_expires_at is not null
        and v_activation.license_expires_at <= now()
      ) then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'license_inactive',
        'error', 'الترخيص غير نشط أو منتهٍ.'
      );
    end if;

    v_max_subjects := coalesce(v_activation.max_subjects, 1);
    if cardinality(v_cleaned_subjects) > v_max_subjects then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'max_subjects_exceeded',
        'error', format(
          'لا يمكنك اختيار أكثر من %s مواد في باقة اشتراكك الحالية.',
          v_max_subjects
        )
      );
    end if;

    select coalesce(array_agg(subject_name order by subject_name), '{}'::text[])
    into v_existing_subjects
    from unnest(coalesce(v_activation.selected_subjects, '{}'::text[]))
      as subjects(subject_name);

    if v_existing_subjects = v_cleaned_subjects then
      return jsonb_build_object(
        'ok', true,
        'selected_subjects', v_cleaned_subjects,
        'changes_this_month', coalesce(
          v_activation.subject_changes_this_month,
          0
        )
      );
    end if;

    if cardinality(v_existing_subjects) = 0 then
      update public.licenses set
        selected_subjects = v_cleaned_subjects,
        subject_changes_month = null,
        subject_changes_this_month = 0,
        subject_last_changed_at = null,
        updated_at = now()
      where id = v_activation.license_id;

      return jsonb_build_object(
        'ok', true,
        'selected_subjects', v_cleaned_subjects,
        'changes_this_month', 0,
        'is_initial_selection', true
      );
    end if;

    if v_activation.subject_changes_month = v_current_month then
      v_changes_this_month := coalesce(
        v_activation.subject_changes_this_month,
        0
      );
    end if;

    if v_changes_this_month >= 2 then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'subject_change_limit_reached',
        'error', 'استخدمت التغييرين المسموح بهما لهذا الشهر. يمكنك تغيير المواد مجدداً مع بداية الشهر القادم.'
      );
    end if;

    update public.licenses set
      selected_subjects = v_cleaned_subjects,
      subject_changes_month = v_current_month,
      subject_changes_this_month = v_changes_this_month + 1,
      subject_last_changed_at = now(),
      updated_at = now()
    where id = v_activation.license_id;

    return jsonb_build_object(
      'ok', true,
      'selected_subjects', v_cleaned_subjects,
      'changes_this_month', v_changes_this_month + 1
    );
  end if;

  select
    ends_at,
    selected_subjects,
    subject_changes_month,
    subject_changes_this_month
  into v_trial
  from public.license_trials
  where installation_id = p_installation_id
  for update;

  if not found or v_trial.ends_at <= now() then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'trial_inactive',
      'error', 'الفترة التجريبية غير نشطة.'
    );
  end if;

  if cardinality(v_cleaned_subjects) > 1 then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'max_subjects_exceeded',
      'error', 'الفترة التجريبية تسمح بمادة واحدة فقط.'
    );
  end if;

  select coalesce(array_agg(subject_name order by subject_name), '{}'::text[])
  into v_existing_subjects
  from unnest(coalesce(v_trial.selected_subjects, '{}'::text[]))
    as subjects(subject_name);

  if v_existing_subjects = v_cleaned_subjects then
    return jsonb_build_object(
      'ok', true,
      'selected_subjects', v_cleaned_subjects,
      'changes_this_month', coalesce(v_trial.subject_changes_this_month, 0)
    );
  end if;

  if cardinality(v_existing_subjects) = 0 then
    update public.license_trials set
      selected_subjects = v_cleaned_subjects,
      subject_changes_month = null,
      subject_changes_this_month = 0,
      subject_last_changed_at = null
    where installation_id = p_installation_id;

    return jsonb_build_object(
      'ok', true,
      'selected_subjects', v_cleaned_subjects,
      'changes_this_month', 0,
      'is_initial_selection', true
    );
  end if;

  if v_trial.subject_changes_month = v_current_month then
    v_changes_this_month := coalesce(v_trial.subject_changes_this_month, 0);
  end if;

  if v_changes_this_month >= 2 then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'subject_change_limit_reached',
      'error', 'استخدمت التغييرين المسموح بهما لهذا الشهر. يمكنك تغيير المواد مجدداً مع بداية الشهر القادم.'
    );
  end if;

  update public.license_trials set
    selected_subjects = v_cleaned_subjects,
    subject_changes_month = v_current_month,
    subject_changes_this_month = v_changes_this_month + 1,
    subject_last_changed_at = now()
  where installation_id = p_installation_id;

  return jsonb_build_object(
    'ok', true,
    'selected_subjects', v_cleaned_subjects,
    'changes_this_month', v_changes_this_month + 1
  );
end;
$$;

revoke all on function public.set_licensed_subjects(uuid, text[])
  from public, anon, authenticated;
grant execute on function public.set_licensed_subjects(uuid, text[])
  to service_role;
