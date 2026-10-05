-- =====================================================================
-- CozyNotes database  (run this whole file once in Supabase > SQL Editor)
-- =====================================================================

-- ---------- TABLES ----------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null default 'Friend' check (char_length(display_name) between 1 and 40),
  timezone        text not null default 'UTC',
  coins           int  not null default 0 check (coins >= 0),
  current_streak  int  not null default 0,
  longest_streak  int  not null default 0,
  last_entry_date date,
  reward_day      date,
  rewarded_today  int  not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null default '' check (char_length(title) <= 120),
  body       text not null check (char_length(body) between 1 and 10000),
  mood       text not null check (mood in ('happy','calm','excited','tired','sad','angry')),
  created_at timestamptz not null default now()
);
create index if not exists entries_user_created_idx on public.entries (user_id, created_at desc);

create table if not exists public.rewards (
  id    text primary key,
  name  text not null,
  emoji text not null,
  cost  int  not null check (cost >= 0),
  kind  text not null check (kind in ('decor','theme'))
);

create table if not exists public.user_rewards (
  user_id     uuid not null references auth.users(id) on delete cascade,
  reward_id   text not null references public.rewards(id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, reward_id)
);

-- ---------- REWARD CATALOG ----------
insert into public.rewards (id, name, emoji, cost, kind) values
  ('flower',      'Pink Flower',   '🌸', 25,  'decor'),
  ('plant',       'Leafy Plant',   '🪴', 30,  'decor'),
  ('candle',      'Warm Candle',   '🕯️', 40,  'decor'),
  ('books',       'Book Stack',    '📚', 45,  'decor'),
  ('lantern',     'Paper Lantern', '🏮', 50,  'decor'),
  ('teddy',       'Teddy Bear',    '🧸', 60,  'decor'),
  ('rainbow',     'Rainbow',       '🌈', 90,  'decor'),
  ('cat',         'Sleepy Cat',    '🐈', 120, 'decor'),
  ('theme-peach', 'Peach Sunset',  '🍑', 80,  'theme'),
  ('theme-mint',  'Mint Garden',   '🍃', 80,  'theme'),
  ('theme-sky',   'Sky Pop',       '☁️', 80,  'theme')
on conflict (id) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles     enable row level security;
alter table public.entries      enable row level security;
alter table public.rewards      enable row level security;
alter table public.user_rewards enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "entries: read own"   on public.entries;
drop policy if exists "entries: insert own" on public.entries;
drop policy if exists "entries: update own" on public.entries;
drop policy if exists "entries: delete own" on public.entries;
create policy "entries: read own"   on public.entries for select to authenticated using (auth.uid() = user_id);
create policy "entries: insert own" on public.entries for insert to authenticated with check (auth.uid() = user_id);
create policy "entries: update own" on public.entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "entries: delete own" on public.entries for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "rewards: read all" on public.rewards;
create policy "rewards: read all" on public.rewards for select to authenticated using (true);

drop policy if exists "user_rewards: read own" on public.user_rewards;
create policy "user_rewards: read own" on public.user_rewards for select to authenticated using (auth.uid() = user_id);
-- (no insert/update/delete policy on user_rewards: only buy_reward() can add rows)

-- ---------- COLUMN-LEVEL LOCKS (stop users editing coins/streaks) ----------
revoke all on public.profiles     from anon, authenticated;
revoke all on public.entries      from anon, authenticated;
revoke all on public.rewards      from anon, authenticated;
revoke all on public.user_rewards from anon, authenticated;

grant select on public.profiles     to authenticated;
grant update (display_name, timezone) on public.profiles to authenticated;

grant select, delete on public.entries to authenticated;
grant insert (title, body, mood) on public.entries to authenticated;
grant update (title, body, mood) on public.entries to authenticated;

grant select on public.rewards      to authenticated;
grant select on public.user_rewards to authenticated;

-- ---------- AUTO-CREATE PROFILE ON SIGN UP ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
                  nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                  split_part(new.email, '@', 1), 'Friend'), 40)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- COINS + STREAKS (server decides, never the browser) ----------
create or replace function public.handle_new_entry()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p          public.profiles%rowtype;
  tz         text;
  today      date;
  new_streak int;
  earned     int := 0;
  rewarded   int;
begin
  select * into p from public.profiles where id = new.user_id for update;
  if not found then return new; end if;

  tz := coalesce(p.timezone, 'UTC');
  if not exists (select 1 from pg_timezone_names where name = tz) then tz := 'UTC'; end if;
  today := (new.created_at at time zone tz)::date;

  -- 10 coins for each of the first 3 entries per day (no farming)
  rewarded := case when p.reward_day = today then p.rewarded_today else 0 end;
  if rewarded < 3 then earned := 10; end if;
  rewarded := rewarded + 1;

  -- streak
  if p.last_entry_date is null or p.last_entry_date < today - 1 then
    new_streak := 1;
  elsif p.last_entry_date = today - 1 then
    new_streak := p.current_streak + 1;
  else
    new_streak := p.current_streak;
  end if;

  -- streak bonuses (once per new streak day)
  if p.last_entry_date is distinct from today then
    earned := earned + case new_streak when 3 then 15 when 7 then 40 when 30 then 150 else 0 end;
  end if;

  update public.profiles set
    coins           = coins + earned,
    current_streak  = new_streak,
    longest_streak  = greatest(longest_streak, new_streak),
    last_entry_date = greatest(coalesce(last_entry_date, today), today),
    reward_day      = today,
    rewarded_today  = rewarded
  where id = new.user_id;

  return new;
end $$;

drop trigger if exists on_entry_created on public.entries;
create trigger on_entry_created
  after insert on public.entries
  for each row execute function public.handle_new_entry();

-- ---------- BUY A REWARD ----------
create or replace function public.buy_reward(p_reward_id text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.rewards%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into r from public.rewards where id = p_reward_id;
  if not found then raise exception 'That item does not exist'; end if;
  if exists (select 1 from public.user_rewards where user_id = auth.uid() and reward_id = r.id) then
    raise exception 'You already own this';
  end if;
  update public.profiles set coins = coins - r.cost where id = auth.uid() and coins >= r.cost;
  if not found then raise exception 'Not enough coins yet'; end if;
  insert into public.user_rewards (user_id, reward_id) values (auth.uid(), r.id);
end $$;

revoke all on function public.buy_reward(text) from public, anon;
grant execute on function public.buy_reward(text) to authenticated;

-- ---------- DELETE MY ACCOUNT (removes everything, cascades) ----------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- BACKFILL (for anyone who signed up before this script ran) ----------
insert into public.profiles (id, display_name)
select id, left(coalesce(nullif(trim(raw_user_meta_data ->> 'display_name'), ''), split_part(email, '@', 1), 'Friend'), 40)
from auth.users
on conflict (id) do nothing;
