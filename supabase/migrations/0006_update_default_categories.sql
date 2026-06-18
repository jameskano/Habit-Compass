alter table public.categories
drop constraint if exists categories_default_key_check;

drop trigger if exists protect_default_categories_update on public.categories;

update public.categories
set default_key = 'wellbeing',
  name = 'Wellbeing',
  description = 'physical health, mental health, sleep, nutrition and self-care',
  color = 'emerald',
  icon = 'heartPulse',
  sort_order = 0,
  is_default = true
where default_key = 'health';

update public.categories
set name = defaults.name,
  description = defaults.description,
  color = defaults.color,
  icon = defaults.icon,
  sort_order = defaults.sort_order,
  is_default = true
from (
  values
    ('wellbeing', 'Wellbeing', 'physical health, mental health, sleep, nutrition and self-care', 'emerald', 'heartPulse', 0),
    ('family', 'Family', 'parents, children, siblings and family responsibilities', 'rose', 'users', 1),
    ('relationships', 'Relationships', 'partner, friendships and close personal connections', 'ruby', 'heart', 2),
    ('career', 'Career', 'employment, professional responsibilities and career development', 'blue', 'briefcase', 3),
    ('learning', 'Learning', 'studying, reading, courses and skill development', 'sky', 'bookOpen', 4),
    ('finance', 'Finance', 'saving, budgeting, investing and financial management', 'gold', 'walletCards', 5),
    ('home', 'Home', 'cleaning, maintenance, household responsibilities and life admin', 'clay', 'home', 6),
    ('projects', 'Projects', 'personal projects, side projects and long-term initiatives', 'indigo', 'rocket', 7),
    ('creativity', 'Creativity', 'art, writing, music and creative expression', 'purple', 'palette', 8),
    ('leisure', 'Leisure', 'hobbies, entertainment, rest and recreation', 'fuchsia', 'gamepad', 9),
    ('growth', 'Growth', 'personal development, discipline and self-improvement', 'lime', 'sprout', 10),
    ('reflection', 'Reflection', 'journaling, mindfulness, planning and reviewing life', 'violet', 'notebookPen', 11),
    ('community', 'Community', 'volunteering, helping others and community participation', 'teal', 'handshake', 12),
    ('meaning', 'Meaning', 'purpose, spirituality, faith and personal philosophy', 'graphite', 'compass', 13),
    ('uncategorized', 'Uncategorized', null, 'slate', 'uncategorized', 14)
) as defaults(default_key, name, description, color, icon, sort_order)
where categories.default_key = defaults.default_key;

with known_users as (
  select id as user_id from public.profiles
  union
  select user_id from public.categories
  union
  select user_id from public.habits
  union
  select user_id from public.tasks
  union
  select user_id from public.recurrent_tasks
)
insert into public.categories (
  user_id,
  name,
  description,
  color,
  icon,
  sort_order,
  is_default,
  default_key
)
select user_id,
  name,
  description,
  color,
  icon,
  sort_order,
  true,
  default_key
from known_users
cross join (
  values
    ('Wellbeing', 'physical health, mental health, sleep, nutrition and self-care', 'emerald', 'heartPulse', 0, 'wellbeing'),
    ('Family', 'parents, children, siblings and family responsibilities', 'rose', 'users', 1, 'family'),
    ('Relationships', 'partner, friendships and close personal connections', 'ruby', 'heart', 2, 'relationships'),
    ('Career', 'employment, professional responsibilities and career development', 'blue', 'briefcase', 3, 'career'),
    ('Learning', 'studying, reading, courses and skill development', 'sky', 'bookOpen', 4, 'learning'),
    ('Finance', 'saving, budgeting, investing and financial management', 'gold', 'walletCards', 5, 'finance'),
    ('Home', 'cleaning, maintenance, household responsibilities and life admin', 'clay', 'home', 6, 'home'),
    ('Projects', 'personal projects, side projects and long-term initiatives', 'indigo', 'rocket', 7, 'projects'),
    ('Creativity', 'art, writing, music and creative expression', 'purple', 'palette', 8, 'creativity'),
    ('Leisure', 'hobbies, entertainment, rest and recreation', 'fuchsia', 'gamepad', 9, 'leisure'),
    ('Growth', 'personal development, discipline and self-improvement', 'lime', 'sprout', 10, 'growth'),
    ('Reflection', 'journaling, mindfulness, planning and reviewing life', 'violet', 'notebookPen', 11, 'reflection'),
    ('Community', 'volunteering, helping others and community participation', 'teal', 'handshake', 12, 'community'),
    ('Meaning', 'purpose, spirituality, faith and personal philosophy', 'graphite', 'compass', 13, 'meaning'),
    ('Uncategorized', null, 'slate', 'uncategorized', 14, 'uncategorized')
) as defaults(name, description, color, icon, sort_order, default_key)
on conflict (user_id, default_key) where default_key is not null do nothing;

alter table public.categories
add constraint categories_default_key_check check (
  default_key is null or default_key in (
    'wellbeing',
    'family',
    'relationships',
    'career',
    'learning',
    'finance',
    'home',
    'projects',
    'creativity',
    'leisure',
    'growth',
    'reflection',
    'community',
    'meaning',
    'uncategorized'
  )
);

create or replace function public.category_default_name(default_key text)
returns text
language sql
immutable
as $$
  select case default_key
    when 'wellbeing' then 'Wellbeing'
    when 'family' then 'Family'
    when 'relationships' then 'Relationships'
    when 'career' then 'Career'
    when 'learning' then 'Learning'
    when 'finance' then 'Finance'
    when 'home' then 'Home'
    when 'projects' then 'Projects'
    when 'creativity' then 'Creativity'
    when 'leisure' then 'Leisure'
    when 'growth' then 'Growth'
    when 'reflection' then 'Reflection'
    when 'community' then 'Community'
    when 'meaning' then 'Meaning'
    when 'uncategorized' then 'Uncategorized'
    else null
  end;
$$;

create or replace function public.ensure_default_categories_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id <> auth.uid() then
    raise exception 'Cannot provision categories for another user.';
  end if;

  insert into public.categories (
    user_id,
    name,
    description,
    color,
    icon,
    sort_order,
    is_default,
    default_key
  )
  values
    (target_user_id, 'Wellbeing', 'physical health, mental health, sleep, nutrition and self-care', 'emerald', 'heartPulse', 0, true, 'wellbeing'),
    (target_user_id, 'Family', 'parents, children, siblings and family responsibilities', 'rose', 'users', 1, true, 'family'),
    (target_user_id, 'Relationships', 'partner, friendships and close personal connections', 'ruby', 'heart', 2, true, 'relationships'),
    (target_user_id, 'Career', 'employment, professional responsibilities and career development', 'blue', 'briefcase', 3, true, 'career'),
    (target_user_id, 'Learning', 'studying, reading, courses and skill development', 'sky', 'bookOpen', 4, true, 'learning'),
    (target_user_id, 'Finance', 'saving, budgeting, investing and financial management', 'gold', 'walletCards', 5, true, 'finance'),
    (target_user_id, 'Home', 'cleaning, maintenance, household responsibilities and life admin', 'clay', 'home', 6, true, 'home'),
    (target_user_id, 'Projects', 'personal projects, side projects and long-term initiatives', 'indigo', 'rocket', 7, true, 'projects'),
    (target_user_id, 'Creativity', 'art, writing, music and creative expression', 'purple', 'palette', 8, true, 'creativity'),
    (target_user_id, 'Leisure', 'hobbies, entertainment, rest and recreation', 'fuchsia', 'gamepad', 9, true, 'leisure'),
    (target_user_id, 'Growth', 'personal development, discipline and self-improvement', 'lime', 'sprout', 10, true, 'growth'),
    (target_user_id, 'Reflection', 'journaling, mindfulness, planning and reviewing life', 'violet', 'notebookPen', 11, true, 'reflection'),
    (target_user_id, 'Community', 'volunteering, helping others and community participation', 'teal', 'handshake', 12, true, 'community'),
    (target_user_id, 'Meaning', 'purpose, spirituality, faith and personal philosophy', 'graphite', 'compass', 13, true, 'meaning'),
    (target_user_id, 'Uncategorized', null, 'slate', 'uncategorized', 14, true, 'uncategorized')
  on conflict (user_id, default_key) where default_key is not null do nothing;
end;
$$;

create trigger protect_default_categories_update
before update on public.categories
for each row
execute function public.protect_default_categories();
