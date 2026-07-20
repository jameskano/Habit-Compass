begin;

create extension if not exists pgtap;

select plan(20);

select has_table('public', 'feedback_submissions', 'feedback submissions table exists');
select has_table('public', 'feedback_attachments', 'feedback attachments table exists');

select is(
  (
    select public
    from storage.buckets
    where id = 'feedback-attachments'
  ),
  false,
  'feedback attachment bucket is private'
);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    'authenticated',
    'authenticated',
    'feedback-user-a@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'authenticated',
    'authenticated',
    'feedback-user-b@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);

select lives_ok(
  $$
    insert into public.feedback_submissions (
      id,
      user_id,
      type,
      message,
      technical_details,
      screen_id
    )
    values (
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000301',
      'problem',
      'The timer did not save.',
      '{"appVersion":"1.0.0","screenId":"settings.feedback"}'::jsonb,
      'settings.feedback'
    )
  $$,
  'authenticated user can insert their own feedback submission'
);

select throws_ok(
  $$ select count(*)::integer from public.feedback_submissions $$,
  '42501',
  null,
  'feedback submissions are write-only to authenticated clients'
);

select throws_ok(
  $$
    insert into public.feedback_submissions (
      user_id,
      type,
      message
    )
    values (
      '00000000-0000-0000-0000-000000000302',
      'suggestion',
      'Other user insert should fail.'
    )
  $$,
  '42501',
  null,
  'authenticated user cannot insert feedback for another user'
);

select throws_ok(
  $$
    insert into public.feedback_submissions (
      user_id,
      type,
      message
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      'bug',
      'Invalid type should fail.'
    )
  $$,
  '23514',
  null,
  'feedback type is constrained'
);

select throws_ok(
  $$
    insert into public.feedback_submissions (
      user_id,
      type,
      message
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      'problem',
      ''
    )
  $$,
  '23514',
  null,
  'blank feedback message is rejected'
);

select throws_ok(
  $$
    insert into public.feedback_submissions (
      user_id,
      type,
      message,
      technical_details
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      'problem',
      'Array details should fail.',
      '[]'::jsonb
    )
  $$,
  '23514',
  null,
  'technical details must be a JSON object when provided'
);

reset role;
insert into public.feedback_submissions (
  id,
  user_id,
  type,
  message
)
values (
  '00000000-0000-0000-0000-000000000402',
  '00000000-0000-0000-0000-000000000302',
  'suggestion',
  'Other user fixture.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);

select lives_ok(
  $$
    insert into public.feedback_attachments (
      id,
      user_id,
      feedback_submission_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes
    )
    values (
      '00000000-0000-0000-0000-000000000501',
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000301/00000000-0000-0000-0000-000000000401/screenshot.png',
      'screenshot.png',
      'image/png',
      1024
    )
  $$,
  'authenticated user can attach metadata to their own feedback submission'
);

select throws_ok(
  $$ select count(*)::integer from public.feedback_attachments $$,
  '42501',
  null,
  'feedback attachment metadata is write-only to authenticated clients'
);

select throws_ok(
  $$
    insert into public.feedback_attachments (
      user_id,
      feedback_submission_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000302/wrong-prefix.png',
      'wrong-prefix.png',
      'image/png',
      1024
    )
  $$,
  '42501',
  null,
  'attachment metadata requires a user-scoped storage path'
);

select throws_ok(
  $$
    insert into public.feedback_attachments (
      user_id,
      feedback_submission_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000402',
      '00000000-0000-0000-0000-000000000301/other-submission.png',
      'other-submission.png',
      'image/png',
      1024
    )
  $$,
  '42501',
  null,
  'attachment metadata cannot target another user feedback submission'
);

select throws_ok(
  $$
    insert into public.feedback_attachments (
      user_id,
      feedback_submission_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000301/screenshot.gif',
      'screenshot.gif',
      'image/gif',
      1024
    )
  $$,
  '23514',
  null,
  'attachment mime type is constrained'
);

select throws_ok(
  $$
    insert into public.feedback_attachments (
      user_id,
      feedback_submission_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000401',
      '00000000-0000-0000-0000-000000000301/oversized.png',
      'oversized.png',
      'image/png',
      5242881
    )
  $$,
  '23514',
  null,
  'attachment size is constrained'
);

select lives_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      metadata
    )
    values (
      'feedback-attachments',
      '00000000-0000-0000-0000-000000000301/00000000-0000-0000-0000-000000000401/upload.png',
      '00000000-0000-0000-0000-000000000301',
      '{"mimetype":"image/png","size":1024}'::jsonb
    )
  $$,
  'authenticated user can upload an object under their own feedback prefix'
);

select throws_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      metadata
    )
    values (
      'feedback-attachments',
      '00000000-0000-0000-0000-000000000302/not-owned.png',
      '00000000-0000-0000-0000-000000000301',
      '{"mimetype":"image/png","size":1024}'::jsonb
    )
  $$,
  '42501',
  null,
  'authenticated user cannot upload to another user feedback prefix'
);

select throws_ok(
  $$
    insert into public.feedback_submissions (
      user_id,
      type,
      message
    )
    select
      '00000000-0000-0000-0000-000000000301',
      'other',
      'Rate limit fixture ' || generate_series
    from generate_series(1, 5)
  $$,
  'P0001',
  'Feedback submission rate limit reached.',
  'feedback submission rate limit stops the sixth submission in 15 minutes'
);

reset role;
set local role anon;

select throws_ok(
  $$
    insert into public.feedback_submissions (
      user_id,
      type,
      message
    )
    values (
      '00000000-0000-0000-0000-000000000301',
      'problem',
      'Anonymous insert should fail.'
    )
  $$,
  '42501',
  null,
  'anonymous feedback submission insert is rejected'
);

select throws_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      metadata
    )
    values (
      'feedback-attachments',
      '00000000-0000-0000-0000-000000000301/anonymous.png',
      '{"mimetype":"image/png","size":1024}'::jsonb
    )
  $$,
  '42501',
  null,
  'anonymous feedback attachment upload is rejected'
);

select * from finish();

rollback;
