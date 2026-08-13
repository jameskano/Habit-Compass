alter table public.recurrent_task_logs
add column if not exists completed_at timestamptz;
