begin;

create extension if not exists pgtap;

select plan(24);

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
    '00000000-0000-0000-0000-000000000201',
    'authenticated',
    'authenticated',
    'rls-user-a@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'authenticated',
    'authenticated',
    'rls-user-b@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);

select lives_ok(
  $$
    insert into public.profiles (id, display_name)
    values ('00000000-0000-0000-0000-000000000201', 'RLS User A')
  $$,
  'authenticated user can insert their own profile'
);

select throws_ok(
  $$
    insert into public.profiles (id, display_name)
    values ('00000000-0000-0000-0000-000000000202', 'RLS User B')
  $$,
  '42501',
  null,
  'authenticated user cannot insert another user profile'
);

select lives_ok(
  $$ select public.ensure_default_categories_for_user('00000000-0000-0000-0000-000000000201') $$,
  'authenticated user can provision their own default categories'
);

select throws_ok(
  $$ select public.ensure_default_categories_for_user('00000000-0000-0000-0000-000000000202') $$,
  'P0001',
  'Cannot provision categories for another user.',
  'authenticated user cannot provision another user default categories'
);

select lives_ok(
  $$
    insert into public.categories (
      id,
      user_id,
      name,
      color,
      icon,
      sort_order
    )
    values (
      '00000000-0000-0000-0000-000000000211',
      '00000000-0000-0000-0000-000000000201',
      'Custom',
      'blue',
      'star',
      10
    )
  $$,
  'authenticated user can insert their own custom category'
);

select throws_ok(
  $$
    insert into public.categories (
      user_id,
      name,
      color,
      icon
    )
    values (
      '00000000-0000-0000-0000-000000000202',
      'Not Mine',
      'blue',
      'star'
    )
  $$,
  '42501',
  null,
  'authenticated user cannot insert another user category'
);

reset role;
insert into public.profiles (id, display_name)
values ('00000000-0000-0000-0000-000000000202', 'RLS User B');

insert into public.categories (
  id,
  user_id,
  name,
  color,
  icon,
  sort_order
)
values (
  '00000000-0000-0000-0000-000000000212',
  '00000000-0000-0000-0000-000000000202',
  'Other Custom',
  'blue',
  'star',
  10
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);

select is(
  (
    select count(*)::integer
    from public.categories
    where id in (
      '00000000-0000-0000-0000-000000000211',
      '00000000-0000-0000-0000-000000000212'
    )
  ),
  1,
  'category select policy hides another user row'
);

select lives_ok(
  $$
    insert into public.habits (
      id,
      user_id,
      category_id,
      title,
      tracking_type
    )
    values (
      '00000000-0000-0000-0000-000000000221',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000211',
      'Read',
      'binary'
    )
  $$,
  'authenticated user can insert a habit in their own category'
);

select throws_ok(
  $$
    insert into public.habits (
      user_id,
      category_id,
      title,
      tracking_type
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000212',
      'Cross category',
      'binary'
    )
  $$,
  '42501',
  null,
  'authenticated user cannot attach a habit to another user category'
);

reset role;
insert into public.habits (
  id,
  user_id,
  category_id,
  title,
  tracking_type
)
values (
  '00000000-0000-0000-0000-000000000222',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000212',
  'Other Habit',
  'binary'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);

select is(
  (
    select count(*)::integer
    from public.habits
    where id in (
      '00000000-0000-0000-0000-000000000221',
      '00000000-0000-0000-0000-000000000222'
    )
  ),
  1,
  'habit select policy hides another user row'
);

select lives_ok(
  $$
    insert into public.habit_logs (
      user_id,
      habit_id,
      log_date,
      status,
      completion_level
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000221',
      current_date,
      'completed',
      'standard'
    )
  $$,
  'authenticated user can insert a log for their own habit'
);

select throws_ok(
  $$
    insert into public.habit_logs (
      user_id,
      habit_id,
      log_date,
      status
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000222',
      current_date,
      'completed'
    )
  $$,
  '42501',
  null,
  'authenticated user cannot insert a log for another user habit'
);

select lives_ok(
  $$
    insert into public.tasks (
      id,
      user_id,
      category_id,
      title
    )
    values (
      '00000000-0000-0000-0000-000000000231',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000211',
      'Buy milk'
    )
  $$,
  'authenticated user can insert their own task'
);

select lives_ok(
  $$
    insert into public.recurrent_tasks (
      id,
      user_id,
      category_id,
      title
    )
    values (
      '00000000-0000-0000-0000-000000000241',
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000211',
      'Water plants'
    )
  $$,
  'authenticated user can insert their own recurrent task'
);

select lives_ok(
  $$
    insert into public.recurrent_task_logs (
      user_id,
      recurrent_task_id,
      occurrence_date,
      status
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000241',
      current_date,
      'completed'
    )
  $$,
  'authenticated user can insert a log for their own recurrent task'
);

select lives_ok(
  $$
    insert into public.mood_logs (
      id,
      user_id,
      log_date,
      mood
    )
    values (
      '00000000-0000-0000-0000-000000000251',
      '00000000-0000-0000-0000-000000000201',
      current_date,
      'good'
    )
  $$,
  'authenticated user can insert their own mood log'
);

select lives_ok(
  $$
    insert into public.reflections (
      user_id,
      kind,
      content,
      recorded_for_date,
      mood_log_id
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      'daily',
      'Useful reflection.',
      current_date,
      '00000000-0000-0000-0000-000000000251'
    )
  $$,
  'authenticated user can insert their own reflection linked to their mood log'
);

select lives_ok(
  $$
    insert into public.weekly_plans (
      id,
      user_id,
      week_start
    )
    values (
      '00000000-0000-0000-0000-000000000261',
      '00000000-0000-0000-0000-000000000201',
      current_date
    )
  $$,
  'authenticated user can insert their own weekly plan'
);

select lives_ok(
  $$
    insert into public.weekly_priorities (
      user_id,
      weekly_plan_id,
      category_id,
      title,
      quadrant
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000261',
      '00000000-0000-0000-0000-000000000211',
      'Focus',
      'important_not_urgent'
    )
  $$,
  'authenticated user can insert their own weekly priority'
);

select lives_ok(
  $$
    insert into public.suggestion_events (
      user_id,
      type,
      trigger,
      title_message_id,
      body_message_id,
      target_habit_id,
      target_category_id
    )
    values (
      '00000000-0000-0000-0000-000000000201',
      'weeklyReview',
      'simplePattern',
      'suggestion.title',
      'suggestion.body',
      '00000000-0000-0000-0000-000000000221',
      '00000000-0000-0000-0000-000000000211'
    )
  $$,
  'authenticated user can insert their own suggestion event linked to owned targets'
);

select lives_ok(
  $$ select public.delete_category_with_reassignment('00000000-0000-0000-0000-000000000211') $$,
  'authenticated user can delete a custom category with reassignment'
);

select is(
  (
    select count(*)::integer
    from public.categories
    where id = '00000000-0000-0000-0000-000000000211'
  ),
  0,
  'custom category delete physically removes the category row'
);

select is(
  (
    select public.habits.category_id
    from public.habits
    join public.categories on public.categories.id = public.habits.category_id
    where public.habits.id = '00000000-0000-0000-0000-000000000221'
  ),
  (
    select public.categories.id
    from public.categories
    where public.categories.user_id = '00000000-0000-0000-0000-000000000201'
      and public.categories.default_key = 'uncategorized'
  ),
  'custom category delete reassigns linked habits to Uncategorized'
);

select is(
  (
    select array[
      public.tasks.category_id,
      public.recurrent_tasks.category_id
    ]::uuid[]
    from public.tasks
    cross join public.recurrent_tasks
    where public.tasks.id = '00000000-0000-0000-0000-000000000231'
      and public.recurrent_tasks.id = '00000000-0000-0000-0000-000000000241'
  ),
  array[null, null]::uuid[],
  'custom category delete clears linked task and recurrent task categories'
);

select * from finish();

rollback;
