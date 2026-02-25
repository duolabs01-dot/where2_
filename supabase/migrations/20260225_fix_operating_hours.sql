-- Operating-hours guardrails for places (no schema column changes).
-- 1) Normalize obvious formatting issues.
-- 2) Correct known bad row(s): Seam Coffee.
-- 3) Add HH:MM format checks for future writes.

begin;

update public.places
set opening_time = left(trim(opening_time), 5)
where opening_time is not null;

update public.places
set closing_time = left(trim(closing_time), 5)
where closing_time is not null;

update public.places
set opening_time = '06:30',
    closing_time = '17:30'
where lower(trim(name)) = 'seam coffee';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'places_opening_time_hhmm_chk'
  ) then
    alter table public.places
      add constraint places_opening_time_hhmm_chk
      check (
        opening_time is null
        or opening_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
      ) not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'places_closing_time_hhmm_chk'
  ) then
    alter table public.places
      add constraint places_closing_time_hhmm_chk
      check (
        closing_time is null
        or closing_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
      ) not valid;
  end if;
end
$$;

commit;
