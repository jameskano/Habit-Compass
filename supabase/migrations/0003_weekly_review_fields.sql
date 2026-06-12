alter table public.weekly_plans
add column if not exists review_overall_feeling text,
add column if not exists review_reflections text;

