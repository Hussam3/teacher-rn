-- The routing editor and execution path support the Gemini 2.5 catalog.
-- Normalize an early 3.5 draft so the stored configuration is executable.
with normalized as (
  select
    replace(
      replace(
        value::text,
        '"gemini-3.5-flash-lite"',
        '"gemini-2.5-flash-lite"'
      ),
      '"gemini-3.5-flash"',
      '"gemini-2.5-flash"'
    )::jsonb as value
  from public.ai_system_config
  where key = 'provider_model_routing'
    and (
      value::text like '%"gemini-3.5-flash"%'
      or value::text like '%"gemini-3.5-flash-lite"%'
    )
)
update public.ai_system_config as config
set
  value = jsonb_set(
    normalized.value,
    '{version}',
    to_jsonb(coalesce((normalized.value ->> 'version')::integer, 1) + 1),
    true
  ),
  updated_at = now()
from normalized
where config.key = 'provider_model_routing';
