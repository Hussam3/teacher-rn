-- طلبات حذف الحساب الواردة من صفحة عامة للمستخدمين الذين أزالوا التطبيق.
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 320),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  user_agent text
);

create index if not exists account_deletion_requests_email_created_at_idx
  on public.account_deletion_requests (email, created_at desc);

alter table public.account_deletion_requests enable row level security;

-- No client policies: only the public Edge Function may insert through service_role.
