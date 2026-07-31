alter table public.profiles
drop constraint if exists profiles_language_check;

alter table public.profiles
alter column language set default 'system';

alter table public.profiles
add constraint profiles_language_check
check (language in ('system', 'en', 'es'));

comment on column public.profiles.language is
'Stable app language preference. system resolves from the user device language at runtime.';
