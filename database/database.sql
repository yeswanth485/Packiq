-- ============================================================
-- PackIQ — Supabase Database Schema
-- ============================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  company       text,
  industry      text,
  line_speed_range text,
  current_qa_method text,
  phone         text,
  onboarding_completed boolean not null default false,
  plan          text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. PRODUCTION LINES
create table if not exists public.production_lines (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references public.profiles(id) on delete cascade,
  name            text not null,
  location        text,
  product_type    text,
  target_speed_per_min integer,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- 3. INSPECTIONS
create table if not exists public.inspections (
  id              uuid primary key default uuid_generate_v4(),
  line_id         uuid references public.production_lines(id) on delete cascade,
  unit_id         text not null,
  defect_type     text, -- null if passed
  confidence_score float check (confidence_score >= 0 and confidence_score <= 1),
  status          text check (status in ('passed', 'rejected', 'flagged')),
  image_url       text,
  model_version   text,
  timestamp       timestamptz default now(),
  created_at      timestamptz default now()
);

-- 4. REVIEW QUEUE
create table if not exists public.review_queue (
  id              uuid primary key default uuid_generate_v4(),
  inspection_id   uuid references public.inspections(id) on delete cascade,
  line_id         uuid references public.production_lines(id) on delete cascade,
  reason          text,
  reviewed_by     uuid references public.profiles(id),
  review_decision text check (review_decision in ('confirmed_defect', 'false_positive', 'pending')),
  reviewed_at     timestamptz,
  created_at      timestamptz default now()
);

-- 5. AI ANALYSES
create table if not exists public.ai_analyses (
  id              uuid primary key default uuid_generate_v4(),
  line_id         uuid references public.production_lines(id) on delete cascade,
  model_used      text check (model_used in ('claude', 'openai')),
  period_from     timestamptz,
  period_to       timestamptz,
  summary         text,
  anomalies       jsonb,
  recommendations jsonb,
  health_score    integer check (health_score >= 0 and health_score <= 100),
  raw_response    jsonb,
  latency_ms      integer,
  created_at      timestamptz default now()
);

-- 6. ALERT CONFIGS
create table if not exists public.alert_configs (
  id              uuid primary key default uuid_generate_v4(),
  line_id         uuid references public.production_lines(id) on delete cascade,
  rejection_rate_threshold float default 0.03,
  confidence_threshold float default 0.70,
  alert_email     text,
  alert_webhook_url text,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- 7. ALERT HISTORY
create table if not exists public.alert_history (
  id              uuid primary key default uuid_generate_v4(),
  line_id         uuid references public.production_lines(id) on delete cascade,
  alert_type      text,
  message         text,
  triggered_at    timestamptz default now(),
  acknowledged    boolean default false,
  acknowledged_by uuid references public.profiles(id),
  created_at      timestamptz default now()
);

-- INDEXES
create index if not exists idx_inspections_line_timestamp on public.inspections(line_id, timestamp desc);
create index if not exists idx_inspections_status on public.inspections(status);

-- RLS
alter table public.profiles enable row level security;
alter table public.production_lines enable row level security;
alter table public.inspections enable row level security;
alter table public.review_queue enable row level security;
alter table public.ai_analyses enable row level security;

drop policy if exists "Users can view own profile"     on public.profiles;
drop policy if exists "Users can update own profile"   on public.profiles;
drop policy if exists "Users can view own lines"        on public.production_lines;
drop policy if exists "Users can view own inspections"  on public.inspections;
drop policy if exists "Users can view own analyses"     on public.ai_analyses;

create policy "Users can view own profile"     on public.profiles      for select using (auth.uid() = id);
create policy "Users can update own profile"   on public.profiles      for update using (auth.uid() = id);
create policy "Users can view own lines"        on public.production_lines for select using (auth.uid() = owner_id);
create policy "Users can view own inspections"  on public.inspections   for select using (
  exists (select 1 from public.production_lines where id = line_id and owner_id = auth.uid())
);
create policy "Users can view own analyses"     on public.ai_analyses   for select using (
  exists (select 1 from public.production_lines where id = line_id and owner_id = auth.uid())
);

-- RPC: Get Line Summary
create or replace function get_line_summary(p_line_id uuid, p_from timestamptz, p_to timestamptz)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_units', count(*),
    'total_defects', count(*) filter (where status = 'rejected'),
    'defect_rate', count(*) filter (where status = 'rejected')::float / nullif(count(*), 0),
    'avg_confidence', avg(confidence_score)
  ) into result
  from public.inspections
  where line_id = p_line_id and timestamp between p_from and p_to;
  return result;
end;
$$ language plpgsql security definer;

-- Trigger: On new inspection
-- (Simplified for demo)
create or replace function notify_inspection() returns trigger as $$
begin
  perform pg_notify('inspections', row_to_json(new)::text);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_inspection on public.inspections;

create trigger trg_notify_inspection
after insert on public.inspections
for each row execute function notify_inspection();

-- 8. AUTH SYNC TRIGGER
-- Automatically creates a profile when a new user signs up
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
