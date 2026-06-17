drop index if exists public.categories_user_active_idx;

alter table public.categories
drop column if exists archived_at;
