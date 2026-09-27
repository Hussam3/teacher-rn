-- Owner-controlled provider key rotation. Raw provider credentials are encrypted
-- in the Edge Function before storage; the root encryption key stays in Supabase Secrets.

-- Existing license administrators were already trusted with all owner controls.
-- New rows default to the lower admin role and must be promoted deliberately.
alter table public.license_admins
  add column if not exists role text not null default 'owner';

alter table public.license_admins
  alter column role set default 'admin';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'license_admins_role_check'
      and conrelid = 'public.license_admins'::regclass
  ) then
    alter table public.license_admins
      add constraint license_admins_role_check
      check (role in ('admin', 'owner'));
  end if;
end;
$$;

create table if not exists public.ai_provider_credentials (
  provider_id text primary key check (provider_id in ('gemini', 'deepseek')),
  ciphertext text not null
    check (char_length(ciphertext) between 16 and 4096 and ciphertext ~ '^[A-Za-z0-9_-]+$'),
  iv text not null
    check (char_length(iv) = 16 and iv ~ '^[A-Za-z0-9_-]+$'),
  encryption_key_id text not null
    check (encryption_key_id ~ '^[A-Za-z0-9_-]{1,32}$'),
  key_version integer not null default 1 check (key_version >= 1),
  rotated_by uuid not null references auth.users (id),
  rotated_at timestamptz not null default now()
);

create table if not exists public.ai_provider_key_audit_log (
  id bigint generated always as identity primary key,
  provider_id text not null check (provider_id in ('gemini', 'deepseek')),
  actor_user_id uuid not null references auth.users (id),
  action text not null check (action in ('rotated', 'rejected')),
  key_version integer check (key_version is null or key_version >= 1),
  mfa_method text not null check (mfa_method in ('totp', 'webauthn', 'phone')),
  mfa_verified_at timestamptz not null,
  failure_code text,
  created_at timestamptz not null default now(),
  check (
    (action = 'rotated' and key_version is not null and failure_code is null)
    or (action = 'rejected' and failure_code is not null)
  )
);

create index if not exists ai_provider_key_audit_log_created_idx
  on public.ai_provider_key_audit_log (created_at desc);

create index if not exists ai_provider_key_audit_log_provider_created_idx
  on public.ai_provider_key_audit_log (provider_id, created_at desc);

alter table public.ai_provider_credentials enable row level security;
alter table public.ai_provider_key_audit_log enable row level security;

revoke all on table public.ai_provider_credentials from public, anon, authenticated;
revoke all on table public.ai_provider_key_audit_log from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_provider_credentials to service_role;
grant select, insert on table public.ai_provider_key_audit_log to service_role;
grant usage, select on sequence public.ai_provider_key_audit_log_id_seq to service_role;

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
  if p_provider_id not in ('gemini', 'deepseek')
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

  -- This insert is part of the same transaction as the credential update.
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

revoke all on function public.rotate_ai_provider_credential(
  text, text, text, text, uuid, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.rotate_ai_provider_credential(
  text, text, text, text, uuid, text, timestamptz
) to service_role;
