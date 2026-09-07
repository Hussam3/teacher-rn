-- إصلاحات لاحقة لنظام التراخيص.
-- يبقى هذا الترحيل ضرورياً حتى لو عُدّل 20260902، لأن قاعدة منشورة قد تكون طبقته مسبقاً.

create index if not exists license_activations_installation_revoked_idx
  on public.license_activations (installation_id, revoked_at desc)
  where revoked_at is not null;

-- تحقق وكتابة ذرية لحد الطلبات العامة حتى لا تتجاوز الطلبات المتزامنة الحد.
create or replace function public.record_license_request_attempt(
  p_subject_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_subject_hash !~ '^[0-9a-f]{64}$'
    or p_action not in ('status', 'activate', 'start_trial')
    or p_limit < 1
    or p_limit > 1000
    or p_window_seconds < 1
    or p_window_seconds > 86400 then
    raise exception 'invalid license rate limit arguments' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_subject_hash || ':' || p_action));
  select count(*)::integer into v_count
  from public.license_request_log
  where subject_hash = p_subject_hash
    and action = p_action
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.license_request_log (subject_hash, action)
  values (p_subject_hash, p_action);
  return true;
end;
$$;

-- يمنع خفض حد الأجهزة إن كانت التفعيلات القائمة تتجاوزه.
create or replace function public.license_enforce_device_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_active_count integer;
begin
  if new.max_devices >= old.max_devices then
    return new;
  end if;

  select count(*)::integer into v_active_count
  from public.license_activations
  where license_id = new.id
    and is_active;
  if v_active_count > new.max_devices then
    raise exception 'active device count exceeds requested limit' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists license_enforce_device_limit on public.licenses;
create trigger license_enforce_device_limit
  before update of max_devices on public.licenses
  for each row execute function public.license_enforce_device_limit();

-- يعرض إلغاء جهاز كحالة ترخيص موقوف ولا يسمح له بالتحول إلى تجربة جديدة.
create or replace function public.license_access_for_installation(
  p_installation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_activation record;
  v_revoked_activation record;
  v_trial public.license_trials%rowtype;
begin
  select
    a.id as activation_id,
    l.status as license_status,
    l.expires_at,
    l.code_hint
  into v_activation
  from public.license_activations a
  join public.licenses l on l.id = a.license_id
  where a.installation_id = p_installation_id
    and a.is_active
  order by a.activated_at desc
  limit 1;

  if found then
    update public.license_activations
      set last_checked_at = now()
      where id = v_activation.activation_id;

    if v_activation.license_status <> 'active' then
      return jsonb_build_object(
        'ok', true,
        'access', 'license_revoked',
        'expiresAt', v_activation.expires_at,
        'codeHint', v_activation.code_hint,
        'serverTime', now()
      );
    end if;

    if v_activation.expires_at is not null and v_activation.expires_at <= now() then
      return jsonb_build_object(
        'ok', true,
        'access', 'license_expired',
        'expiresAt', v_activation.expires_at,
        'codeHint', v_activation.code_hint,
        'serverTime', now()
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'access', 'licensed',
      'expiresAt', v_activation.expires_at,
      'codeHint', v_activation.code_hint,
      'serverTime', now()
    );
  end if;

  select
    a.id as activation_id,
    l.expires_at,
    l.code_hint
  into v_revoked_activation
  from public.license_activations a
  join public.licenses l on l.id = a.license_id
  where a.installation_id = p_installation_id
    and a.revoked_at is not null
  order by a.revoked_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'ok', true,
      'access', 'license_revoked',
      'expiresAt', v_revoked_activation.expires_at,
      'codeHint', v_revoked_activation.code_hint,
      'serverTime', now()
    );
  end if;

  select * into v_trial
  from public.license_trials
  where installation_id = p_installation_id;

  if found then
    if v_trial.ends_at > now() then
      return jsonb_build_object(
        'ok', true,
        'access', 'trial',
        'expiresAt', v_trial.ends_at,
        'codeHint', null,
        'serverTime', now()
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'access', 'trial_expired',
      'expiresAt', v_trial.ends_at,
      'codeHint', null,
      'serverTime', now()
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'access', 'none',
    'expiresAt', null,
    'codeHint', null,
    'serverTime', now()
  );
end;
$$;

-- يستهلك التجربة فقط بعد نجاح تفعيل الرمز، لا عند محاولة رمز ممتلئ الأجهزة.
create or replace function public.activate_license(
  p_code_hash text,
  p_installation_id uuid,
  p_platform text,
  p_app_version text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_license public.licenses%rowtype;
  v_existing_activation uuid;
  v_existing_active boolean;
  v_active_count integer;
begin
  if p_code_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_code',
      'message', 'رمز التفعيل غير صحيح، يرجى التأكد من الرمز والمحاولة مرة أخرى.'
    );
  end if;

  -- تسلسل محاولات التفعيل للجهاز نفسه قبل قفل صف الرمز، لتفادي تعارض الفهرس الفريد.
  perform pg_advisory_xact_lock(
    hashtext('license-activation'),
    hashtext(p_installation_id::text)
  );

  select * into v_license
  from public.licenses
  where code_hash = p_code_hash
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_code',
      'message', 'رمز التفعيل غير صحيح، يرجى التأكد من الرمز والمحاولة مرة أخرى.'
    );
  end if;

  if v_license.status <> 'active' then
    return jsonb_build_object(
      'ok', true,
      'access', 'license_revoked',
      'expiresAt', v_license.expires_at,
      'codeHint', v_license.code_hint,
      'serverTime', now()
    );
  end if;

  if v_license.expires_at is not null and v_license.expires_at <= now() then
    return jsonb_build_object(
      'ok', true,
      'access', 'license_expired',
      'expiresAt', v_license.expires_at,
      'codeHint', v_license.code_hint,
      'serverTime', now()
    );
  end if;

  select id, is_active into v_existing_activation, v_existing_active
  from public.license_activations
  where license_id = v_license.id
    and installation_id = p_installation_id
  limit 1;

  if found and v_existing_active then
    update public.license_activations
      set last_checked_at = now(),
          platform = left(coalesce(p_platform, 'unknown'), 32),
          app_version = left(coalesce(p_app_version, ''), 32)
      where id = v_existing_activation;
  else
    select count(*)::integer into v_active_count
    from public.license_activations
    where license_id = v_license.id
      and is_active;

    if v_active_count >= v_license.max_devices then
      return jsonb_build_object(
        'ok', false,
        'code', 'device_limit_reached',
        'message', 'استُخدم هذا الرمز على العدد المسموح من الأجهزة. تواصل مع الجهة التي زودتك بالرمز.'
      );
    end if;

    update public.license_activations
      set is_active = false,
          deactivated_at = now()
      where installation_id = p_installation_id
        and is_active;

    if v_existing_activation is null then
      insert into public.license_activations (
        license_id,
        installation_id,
        platform,
        app_version
      ) values (
        v_license.id,
        p_installation_id,
        left(coalesce(p_platform, 'unknown'), 32),
        left(coalesce(p_app_version, ''), 32)
      );
    else
      update public.license_activations
        set is_active = true,
            activated_at = now(),
            last_checked_at = now(),
            deactivated_at = null,
            revoked_at = null,
            platform = left(coalesce(p_platform, 'unknown'), 32),
            app_version = left(coalesce(p_app_version, ''), 32)
        where id = v_existing_activation;
    end if;
  end if;

  insert into public.license_trials (installation_id, started_at, ends_at)
  values (p_installation_id, now(), now())
  on conflict (installation_id) do nothing;

  return public.license_access_for_installation(p_installation_id);
end;
$$;

revoke all on function public.license_access_for_installation(uuid) from public, anon, authenticated;
revoke all on function public.activate_license(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_license_request_attempt(text, text, integer, integer) from public, anon, authenticated;

grant execute on function public.license_access_for_installation(uuid) to service_role;
grant execute on function public.activate_license(text, uuid, text, text) to service_role;
grant execute on function public.record_license_request_attempt(text, text, integer, integer) to service_role;
