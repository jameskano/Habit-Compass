alter table public.feedback_submissions
add column notification_status text not null default 'pending',
add column notification_attempted_at timestamptz,
add column notification_sent_at timestamptz,
add column notification_failure_code text,
add constraint feedback_submissions_notification_status_check
  check (notification_status in ('pending', 'sent', 'failed')),
add constraint feedback_submissions_notification_failure_code_check
  check (
    notification_failure_code is null
    or char_length(trim(notification_failure_code)) > 0
  );

grant select, update on table public.feedback_submissions to service_role;
grant select on table public.feedback_attachments to service_role;
