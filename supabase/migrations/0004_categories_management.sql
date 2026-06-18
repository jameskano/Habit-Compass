alter table public.categories
add column if not exists default_key text;

update public.categories
set icon = case icon
  when 'heart' then 'heartPulse'
  when 'book-open' then 'bookOpen'
  when 'tag' then 'general'
  when 'circleHelp' then 'uncategorized'
  else icon
end;

update public.categories
set default_key = case
    when is_default and lower(name) = 'health' then 'health'
    when is_default and lower(name) = 'learning' then 'learning'
    when is_default and lower(name) = 'uncategorized' then 'uncategorized'
    else default_key
  end,
  color = case
    when color in ('emerald', 'sky') then color
    else 'emerald'
  end;

update public.categories
set is_default = false
where is_default = true
  and default_key is null;

alter table public.categories
add constraint categories_default_key_check check (
  default_key is null or default_key in ('health', 'learning', 'uncategorized')
),
add constraint categories_icon_check check (
  icon in (
    'activity', 'award', 'backpack', 'banknote', 'bed', 'bike', 'bookOpen', 'briefcase',
    'brain', 'brush', 'calculator', 'calendar', 'camera', 'car', 'chefHat',
    'chartNoAxesColumn', 'church', 'circleHelp',
    'clipboardCheck', 'clock', 'coffee', 'coins', 'compass', 'dumbbell', 'earth',
    'feather', 'fileText', 'flower', 'gamepad', 'general', 'gift', 'globe', 'graduationCap',
    'handHeart', 'handshake', 'heart', 'heartPulse', 'home', 'landmark', 'languages',
    'laptop', 'leaf', 'lightbulb', 'listChecks', 'map', 'medal', 'messageCircle', 'mic', 'moon',
    'mountain', 'music', 'newspaper', 'notebookPen', 'palette', 'pawPrint', 'penLine', 'personStanding', 'plane',
    'plant', 'presentation', 'rocket', 'route', 'scale', 'school', 'send', 'shield',
    'shirt', 'shoppingBasket', 'smile', 'sparkles', 'sprout', 'star', 'stethoscope', 'sun', 'target',
    'tent', 'treePalm', 'trophy', 'uncategorized', 'utensils', 'users', 'walletCards', 'waves', 'wrench'
  )
),
add constraint categories_color_check check (
  color in (
    'tomato', 'coral', 'amber', 'gold', 'lime', 'grass', 'emerald', 'mint', 'teal',
    'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'plum', 'fuchsia', 'pink',
    'rose', 'ruby', 'slate', 'olive', 'clay', 'graphite'
  )
),
add constraint categories_default_consistency_check check (
  (is_default = true and default_key is not null)
  or (is_default = false and default_key is null)
);

create unique index if not exists categories_user_default_key_idx
on public.categories (user_id, default_key)
where default_key is not null;

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
insert into public.categories (user_id, name, color, icon, sort_order, is_default, default_key)
select user_id, name, color, icon, sort_order, true, default_key
from known_users
cross join (
  values
    ('Health', 'emerald', 'heartPulse', 0, 'health'),
    ('Learning', 'sky', 'bookOpen', 1, 'learning'),
    ('Uncategorized', 'slate', 'uncategorized', 2, 'uncategorized')
) as defaults(name, color, icon, sort_order, default_key)
on conflict (user_id, default_key) where default_key is not null do nothing;

update public.habits
set category_id = uncategorized.id
from public.categories as uncategorized
where habits.user_id = uncategorized.user_id
  and uncategorized.default_key = 'uncategorized'
  and habits.category_id is null;

alter table public.habits
alter column category_id set not null;

create or replace function public.category_default_name(default_key text)
returns text
language sql
immutable
as $$
  select case default_key
    when 'health' then 'Health'
    when 'learning' then 'Learning'
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

  insert into public.categories (user_id, name, color, icon, sort_order, is_default, default_key)
  values
    (target_user_id, 'Health', 'emerald', 'heartPulse', 0, true, 'health'),
    (target_user_id, 'Learning', 'sky', 'bookOpen', 1, true, 'learning'),
    (target_user_id, 'Uncategorized', 'slate', 'uncategorized', 2, true, 'uncategorized')
  on conflict (user_id, default_key) where default_key is not null do nothing;
end;
$$;

create or replace function public.protect_default_categories()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_default or old.default_key is not null then
      raise exception 'Default categories cannot be deleted.';
    end if;
    return old;
  end if;

  if old.is_default or old.default_key is not null then
    if new.is_default is distinct from old.is_default
      or new.default_key is distinct from old.default_key
      or new.name is distinct from old.name then
      raise exception 'Default category names are protected.';
    end if;
  end if;

  if new.default_key is not null then
    new.name = public.category_default_name(new.default_key);
    new.is_default = true;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_default_categories_update on public.categories;
create trigger protect_default_categories_update
before update on public.categories
for each row
execute function public.protect_default_categories();

drop trigger if exists protect_default_categories_delete on public.categories;
create trigger protect_default_categories_delete
before delete on public.categories
for each row
execute function public.protect_default_categories();

create or replace function public.delete_category_with_reassignment(category_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  category_row public.categories%rowtype;
  uncategorized_id uuid;
begin
  select *
  into category_row
  from public.categories
  where id = category_id
    and user_id = auth.uid()
  for update;

  if category_row.id is null then
    raise exception 'Category not found.';
  end if;

  if category_row.is_default or category_row.default_key is not null then
    raise exception 'Default categories cannot be deleted.';
  end if;

  perform public.ensure_default_categories_for_user(category_row.user_id);

  select id
  into uncategorized_id
  from public.categories
  where user_id = category_row.user_id
    and default_key = 'uncategorized';

  if uncategorized_id is null then
    raise exception 'Uncategorized category is missing.';
  end if;

  update public.habits
  set category_id = uncategorized_id
  where user_id = category_row.user_id
    and category_id = category_row.id;

  update public.tasks
  set category_id = null
  where user_id = category_row.user_id
    and category_id = category_row.id;

  update public.recurrent_tasks
  set category_id = null
  where user_id = category_row.user_id
    and category_id = category_row.id;

  delete from public.categories
  where id = category_row.id
    and user_id = category_row.user_id;
end;
$$;

alter policy "categories_insert_own"
on public.categories
with check (
  (select auth.uid()) = user_id
  and is_default = false
  and default_key is null
);

alter policy "categories_update_own"
on public.categories
with check ((select auth.uid()) = user_id);

alter policy "categories_delete_own"
on public.categories
using (
  (select auth.uid()) = user_id
  and is_default = false
  and default_key is null
);

alter policy "habits_insert_own"
on public.habits
with check (
  (select auth.uid()) = user_id
  and category_id is not null
  and exists (
    select 1
    from public.categories
    where categories.id = category_id
      and categories.user_id = (select auth.uid())
  )
);

alter policy "habits_update_own"
on public.habits
with check (
  (select auth.uid()) = user_id
  and category_id is not null
  and exists (
    select 1
    from public.categories
    where categories.id = category_id
      and categories.user_id = (select auth.uid())
  )
);
