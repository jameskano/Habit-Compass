alter table public.habit_logs
add column if not exists amount numeric check (amount is null or amount >= 0);

alter table public.habit_logs
add column if not exists unit_label text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'duration_minutes'
  ) then
    execute $sql$
      update public.habit_logs
      set amount = coalesce(amount, duration_minutes),
          unit_label = coalesce(unit_label, case when duration_minutes is not null then 'minutes' end)
      where amount is null
        and duration_minutes is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'repetitions'
  ) then
    execute $sql$
      update public.habit_logs
      set amount = coalesce(amount, repetitions),
          unit_label = coalesce(unit_label, case when repetitions is not null then 'repetitions' end)
      where amount is null
        and repetitions is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'quantity'
  ) then
    execute $sql$
      update public.habit_logs
      set amount = coalesce(amount, quantity)
      where amount is null
        and quantity is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'quantity_unit_label'
  ) then
    execute $sql$
      update public.habit_logs
      set unit_label = coalesce(unit_label, quantity_unit_label)
      where unit_label is null
        and quantity_unit_label is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'value'
  ) then
    execute $sql$
      update public.habit_logs
      set amount = coalesce(amount, value)
      where amount is null
        and value is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_logs'
      and column_name = 'unit'
  ) then
    execute $sql$
      update public.habit_logs
      set unit_label = coalesce(unit_label, unit)
      where unit_label is null
        and unit is not null
    $sql$;
  end if;
end;
$$;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.habits'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%tracking_type%'
  loop
    execute format('alter table public.habits drop constraint %I', constraint_record.conname);
  end loop;
end;
$$;

update public.habits
set tracking_type = 'totalMeasurablePerPeriod',
    goal_config = jsonb_strip_nulls(
      jsonb_build_object(
        'trackingType', 'totalMeasurablePerPeriod',
        'period', goal_config ->> 'period',
        'customPeriodDays', (goal_config ->> 'customPeriodDays')::integer,
        'targetAmount', (goal_config ->> 'targetRepetitions')::numeric,
        'minimumAmount', (goal_config ->> 'minimumRepetitions')::numeric,
        'unitLabel', 'repetitions'
      )
    )
where tracking_type = 'repetitionsPerPeriod';

update public.habits
set tracking_type = 'measurablePerSession',
    goal_config = jsonb_strip_nulls(
      jsonb_build_object(
        'trackingType', 'measurablePerSession',
        'targetAmount', (goal_config ->> 'targetMinutes')::numeric,
        'minimumAmount', (goal_config ->> 'minimumMinutes')::numeric,
        'unitLabel', 'minutes'
      )
    )
where tracking_type = 'timePerSession';

update public.habits
set tracking_type = 'totalMeasurablePerPeriod',
    goal_config = jsonb_strip_nulls(
      jsonb_build_object(
        'trackingType', 'totalMeasurablePerPeriod',
        'period', goal_config ->> 'period',
        'customPeriodDays', (goal_config ->> 'customPeriodDays')::integer,
        'targetAmount', (goal_config ->> 'targetMinutes')::numeric,
        'minimumAmount', (goal_config ->> 'minimumMinutes')::numeric,
        'unitLabel', 'minutes'
      )
    )
where tracking_type = 'totalTimePerPeriod';

update public.habits
set tracking_type = 'measurablePerSession',
    goal_config = jsonb_strip_nulls(
      jsonb_build_object(
        'trackingType', 'measurablePerSession',
        'targetAmount', (goal_config ->> 'targetQuantity')::numeric,
        'minimumAmount', (goal_config ->> 'minimumQuantity')::numeric,
        'unitLabel', goal_config ->> 'unitLabel'
      )
    )
where tracking_type = 'quantityPerSession';

update public.habits
set tracking_type = 'totalMeasurablePerPeriod',
    goal_config = jsonb_strip_nulls(
      jsonb_build_object(
        'trackingType', 'totalMeasurablePerPeriod',
        'period', goal_config ->> 'period',
        'customPeriodDays', (goal_config ->> 'customPeriodDays')::integer,
        'targetAmount', (goal_config ->> 'targetQuantity')::numeric,
        'minimumAmount', (goal_config ->> 'minimumQuantity')::numeric,
        'unitLabel', goal_config ->> 'unitLabel'
      )
    )
where tracking_type = 'totalQuantityPerPeriod';

alter table public.habits
add constraint habits_tracking_type_check
check (
  tracking_type in (
    'binary',
    'timesPerPeriod',
    'measurablePerSession',
    'totalMeasurablePerPeriod'
  )
);

alter table public.habit_logs
drop column if exists repetitions,
drop column if exists duration_minutes,
drop column if exists quantity,
drop column if exists quantity_unit_label,
drop column if exists value,
drop column if exists unit;

notify pgrst, 'reload schema';
