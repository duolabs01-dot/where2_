create table if not exists go_there_events (
  id uuid default gen_random_uuid() primary key,
  place_id uuid,
  transport_mode text check (transport_mode in ('drive', 'uber', 'bolt', 'walk')),
  created_at timestamptz default now()
);

do $$
begin
  if to_regclass('public.places') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'go_there_events_place_id_fkey'
     ) then
    alter table go_there_events
      add constraint go_there_events_place_id_fkey
      foreign key (place_id) references places(id) on delete cascade;
  end if;
end
$$;

create index if not exists go_there_events_place_created_idx
  on go_there_events(place_id, created_at);

alter table go_there_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'go_there_events'
      and policyname = 'Anyone can insert go there events'
  ) then
    create policy "Anyone can insert go there events" on go_there_events
      for insert with check (true);
  end if;
end
$$;
