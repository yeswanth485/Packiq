-- ============================================================
-- PackIQ / PackVision AI — Supabase Database Schema v2
-- ============================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- CLEAN UP LEGACY TABLES (ensures fresh schema application)
drop table if exists public.products cascade;
drop table if exists public.optimizations cascade;
drop table if exists public.box_catalog cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text,
  avatar_url           text,
  company              text,
  industry             text,
  phone                text,
  company_size         text,
  website_url          text,
  monthly_volume       integer default 1000,
  primary_carriers     text[] default '{}',
  fulfillment_type     text default 'In-House',
  warehouses_count     integer default 1,
  size_units           text default 'cm',
  materials            text[] default '{}',
  optimization_goal    text default 'void',
  sustainability_mode  boolean default false,
  onboarding_completed boolean not null default false,
  plan                 text not null default 'free'
                         check (plan in ('free', 'starter', 'growth', 'enterprise')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- 2. BOX CATALOG
-- ============================================================
create table if not exists public.box_catalog (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete cascade,
  name           text not null,
  supplier       text,
  sku            text,
  length_cm      float not null,
  width_cm       float not null,
  height_cm      float not null,
  max_weight_kg  float,
  cost_usd       float default 0,
  material       text default 'Corrugated',
  eco_certified  boolean default false,
  double_wall    boolean default false,
  in_stock       boolean default true,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- 3. OPTIMIZATIONS
-- ============================================================
create table if not exists public.optimizations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade,
  status           text not null default 'completed'
                     check (status in ('completed', 'failed', 'pending')),
  product_snapshot jsonb,   -- raw product input row
  ai_response      jsonb,   -- full engine output
  recommended_box  text,    -- box name shortcut for quick queries
  cost_savings_usd float    not null default 0,
  efficiency_score float    not null default 0,  -- 0-100
  space_utilization float   not null default 0,  -- 0-100 %
  ai_model         text,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- 4. PRODUCTS (saved product catalog)
-- ============================================================
create table if not exists public.products (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  name        text not null,
  sku         text,
  category    text not null default 'general',
  length_cm   float,
  width_cm    float,
  height_cm   float,
  weight_kg   float,
  fragility   text not null default 'low'
                check (fragility in ('low', 'medium', 'high', 'extreme')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_box_catalog_user      on public.box_catalog(user_id);
create index if not exists idx_optimizations_user    on public.optimizations(user_id, created_at desc);
create index if not exists idx_optimizations_status  on public.optimizations(status);
create index if not exists idx_products_user         on public.products(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.box_catalog   enable row level security;
alter table public.optimizations enable row level security;
alter table public.products      enable row level security;

-- Drop existing policies (safe re-run)
drop policy if exists "profiles_select"      on public.profiles;
drop policy if exists "profiles_update"      on public.profiles;
drop policy if exists "box_catalog_all"      on public.box_catalog;
drop policy if exists "optimizations_all"    on public.optimizations;
drop policy if exists "products_all"         on public.products;

-- profiles
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- box_catalog (users fully manage their own catalog)
create policy "box_catalog_all" on public.box_catalog
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- optimizations (users see/insert their own)
create policy "optimizations_all" on public.optimizations
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- products (users manage their own saved products)
create policy "products_all" on public.products
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- AUTH SYNC TRIGGER
-- Auto-creates a profile row when a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- HELPER: get user optimization summary
-- ============================================================
create or replace function get_optimization_summary(
  p_user_id uuid,
  p_days    integer default 30
)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_runs',        count(*),
    'total_savings_usd', coalesce(sum(cost_savings_usd), 0),
    'avg_efficiency',    coalesce(avg(efficiency_score), 0),
    'avg_utilization',   coalesce(avg(space_utilization), 0),
    'runs_today',        count(*) filter (
                           where created_at >= current_date
                         )
  ) into result
  from public.optimizations
  where user_id = p_user_id
    and created_at >= now() - (p_days || ' days')::interval
    and status = 'completed';
  return result;
end;
$$ language plpgsql security definer;
