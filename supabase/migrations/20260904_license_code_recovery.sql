-- حفظ رموز التفعيل الجديدة مشفّرة لاسترجاعها من واجهة المالك فقط.
-- لا يمكن استرجاع الرموز التي أُنشئت قبل هذا الترحيل لأنها حُفظت كبصمة SHA-256 فقط.

alter table public.licenses
  add column if not exists code_ciphertext text;

comment on column public.licenses.code_ciphertext is
  'AES-GCM encrypted activation code. Decrypted only by the licenses Edge Function for authorized owners.';
