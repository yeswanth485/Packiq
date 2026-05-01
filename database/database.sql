-- ============================================================
-- PackIQ — Supabase Database Schema
-- Run this in Supabase SQL Editor (project > SQL Editor > New Query)
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. PROFILES (mirrors auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  company       text,
  company_domain text,
  employee_count int,
  onboarding_completed boolean not null default false,
  plan          text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  optimizations_used      int not null default 0,
  optimizations_limit     int not null default 10,
  api_key       text unique default encode(gen_random_bytes(16), 'hex'),
  notification_prefs jsonb default '{"email_optimization": true, "weekly_report": false, "system_alerts": true}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Safely add columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_domain') THEN
    ALTER TABLE public.profiles ADD COLUMN company_domain text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='employee_count') THEN
    ALTER TABLE public.profiles ADD COLUMN employee_count int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean not null default false;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. PRODUCTS
-- ─────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  sku             text,
  weight_kg       numeric(10, 3),
  length_cm       numeric(10, 2),
  width_cm        numeric(10, 2),
  height_cm       numeric(10, 2),
  current_box_size text,
  current_cost_usd numeric(10, 4),
  fragile         boolean not null default false,
  category        text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. BOX CATALOG
-- ─────────────────────────────────────────────
create table if not exists public.box_catalog (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  supplier        text,
  sku             text unique,
  length_cm       numeric(10, 2) not null,
  width_cm        numeric(10, 2) not null,
  height_cm       numeric(10, 2) not null,
  max_weight_kg   numeric(10, 3),
  cost_usd        numeric(10, 4),
  material        text,
  eco_certified   boolean not null default false,
  in_stock        boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 4. OPTIMIZATIONS
-- ─────────────────────────────────────────────
create table if not exists public.optimizations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  box_id          uuid references public.box_catalog(id) on delete set null,
  status          text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  -- AI inputs snapshot
  product_snapshot  jsonb,
  -- AI full response
  ai_response       jsonb,
  -- Parsed key metrics
  recommended_box   text,
  efficiency_score  numeric(5, 2),   -- 0–100
  space_utilization numeric(5, 2),   -- 0–100 %
  cost_savings_usd  numeric(10, 4),
  co2_savings_kg    numeric(10, 4),
  -- Model used
  ai_model          text default 'anthropic/claude-3.5-sonnet',
  error_message     text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

-- ─────────────────────────────────────────────
-- 5. ORDERS
-- ─────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  optimization_id uuid references public.optimizations(id) on delete set null,
  box_id          uuid references public.box_catalog(id) on delete set null,
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  tracking_number text,
  carrier         text,
  quantity        int not null default 1,
  total_cost_usd  numeric(10, 4),
  destination     jsonb,   -- { address, city, country, zip }
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index if not exists idx_products_user_id        on public.products(user_id);
create index if not exists idx_optimizations_user_id   on public.optimizations(user_id);
create index if not exists idx_optimizations_product   on public.optimizations(product_id);
create index if not exists idx_orders_user_id          on public.orders(user_id);
create index if not exists idx_orders_status           on public.orders(status);
create index if not exists idx_profiles_stripe_cust    on public.profiles(stripe_customer_id);

-- ─────────────────────────────────────────────
-- TRIGGERS — updated_at
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────────
-- TRIGGER — auto-create profile on signup
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, company, plan)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'company_name',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.optimizations  enable row level security;
alter table public.orders         enable row level security;
alter table public.box_catalog    enable row level security;

-- PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- PRODUCTS
drop policy if exists "Users can view own products" on public.products;
create policy "Users can view own products"
  on public.products for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
  on public.products for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
  on public.products for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products"
  on public.products for delete using (auth.uid() = user_id);

-- OPTIMIZATIONS
drop policy if exists "Users can view own optimizations" on public.optimizations;
create policy "Users can view own optimizations"
  on public.optimizations for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own optimizations" on public.optimizations;
create policy "Users can insert own optimizations"
  on public.optimizations for insert with check (auth.uid() = user_id);

-- ORDERS
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
  on public.orders for update using (auth.uid() = user_id);

-- BOX CATALOG (public read, admin write)
drop policy if exists "Anyone can view box catalog" on public.box_catalog;
create policy "Anyone can view box catalog"
  on public.box_catalog for select using (true);

-- ─────────────────────────────────────────────
-- SEED: Box Catalog
-- ─────────────────────────────────────────────
insert into public.box_catalog (name, supplier, sku, length_cm, width_cm, height_cm, max_weight_kg, cost_usd, material, eco_certified) values
  ('Micro Box S1',    'BoxCo',    'BC-S1',  15, 10,  8,  2,    0.35, 'corrugated', false),
  ('Small Box S2',    'BoxCo',    'BC-S2',  20, 15, 10,  5,    0.55, 'corrugated', false),
  ('Medium Box M1',   'EcoPack',  'EP-M1',  30, 20, 15, 10,    0.85, 'recycled',   true),
  ('Medium Box M2',   'EcoPack',  'EP-M2',  35, 25, 20, 15,    1.10, 'recycled',   true),
  ('Large Box L1',    'ShipSafe', 'SS-L1',  45, 35, 25, 20,    1.45, 'corrugated', false),
  ('Large Box L2',    'ShipSafe', 'SS-L2',  50, 40, 30, 25,    1.80, 'corrugated', false),
  ('XL Box XL1',      'ShipSafe', 'SS-XL1', 60, 50, 40, 30,    2.50, 'heavy-duty', false),
  ('Eco Slim ES1',    'EcoPack',  'EP-ES1', 25, 20,  5,  3,    0.65, 'recycled',   true),
  ('Cube Box C1',     'BoxCo',    'BC-C1',  25, 25, 25, 12,    0.95, 'corrugated', false),
  ('Mailer M1',       'MailPro',  'MP-M1',  30, 22,  5,  2,    0.40, 'poly-mailer',false)
on conflict (sku) do nothing;
