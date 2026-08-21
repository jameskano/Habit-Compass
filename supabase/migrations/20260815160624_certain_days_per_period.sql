begin;

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

with legacy as (
  select
    id,
    schedule_config,
    goal_config,
    greatest(
      1::numeric,
      least(
        365::numeric,
        round(
          case
            when trim(coalesce(goal_config ->> 'targetCount', '')) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$'
              then (goal_config ->> 'targetCount')::numeric
            else 1
          end
        )
      )
    )::integer as target_days,
    coalesce(goal_config ->> 'period', 'week') as legacy_period,
    greatest(
      1::numeric,
      least(
        2147483647::numeric,
        case
          when trim(coalesce(goal_config ->> 'customPeriodDays', '')) ~ '^[0-9]+$'
            then (goal_config ->> 'customPeriodDays')::numeric
          else 1
        end
      )
    )::integer as custom_period_days
  from public.habits
  where tracking_type = 'timesPerPeriod'
), normalized as (
  select
    *,
    case
      when legacy_period = 'day' then 'day'
      when legacy_period = 'week' and target_days <= 7 then 'week'
      when legacy_period in ('week', 'month') and target_days <= 28 then 'month'
      when legacy_period in ('week', 'month', 'year') then 'year'
      when legacy_period = 'custom' then (
        select candidate.period
        from (
          values
            ('week'::text, 7, 7),
            ('month'::text, 30, 28),
            ('year'::text, 365, 365)
        ) as candidate(period, nominal_days, capacity)
        where candidate.capacity >= legacy.target_days
        order by abs(candidate.nominal_days - legacy.custom_period_days), candidate.nominal_days
        limit 1
      )
      else 'year'
    end as normalized_period
  from legacy
)
update public.habits as habit
set
  tracking_type = 'binary',
  goal_config = jsonb_build_object('trackingType', 'binary'),
  schedule_config = case
    when normalized.schedule_config ->> 'kind' <> 'flexiblePeriod'
      then normalized.schedule_config
    when normalized.normalized_period = 'day'
      then jsonb_build_object('kind', 'daily')
    else jsonb_build_object(
      'kind', 'certainDaysPerPeriod',
      'targetDays', normalized.target_days,
      'period', normalized.normalized_period
    )
  end,
  minimum_config = (
    coalesce(habit.minimum_config, '{}'::jsonb)
      - 'enabledCompletionLevels'
      - 'defaultCompletionLevel'
  ) || jsonb_build_object(
    'enabledCompletionLevels', jsonb_build_array('standard'),
    'defaultCompletionLevel', null
  )
from normalized
where habit.id = normalized.id;

alter table public.habits
add constraint habits_tracking_type_check
check (
  tracking_type in (
    'binary',
    'measurablePerSession',
    'totalMeasurablePerPeriod'
  )
);

comment on column public.habits.schedule_config is
'JSONB habit frequency contract. Supports explicit schedules, certainDaysPerPeriod for binary/per-session goals, and internal flexiblePeriod for total-measurable-per-period goals.';

comment on column public.habits.goal_config is
'JSONB habit completion goal contract. Supports binary, measurablePerSession, and totalMeasurablePerPeriod.';

notify pgrst, 'reload schema';

commit;
