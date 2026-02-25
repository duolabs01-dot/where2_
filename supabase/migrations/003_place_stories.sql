create extension if not exists pgcrypto;

create table if not exists place_stories (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references places(id) on delete cascade not null,
  posted_by uuid references profiles(id) on delete cascade not null,
  media_url text,
  caption text,
  vibe_tag text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

do $$
begin
  if to_regclass('public.places') is not null
     and not exists (
       select 1 from pg_constraint where conname = 'place_stories_place_id_fkey'
     ) then
    alter table place_stories
      add constraint place_stories_place_id_fkey
      foreign key (place_id) references places(id) on delete cascade;
  end if;

  if to_regclass('public.profiles') is not null
     and not exists (
       select 1 from pg_constraint where conname = 'place_stories_posted_by_fkey'
     ) then
    alter table place_stories
      add constraint place_stories_posted_by_fkey
      foreign key (posted_by) references profiles(id) on delete cascade;
  end if;
end
$$;

create index if not exists place_stories_place_id_idx on place_stories(place_id);
create index if not exists place_stories_expires_at_idx on place_stories(expires_at);

alter table place_stories enable row level security;

-- Businesses can insert their own stories
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'place_stories'
      and policyname = 'Business can post stories'
  ) then
    create policy "Business can post stories" on place_stories
      for insert with check (auth.uid() = posted_by);
  end if;
end
$$;

-- Anyone can read non-expired stories
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'place_stories'
      and policyname = 'Public can read active stories'
  ) then
    create policy "Public can read active stories" on place_stories
      for select using (expires_at > now());
  end if;
end
$$;
