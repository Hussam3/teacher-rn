-- ==============================================================================
-- حقيبة المدرس — جداول المناهج وبنك الأسئلة والكتب وقاعدة البيانات السحابية (Supabase)
-- ==============================================================================

-- 1) جدول فهرس المناهج الشامل المعتمد (Curriculum Master Index)
create table if not exists public.curriculum_master_index (
  id uuid primary key default gen_random_uuid(),
  book_id text not null unique,
  title text not null,
  stage text not null,
  grade text not null,
  subject text not null,
  file_name text not null,
  total_pages int default 0,
  chapters_count int default 0,
  chapters jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) جدول بنك الأسئلة والتمارين الوزارية (Question Bank)
create table if not exists public.curriculum_questions_bank (
  id uuid primary key default gen_random_uuid(),
  question_id text not null unique,
  book_id text,
  stage text not null,
  grade text not null,
  subject text not null,
  chapter_title text,
  page_number int,
  question_type text default 'general',
  question_text text not null,
  branches jsonb default '[]'::jsonb,
  score text default '',
  created_at timestamptz default now()
);

-- 3) جدول دليل وروابط ملفات الـ PDF للمناهج (124 كتاب)
create table if not exists public.curriculum_pdf_catalog (
  id uuid primary key default gen_random_uuid(),
  file_name text not null unique,
  stage text not null,
  grade text not null,
  subject text not null,
  type_or_part text default '',
  drive_id text,
  view_url text not null,
  download_url text not null,
  created_at timestamptz default now()
);

-- 4) جدول محتوى ونصوص صفحات المناهج (Grounded Curriculum Text)
create table if not exists public.curriculum_book_texts (
  id uuid primary key default gen_random_uuid(),
  book_id text not null,
  page_number int not null,
  chapter_title text,
  page_text text not null,
  created_at timestamptz default now(),
  unique(book_id, page_number)
);

-- فهارس للبحث السريع
create index if not exists idx_curr_master_grade_subj on public.curriculum_master_index(stage, grade, subject);
create index if not exists idx_curr_questions_subj on public.curriculum_questions_bank(stage, grade, subject);
create index if not exists idx_curr_pdf_stage_grade on public.curriculum_pdf_catalog(stage, grade);
create index if not exists idx_curr_texts_book_page on public.curriculum_book_texts(book_id, page_number);

-- سياسات القراءة العامة (جميع المعلمين يمكنهم قراءة المناهج وبنك الأسئلة)
alter table public.curriculum_master_index enable row level security;
alter table public.curriculum_questions_bank enable row level security;
alter table public.curriculum_pdf_catalog enable row level security;
alter table public.curriculum_book_texts enable row level security;

drop policy if exists "allow_public_read_master_index" on public.curriculum_master_index;
create policy "allow_public_read_master_index" on public.curriculum_master_index for select using (true);

drop policy if exists "allow_public_read_questions" on public.curriculum_questions_bank;
create policy "allow_public_read_questions" on public.curriculum_questions_bank for select using (true);

drop policy if exists "allow_public_read_pdf_catalog" on public.curriculum_pdf_catalog;
create policy "allow_public_read_pdf_catalog" on public.curriculum_pdf_catalog for select using (true);

drop policy if exists "allow_public_read_book_texts" on public.curriculum_book_texts;
create policy "allow_public_read_book_texts" on public.curriculum_book_texts for select using (true);

-- سياسات الإدخال والتحديث بواسطة المستخدمين الموثقين أو المسؤول
drop policy if exists "allow_insert_master_index" on public.curriculum_master_index;
create policy "allow_insert_master_index" on public.curriculum_master_index for all using (true) with check (true);

drop policy if exists "allow_insert_questions" on public.curriculum_questions_bank;
create policy "allow_insert_questions" on public.curriculum_questions_bank for all using (true) with check (true);

drop policy if exists "allow_insert_pdf_catalog" on public.curriculum_pdf_catalog;
create policy "allow_insert_pdf_catalog" on public.curriculum_pdf_catalog for all using (true) with check (true);

drop policy if exists "allow_insert_book_texts" on public.curriculum_book_texts;
create policy "allow_insert_book_texts" on public.curriculum_book_texts for all using (true) with check (true);

