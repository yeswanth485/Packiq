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
  plan                 text not null default 'normal'
                         check (plan in ('normal', 'pro', 'max')),
  tokens_limit         integer not null default 1000,
  tokens_used          integer not null default 0,
  token_reset_date     timestamptz not null default (now() + interval '30 days'),
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
-- 5. CLIENT CREDENTIALS
-- ============================================================
create table if not exists public.client_credentials (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  provider    text not null,  -- e.g., 'shopify', 'fedex', 'shippo'
  api_key     text,
  api_secret  text,
  is_active   boolean default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, provider)
);

-- ============================================================
-- 6. ORDERS
-- ============================================================
create table if not exists public.orders (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id) on delete cascade,
  optimization_id  uuid references public.optimizations(id) on delete set null,
  box_id           uuid references public.box_catalog(id) on delete set null,
  status           text not null default 'pending',
  quantity         integer default 1,
  total_cost_usd   float default 0,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_box_catalog_user      on public.box_catalog(user_id);
create index if not exists idx_optimizations_user    on public.optimizations(user_id, created_at desc);
create index if not exists idx_optimizations_status  on public.optimizations(status);
create index if not exists idx_products_user         on public.products(user_id);
create index if not exists idx_credentials_user      on public.client_credentials(user_id);
create index if not exists idx_orders_user           on public.orders(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.box_catalog   enable row level security;
alter table public.optimizations enable row level security;
alter table public.products      enable row level security;
alter table public.client_credentials enable row level security;
alter table public.orders        enable row level security;

-- Drop existing policies (safe re-run)
drop policy if exists "profiles_select"      on public.profiles;
drop policy if exists "profiles_update"      on public.profiles;
drop policy if exists "box_catalog_all"      on public.box_catalog;
drop policy if exists "optimizations_all"    on public.optimizations;
drop policy if exists "products_all"         on public.products;
drop policy if exists "credentials_all"      on public.client_credentials;
drop policy if exists "orders_all"           on public.orders;

-- profiles
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

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

-- credentials (users manage their own credentials)
create policy "credentials_all" on public.client_credentials
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- orders (users manage their own orders)
create policy "orders_all" on public.orders
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- AUTH SYNC TRIGGER
-- Auto-creates a profile row when a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan, tokens_limit, tokens_used, token_reset_date)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'normal',
    1000,
    0,
    now() + interval '30 days'
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    tokens_limit = 1000,
    tokens_used = 0,
    token_reset_date = now() + interval '30 days',
    updated_at = now();

  -- Seed the box catalog for the new user with 30 industry-standard sizes
  insert into public.box_catalog (user_id, name, sku, length_cm, width_cm, height_cm, max_weight_kg, cost_usd, material, eco_certified, double_wall)
  values
    (new.id, 'Premium XS Flap Enveloper', 'MLR-XS1', 15.2, 10.2, 2.0, 1.0, 0.12, 'Kraft Paper', true, false),
    (new.id, 'Document Kraft Envelope S', 'MLR-XS2', 18.0, 12.0, 2.0, 1.5, 0.15, 'Kraft Paper', true, false),
    (new.id, 'Document Kraft Envelope M', 'MLR-XS3', 20.0, 15.0, 2.5, 2.0, 0.18, 'Kraft Paper', true, false),
    (new.id, 'Eco-Bubble Mailer S', 'MLR-SM1', 22.0, 16.0, 3.0, 2.0, 0.22, 'Compostable', true, false),
    (new.id, 'Eco-Bubble Mailer M', 'MLR-SM2', 25.0, 18.0, 3.5, 3.0, 0.26, 'Compostable', true, false),
    (new.id, 'Eco-Bubble Mailer L', 'MLR-SM3', 28.0, 20.0, 4.0, 4.0, 0.30, 'Compostable', true, false),
    (new.id, 'USPS Small Flat Rate Box', 'USPS-SM', 21.9, 14.3, 4.8, 5.0, 0.35, 'Corrugated', true, false),
    (new.id, 'Micro Cube Box XS', 'BX-XSC', 10.0, 10.0, 10.0, 2.0, 0.25, 'Corrugated', true, false),
    (new.id, 'Mini Cube Box S', 'BX-SMC', 15.0, 15.0, 15.0, 4.0, 0.32, 'Corrugated', true, false),
    (new.id, 'Courier Box S1', 'BX-S1', 20.0, 15.0, 10.0, 5.0, 0.38, 'Corrugated', true, false),
    (new.id, 'Courier Box S2', 'BX-S2', 20.0, 20.0, 15.0, 6.0, 0.44, 'Corrugated', true, false),
    (new.id, 'Fulfillment Box M1', 'BX-M1', 25.0, 20.0, 15.0, 8.0, 0.48, 'Corrugated', true, false),
    (new.id, 'Fulfillment Box M2', 'BX-M2', 30.0, 20.0, 15.0, 10.0, 0.55, 'Corrugated', true, false),
    (new.id, 'Fulfillment Box M3', 'BX-M3', 30.0, 25.0, 20.0, 12.0, 0.62, 'Corrugated', true, false),
    (new.id, 'Standard Cube Box M1', 'BX-MDC1', 20.0, 20.0, 20.0, 8.0, 0.46, 'Corrugated', true, false),
    (new.id, 'Standard Cube Box M2', 'BX-MDC2', 25.0, 25.0, 25.0, 10.0, 0.58, 'Corrugated', true, false),
    (new.id, 'USPS Medium Flat Rate 1', 'USPS-MD1', 28.0, 22.0, 15.0, 8.0, 0.60, 'Corrugated', true, false),
    (new.id, 'USPS Medium Flat Rate 2', 'USPS-MD2', 35.0, 30.0, 12.0, 10.0, 0.68, 'Corrugated', true, false),
    (new.id, 'Enterprise Box L1', 'BX-L1', 35.0, 25.0, 20.0, 15.0, 0.72, 'Corrugated', true, false),
    (new.id, 'Enterprise Box L2', 'BX-L2', 35.0, 30.0, 25.0, 18.0, 0.80, 'Corrugated', true, false),
    (new.id, 'Enterprise Box L3', 'BX-L3', 40.0, 30.0, 20.0, 20.0, 0.88, 'Corrugated', true, false),
    (new.id, 'Master Cube Box L', 'BX-LGC', 30.0, 30.0, 30.0, 18.0, 0.78, 'Corrugated', true, false),
    (new.id, 'USPS Large Flat Rate Box', 'USPS-LG', 31.0, 31.0, 14.0, 15.0, 0.75, 'Corrugated', true, false),
    (new.id, 'FedEx Standard Large Box', 'FDX-LG', 45.0, 35.0, 25.0, 25.0, 1.05, 'Corrugated', true, false),
    (new.id, 'Master Box XL1', 'BX-XL1', 45.0, 40.0, 30.0, 30.0, 1.25, 'Corrugated', true, false),
    (new.id, 'Master Box XL2', 'BX-XL2', 50.0, 40.0, 30.0, 35.0, 1.45, 'Corrugated', true, false),
    (new.id, 'Industrial Cube Box XL', 'BX-XLC', 40.0, 40.0, 40.0, 35.0, 1.38, 'Corrugated', true, false),
    (new.id, 'Heavy Duty DW Double-Wall S', 'DW-S1', 30.0, 25.0, 20.0, 25.0, 1.10, 'Corrugated', false, true),
    (new.id, 'Heavy Duty DW Double-Wall M', 'DW-M1', 40.0, 40.0, 30.0, 40.0, 1.65, 'Corrugated', false, true),
    (new.id, 'Heavy Duty DW Double-Wall L', 'DW-L1', 50.0, 50.0, 40.0, 50.0, 2.25, 'Corrugated', false, true)
  on conflict do nothing;

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

-- ============================================================
-- HELPER: update user plan and token limits
-- ============================================================
create or replace function public.change_user_plan(new_plan text)
returns void as $$
declare
  v_tokens_limit integer;
begin
  if new_plan = 'normal' then
    v_tokens_limit := 1000;
  elsif new_plan = 'pro' then
    v_tokens_limit := 10000;
  elsif new_plan = 'max' then
    v_tokens_limit := 1000000;
  else
    raise exception 'Invalid plan type';
  end if;

  update public.profiles
  set 
    plan = new_plan,
    tokens_limit = v_tokens_limit,
    token_reset_date = now() + interval '30 days'
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- ============================================================
-- HELPER: sync user tokens (resets if past reset date)
-- ============================================================
create or replace function public.sync_user_tokens()
returns void as $$
begin
  update public.profiles
  set 
    tokens_used = 0,
    token_reset_date = now() + interval '30 days'
  where id = auth.uid()
    and now() > token_reset_date;
end;
$$ language plpgsql security definer;
