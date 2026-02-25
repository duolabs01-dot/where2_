create extension if not exists pgcrypto;

create table if not exists check_ins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  place_id uuid not null,
  message text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '3 hours')
);

do $$
begin
  if to_regclass('public.profiles') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'check_ins_user_id_fkey'
     ) then
    alter table check_ins
      add constraint check_ins_user_id_fkey
      foreign key (user_id) references profiles(id) on delete cascade;
  end if;

  if to_regclass('public.places') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'check_ins_place_id_fkey'
     ) then
    alter table check_ins
      add constraint check_ins_place_id_fkey
      foreign key (place_id) references places(id) on delete cascade;
  end if;
end
$$;

create index if not exists check_ins_user_id_idx on check_ins(user_id);
create index if not exists check_ins_expires_at_idx on check_ins(expires_at);

alter table check_ins enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'check_ins'
      and policyname = 'User can manage own check-ins'
  ) then
    create policy "User can manage own check-ins" on check_ins
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.follows') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'check_ins'
         and policyname = 'Followers can read check-ins'
     ) then
    create policy "Followers can read check-ins" on check_ins
      for select using (
        auth.uid() in (
          select follower_id
          from follows
          where following_id = check_ins.user_id
        )
      );
  end if;
end
$$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table profiles
      add column if not exists share_activity boolean not null default false;
  end if;
end
$$;
