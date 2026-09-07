-- جدول التحديثات الفورية المباشرة (Over-The-Air Updates)
create table if not exists public.app_updates (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'android', -- android, ios, web
  version_name text not null,               -- مثل 1.0.1
  version_code int not null default 1,     -- رقم البناء
  bundle_url text not null,                 -- رابط تحميل الحزمة من Supabase Storage
  bundle_hash text,                         -- هاش للتحقق من سلامة الحزمة SHA256
  release_notes text,                       -- ملاحظات التحديث للمستخدم
  is_mandatory boolean default false,       -- هل التحديث إجباري
  is_active boolean default true,           -- هل التحديث مفعّل ومتاح للمستخدمين
  created_at timestamptz default now()
);

-- سياسات الأمان RLS
alter table public.app_updates enable row level security;

-- السماح لأي تطبيق بالاستعلام عن التحديثات النشطة
drop policy if exists "Allow read active updates for all" on public.app_updates;
create policy "Allow read active updates for all"
  on public.app_updates
  for select
  using (is_active = true);

-- السماح بإدراج التحديثات الجديدة
drop policy if exists "Allow insert updates" on public.app_updates;
create policy "Allow insert updates"
  on public.app_updates
  for insert
  with check (true);

-- السماح بتحديث السجلات الحالية
drop policy if exists "Allow update updates" on public.app_updates;
create policy "Allow update updates"
  on public.app_updates
  for update
  using (true);

-- حاوية تخزين حزم التحديثات
insert into storage.buckets (id, name, public)
values ('app-updates', 'app-updates', true)
on conflict (id) do update set public = true;

-- سياسة قراءة عامة لملفات التحديث
drop policy if exists "Public download for app updates" on storage.objects;
create policy "Public download for app updates"
  on storage.objects
  for select
  using (bucket_id = 'app-updates');

-- سياسة رفع ملفات التحديث إلى حاوية app-updates
drop policy if exists "Public upload for app updates" on storage.objects;
create policy "Public upload for app updates"
  on storage.objects
  for insert
  with check (bucket_id = 'app-updates');

-- سياسة تعديل واستبدال ملفات التحديث
drop policy if exists "Public update for app updates" on storage.objects;
create policy "Public update for app updates"
  on storage.objects
  for update
  using (bucket_id = 'app-updates');
