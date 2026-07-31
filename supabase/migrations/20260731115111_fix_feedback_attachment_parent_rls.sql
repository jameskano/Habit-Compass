create or replace function public.feedback_submission_belongs_to_current_user(submission_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.feedback_submissions
    where feedback_submissions.id = submission_id
      and feedback_submissions.user_id = (select auth.uid())
      and feedback_submissions.deleted_at is null
  );
$$;

revoke all on function public.feedback_submission_belongs_to_current_user(uuid) from public;
grant execute on function public.feedback_submission_belongs_to_current_user(uuid) to authenticated;

drop policy if exists "feedback_attachments_insert_own" on public.feedback_attachments;

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
  and public.feedback_submission_belongs_to_current_user(feedback_submission_id)
);
