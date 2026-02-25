create table crowd_reports (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references places(id) on delete cascade not null,
  signal text check (signal in ('quiet', 'vibes', 'packed')) not null,
  created_at timestamptz default now()
);

-- NO user_id column -- fully anonymous by design
create index on crowd_reports(place_id, created_at);

alter table crowd_reports enable row level security;
create policy "Anyone can report crowd" on crowd_reports
  for insert with check (true);
create policy "Anyone can read recent crowd" on crowd_reports
  for select using (created_at > now() - interval '3 hours');
