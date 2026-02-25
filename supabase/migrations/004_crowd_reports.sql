create table if not exists crowd_reports (
  id uuid default gen_random_uuid() primary key,
  place_id uuid not null,
  signal text check (signal in ('quiet', 'vibes', 'packed')) not null,
  created_at timestamptz default now()
);

do $$
begin
  if to_regclass('public.places') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'crowd_reports_place_id_fkey'
     ) then
    alter table crowd_reports
      add constraint crowd_reports_place_id_fkey
      foreign key (place_id) references places(id) on delete cascade;
  end if;
end
$$;

-- NO user_id column -- fully anonymous by design
create index on crowd_reports(place_id, created_at);

alter table crowd_reports enable row level security;
create policy "Anyone can report crowd" on crowd_reports
  for insert with check (true);
create policy "Anyone can read recent crowd" on crowd_reports
  for select using (created_at > now() - interval '3 hours');
