grant usage on schema app_private to authenticated;

revoke execute on function app_private.user_has_active_premium(uuid) from authenticated;
revoke execute on function app_private.active_habit_count(uuid, uuid) from authenticated;
revoke execute on function app_private.open_task_count(uuid, uuid) from authenticated;
revoke execute on function app_private.active_recurrent_task_count(uuid, uuid) from authenticated;

grant execute on function app_private.enforce_free_item_limits() to authenticated;
