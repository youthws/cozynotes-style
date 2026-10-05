-- =====================================================================
-- CozyNotes: NOTEBOOK PAGES  (run once in Supabase > SQL Editor,
-- AFTER schema.sql. Safe to run again.)
-- =====================================================================

create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in (
               'diary','daily','weekly','monthly','tracker','workout','meal',
               'budget','wishlist','life','goals','projects','ideas','contacts')),
  title      text not null default '' check (char_length(title) <= 120),
  page_date  date not null default current_date,
  tags       text[] not null default '{}' check (cardinality(tags) <= 12),
  data       jsonb not null default '{}'::jsonb check (octet_length(data::text) <= 700000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pages_user_type_idx on public.pages (user_id, type, page_date desc);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.pages enable row level security;

drop policy if exists "pages: read own"   on public.pages;
drop policy if exists "pages: insert own" on public.pages;
drop policy if exists "pages: update own" on public.pages;
drop policy if exists "pages: delete own" on public.pages;
create policy "pages: read own"   on public.pages for select to authenticated using (auth.uid() = user_id);
create policy "pages: insert own" on public.pages for insert to authenticated with check (auth.uid() = user_id);
create policy "pages: update own" on public.pages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pages: delete own" on public.pages for delete to authenticated using (auth.uid() = user_id);

revoke all on public.pages from anon, authenticated;
grant select, delete on public.pages to authenticated;
grant insert (type, title, page_date, tags, data) on public.pages to authenticated;
grant update (title, page_date, tags, data)       on public.pages to authenticated;

-- ---------- keep updated_at fresh ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- ---------- COPY OLD DIARY ENTRIES INTO PAGES (no coins awarded) ----------
insert into public.pages (user_id, type, title, page_date, data, created_at, updated_at)
select e.user_id, 'diary', e.title, (e.created_at at time zone 'UTC')::date,
       jsonb_build_object('mood', e.mood, 'thoughts', e.body), e.created_at, e.created_at
from public.entries e
where not exists (
  select 1 from public.pages p
  where p.user_id = e.user_id and p.type = 'diary' and p.created_at = e.created_at
);

-- the old table is now read-only for users (coins come from pages)
revoke insert, update on public.entries from authenticated;

-- ---------- COINS + STREAKS for new pages (server decides) ----------
create or replace function public.handle_new_page()
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

  rewarded := case when p.reward_day = today then p.rewarded_today else 0 end;
  if rewarded < 3 then earned := 10; end if;
  rewarded := rewarded + 1;

  if p.last_entry_date is null or p.last_entry_date < today - 1 then
    new_streak := 1;
  elsif p.last_entry_date = today - 1 then
    new_streak := p.current_streak + 1;
  else
    new_streak := p.current_streak;
  end if;

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

drop trigger if exists on_page_created on public.pages;
create trigger on_page_created
  after insert on public.pages
  for each row execute function public.handle_new_page();