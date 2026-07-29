create or replace function public.delete_category_with_reassignment(category_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_category_id alias for $1;
  category_row public.categories%rowtype;
  uncategorized_id uuid;
begin
  select public.categories.*
  into category_row
  from public.categories
  where public.categories.id = target_category_id
    and public.categories.user_id = auth.uid()
  for update;

  if category_row.id is null then
    raise exception 'Category not found.';
  end if;

  if category_row.is_default or category_row.default_key is not null then
    raise exception 'Default categories cannot be deleted.';
  end if;

  perform public.ensure_default_categories_for_user(category_row.user_id);

  select public.categories.id
  into uncategorized_id
  from public.categories
  where public.categories.user_id = category_row.user_id
    and public.categories.default_key = 'uncategorized';

  if uncategorized_id is null then
    raise exception 'Uncategorized category is missing.';
  end if;

  update public.habits
  set category_id = uncategorized_id
  where public.habits.user_id = category_row.user_id
    and public.habits.category_id = category_row.id;

  update public.tasks
  set category_id = null
  where public.tasks.user_id = category_row.user_id
    and public.tasks.category_id = category_row.id;

  update public.recurrent_tasks
  set category_id = null
  where public.recurrent_tasks.user_id = category_row.user_id
    and public.recurrent_tasks.category_id = category_row.id;

  delete from public.categories
  where public.categories.id = category_row.id
    and public.categories.user_id = category_row.user_id;
end;
$$;
