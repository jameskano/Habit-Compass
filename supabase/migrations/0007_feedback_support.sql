create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('suggestion', 'problem', 'other')),
  message text not null check (
    char_length(trim(message)) > 0
    and char_length(message) <= 4000
  ),
  reply_email text check (
    reply_email is null
    or (char_length(trim(reply_email)) > 0 and char_length(reply_email) <= 320)
  ),
  technical_details jsonb check (
    technical_details is null
    or jsonb_typeof(technical_details) = 'object'
  ),
  screen_id text,
  status text not null default 'new' check (status in ('new', 'triaged', 'closed')),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feedback_submission_id uuid not null references public.feedback_submissions (id) on delete cascade,
  bucket text not null default 'feedback-attachments' check (bucket = 'feedback-attachments'),
  storage_path text not null check (char_length(trim(storage_path)) > 0),
  file_name text not null check (char_length(trim(file_name)) > 0),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint feedback_attachments_storage_path_unique unique (bucket, storage_path)
);

comment on table public.feedback_submissions is
'In-app user feedback. Technical details are user opt-in and must not include personal habit/task content.';

comment on table public.feedback_attachments is
'Metadata for explicit user-selected feedback screenshots stored in the private feedback-attachments bucket.';

create index feedback_submissions_user_created_idx
on public.feedback_submissions (user_id, created_at desc);

create index feedback_submissions_status_created_idx
on public.feedback_submissions (status, created_at desc);

create index feedback_attachments_user_idx
on public.feedback_attachments (user_id);

create index feedback_attachments_submission_idx
on public.feedback_attachments (feedback_submission_id);

create or replace function public.enforce_feedback_submission_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_feedback_count integer;
begin
  select count(*)
  into recent_feedback_count
  from public.feedback_submissions
  where feedback_submissions.user_id = new.user_id
    and feedback_submissions.created_at >= timezone('utc', now()) - interval '15 minutes';

  if recent_feedback_count >= 5 then
    raise exception 'Feedback submission rate limit reached.';
  end if;

  return new;
end;
$$;

create trigger enforce_feedback_submission_rate_limit
before insert on public.feedback_submissions
for each row
execute function public.enforce_feedback_submission_rate_limit();

create trigger set_feedback_submissions_updated_at
before update on public.feedback_submissions
for each row
execute function public.set_updated_at();

create trigger set_feedback_attachments_updated_at
before update on public.feedback_attachments
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-attachments',
  'feedback-attachments',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.feedback_submissions enable row level security;
alter table public.feedback_attachments enable row level security;

alter table public.feedback_submissions force row level security;
alter table public.feedback_attachments force row level security;

revoke all on table public.feedback_submissions from anon;
revoke all on table public.feedback_attachments from anon;

grant insert on table public.feedback_submissions to authenticated;
grant insert on table public.feedback_attachments to authenticated;

create policy "feedback_submissions_insert_own"
on public.feedback_submissions
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and deleted_at is null
);

create policy "feedback_attachments_insert_own"
on public.feedback_attachments
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and deleted_at is null
  and bucket = 'feedback-attachments'
  and storage_path like ((select auth.uid())::text || '/%')
  and exists (
    select 1
    from public.feedback_submissions
    where feedback_submissions.id = feedback_submission_id
      and feedback_submissions.user_id = (select auth.uid())
      and feedback_submissions.deleted_at is null
  )
);

create policy "feedback_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'feedback-attachments'
  and name like ((select auth.uid())::text || '/%')
);
