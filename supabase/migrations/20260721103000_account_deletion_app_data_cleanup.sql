create or replace function public.protect_default_categories()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.account_deletion_in_progress', true) = 'on' then
      return old;
    end if;

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

create or replace function public.delete_user_app_data_for_account_deletion(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform set_config('app.account_deletion_in_progress', 'on', true);

  delete from public.suggestion_events where user_id = target_user_id;
  delete from public.weekly_big_rocks where user_id = target_user_id;
  delete from public.weekly_priorities where user_id = target_user_id;
  delete from public.weekly_plans where user_id = target_user_id;
  delete from public.reflections where user_id = target_user_id;
  delete from public.mood_logs where user_id = target_user_id;
  delete from public.habit_inactivity_periods where user_id = target_user_id;
  delete from public.habit_logs where user_id = target_user_id;
  delete from public.habits where user_id = target_user_id;
  delete from public.recurrent_task_logs where user_id = target_user_id;
  delete from public.recurrent_tasks where user_id = target_user_id;
  delete from public.tasks where user_id = target_user_id;
  delete from public.subscription_entitlements where user_id = target_user_id;
  delete from public.feedback_attachments where user_id = target_user_id;
  delete from public.feedback_submissions where user_id = target_user_id;
  delete from public.categories where user_id = target_user_id;
  delete from public.legal_acceptances where user_id = target_user_id;
  delete from public.user_account_capabilities where user_id = target_user_id;
  delete from public.profiles where id = target_user_id;
end;
$$;

revoke all on function public.delete_user_app_data_for_account_deletion(uuid) from public;
grant execute on function public.delete_user_app_data_for_account_deletion(uuid) to service_role;
