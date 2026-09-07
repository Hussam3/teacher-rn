-- حقيبة المدرس — مخطط قاعدة بيانات Supabase
-- شغّل هذا الملف من: Supabase Dashboard → SQL Editor → New query → Run

-- 1) جدول بيانات المعلم: كل صف = كيان واحد (مادة، خطة، طالب، سجل، مستند...)
create table if not exists public.teacher_data (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  collection text        not null,                -- subjects, schedule, dailyPlans, ...
  entity_id  text        not null,                -- معرّف الكيان داخل التطبيق
  entity     jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, entity_id)
);

-- 2) تفعيل حماية مستوى الصف: كل مستخدم يرى بياناته فقط
alter table public.teacher_data enable row level security;

drop policy if exists "teacher_data_own_rows" on public.teacher_data;
create policy "teacher_data_own_rows"
  on public.teacher_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) تفعيل Realtime للمزامنة اللحظية بين الأجهزة (اختياري لكن موصى به)
do $$
begin
  if not exists (
    select 1
    from pg_publication p
    join pg_publication_rel pr on pr.prpubid = p.oid
    where p.pubname = 'supabase_realtime'
      and pr.prrelid = 'public.teacher_data'::regclass
  ) then
    alter publication supabase_realtime add table public.teacher_data;
  end if;
end
$$;

-- 4) سجل خاص بحماية المفتاح المشترك من الإفراط في الاستخدام.
-- لا توجد سياسة RLS مقصودة: الدالة الخلفية فقط (service_role) تقرأ وتكتب السجل.
create table if not exists public.ai_request_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_request_log_user_created_at_idx
  on public.ai_request_log (user_id, created_at desc);

alter table public.ai_request_log enable row level security;
