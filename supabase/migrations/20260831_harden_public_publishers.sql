-- Public clients may read published content, but only service_role may publish or change it.
-- service_role bypasses RLS and must be used only by local admin scripts or trusted CI.

drop policy if exists "Allow insert updates" on public.app_updates;
drop policy if exists "Allow update updates" on public.app_updates;

drop policy if exists "Public upload for app updates" on storage.objects;
drop policy if exists "Public update for app updates" on storage.objects;

drop policy if exists "allow_insert_master_index" on public.curriculum_master_index;
drop policy if exists "allow_insert_questions" on public.curriculum_questions_bank;
drop policy if exists "allow_insert_pdf_catalog" on public.curriculum_pdf_catalog;
drop policy if exists "allow_insert_book_texts" on public.curriculum_book_texts;

revoke insert, update, delete on public.app_updates from anon, authenticated;
revoke insert, update, delete on public.curriculum_master_index from anon, authenticated;
revoke insert, update, delete on public.curriculum_questions_bank from anon, authenticated;
revoke insert, update, delete on public.curriculum_pdf_catalog from anon, authenticated;
revoke insert, update, delete on public.curriculum_book_texts from anon, authenticated;
