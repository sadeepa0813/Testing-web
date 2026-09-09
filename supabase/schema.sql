-- ============================================================
-- Arovia Yathra — Supabase schema
-- Run this once in your project's SQL Editor (Supabase Dashboard
-- -> SQL Editor -> New query -> paste all of this -> Run).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROPERTIES (stays) ----------
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  area        text not null default '',
  price       numeric not null default 0,
  rating      numeric not null default 5,
  tag         text not null default '',
  cat         text not null default 'hill',      -- 'hill' | 'lake' | 'estate'
  photo       text not null default 'p1',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- VEHICLES ----------
create table if not exists public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       numeric not null default 0,
  icon        text not null default '🚗',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- TOUR PACKAGES ----------
create table if not exists public.tours (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  days        int not null default 1,
  description text not null default '',
  price       numeric not null default 0,
  photo       text not null default 't1',
  elevation   text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- BOOKINGS ----------
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,             -- 'stay' | 'tour' | 'vehicle' | 'custom-trip'
  item_name   text not null,
  customer    text not null,
  phone       text not null default '',
  date        text not null default '',  -- kept as text to allow blank / free-form dates
  check_out   text not null default '',
  guests      int not null default 1,
  units       int not null default 1,
  coupon      text not null default '',
  price       numeric not null default 0,
  status      text not null default 'Pending', -- 'Pending' | 'Confirmed' | 'Cancelled'
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- REVIEWS ----------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  item_name   text not null,
  author      text not null,
  rating      int not null default 5,
  text        text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- SITE SETTINGS (single row) ----------
create table if not exists public.settings (
  id          int primary key default 1,
  site_name   text not null default 'Arovia Yathra',
  phone       text not null default '+94 77 000 0000',
  currency    text not null default 'Rs.',
  constraint single_row check (id = 1)
);
insert into public.settings (id, site_name, phone, currency)
  values (1, 'Arovia Yathra', '+94 77 000 0000', 'Rs.')
  on conflict (id) do nothing;

-- ---------- ADMIN PROFILES ----------
-- One row per Supabase Auth user who is allowed into /admin.
-- Create the auth user first (Dashboard -> Authentication -> Add user),
-- then insert a matching row here with their role.
create table if not exists public.admin_profiles (
  id      uuid primary key references auth.users (id) on delete cascade,
  name    text not null default 'Admin',
  role    text not null default 'Staff',   -- 'Super Admin' | 'Staff'
  avatar  text not null default 'AD'
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (anon) visitors can read the catalog and submit bookings
-- and reviews. Only signed-in admins can write to the catalog or
-- manage bookings/reviews/settings.
-- ============================================================

alter table public.properties     enable row level security;
alter table public.vehicles       enable row level security;
alter table public.tours          enable row level security;
alter table public.bookings       enable row level security;
alter table public.reviews        enable row level security;
alter table public.settings       enable row level security;
alter table public.admin_profiles enable row level security;

-- Helper: is the current request from a logged-in admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_profiles where id = auth.uid()
  );
$$;

-- Properties / Vehicles / Tours: public read, admin write
create policy "public read properties" on public.properties for select using (true);
create policy "admin write properties" on public.properties for all
  using (public.is_admin()) with check (public.is_admin());

create policy "public read vehicles" on public.vehicles for select using (true);
create policy "admin write vehicles" on public.vehicles for all
  using (public.is_admin()) with check (public.is_admin());

create policy "public read tours" on public.tours for select using (true);
create policy "admin write tours" on public.tours for all
  using (public.is_admin()) with check (public.is_admin());

-- Bookings: anyone can create a booking request; only admins can read/update/delete
create policy "public insert bookings" on public.bookings for insert with check (true);
create policy "admin manage bookings" on public.bookings for select using (public.is_admin());
create policy "admin update bookings" on public.bookings for update
  using (public.is_admin()) with check (public.is_admin());
create policy "admin delete bookings" on public.bookings for delete using (public.is_admin());

-- Reviews: anyone can read and post a review; only admins can delete
create policy "public read reviews" on public.reviews for select using (true);
create policy "public insert reviews" on public.reviews for insert with check (true);
create policy "admin delete reviews" on public.reviews for delete using (public.is_admin());

-- Settings: public read, admin update
create policy "public read settings" on public.settings for select using (true);
create policy "admin update settings" on public.settings for update
  using (public.is_admin()) with check (public.is_admin());

-- Admin profiles: an admin can read their own row (needed to show name/role)
create policy "admin read own profile" on public.admin_profiles for select
  using (id = auth.uid());

-- ============================================================
-- SEED DATA (same demo content as the original static site)
-- Safe to re-run: only inserts if the tables are empty.
-- ============================================================
insert into public.properties (name, area, price, rating, tag, cat, photo, sort_order)
select * from (values
  ('Hill Breeze Guest House', 'Quiet hillside • 1.2 km from town', 8500, 4.8, 'Guest favorite', 'hill', 'p1', 0),
  ('Lakeview Cottage', 'Gregory Lake area • Breakfast included', 12000, 4.9, '', 'lake', 'p2', 1),
  ('Tea Garden Villa', 'Tea estate view • Family friendly', 15500, 4.7, '', 'estate', 'p3', 2),
  ('Misty Pines Bungalow', 'Forest edge • Fireplace & garden', 9800, 4.6, 'New', 'hill', 'p1', 3)
) as v(name, area, price, rating, tag, cat, photo, sort_order)
where not exists (select 1 from public.properties);

insert into public.tours (name, days, description, price, photo, elevation, sort_order)
select * from (values
  ('Little England Highlights', 1, 'Gregory Lake • Tea factory • Lover''s Leap • City', 12900, 't1', '1,868M', 0),
  ('Misty Mountains Escape', 2, 'Hakgala • Ramboda • Tea estates • Waterfalls • Sunrise', 24900, 't2', '2,524M', 1),
  ('Pidurutalagala Sunrise Trek', 1, 'Sri Lanka''s highest peak • Guided hike • Breakfast', 9500, 't1', '2,524M', 2)
) as v(name, days, description, price, photo, elevation, sort_order)
where not exists (select 1 from public.tours);

insert into public.vehicles (name, description, price, icon, sort_order)
select * from (values
  ('Car + Driver', '1–3 guests • Comfortable & private', 7500, '🚗', 0),
  ('Van + Driver', '4–10 guests • Ideal for families', 11500, '🚐', 1),
  ('Tuk Tuk + Driver', '1–2 guests • Fun, open-air local rides', 4200, '🛺', 2)
) as v(name, description, price, icon, sort_order)
where not exists (select 1 from public.vehicles);

insert into public.reviews (item_name, author, rating, text)
select * from (values
  ('Lakeview Cottage', 'Kasun P.', 5, 'Woke up to fog rolling over the lake. Breakfast was excellent and the host arranged our tea factory visit.'),
  ('Misty Mountains Escape', 'Emily R.', 5, 'Best two days of our Sri Lanka trip. The driver knew every viewpoint before the tour buses arrived.'),
  ('Hill Breeze Guest House', 'Nadeesha W.', 4, 'Simple, clean, and the hillside walk to town is lovely in the morning.')
) as v(item_name, author, rating, text)
where not exists (select 1 from public.reviews);
