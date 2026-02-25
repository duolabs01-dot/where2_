create table place_stories (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references places(id) on delete cascade not null,
  posted_by uuid references profiles(id) on delete cascade not null,
  media_url text,
  caption text,
  vibe_tag text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

create index on place_stories(place_id);
create index on place_stories(expires_at);

alter table place_stories enable row level security;

-- Businesses can insert their own stories
create policy "Business can post stories" on place_stories
  for insert with check (auth.uid() = posted_by);

-- Anyone can read non-expired stories
create policy "Public can read active stories" on place_stories
  for select using (expires_at > now());
