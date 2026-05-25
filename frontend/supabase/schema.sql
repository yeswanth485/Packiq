-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PackIQ — Complete Supabase Schema (Run from scratch)                       ║
-- ║  Run this in Supabase SQL Editor → New Query → Paste → Run                  ║
-- ║  This is SAFE to run on a fresh project or existing project.                ║
-- ╚═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0. CLEANUP — Drop existing functions to avoid "cannot change return type" errors
-- ═══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS get_optimization_summary(UUID, INT);
DROP FUNCTION IF EXISTS get_optimization_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_line_summary(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES — Core user profile (linked to Supabase Auth via auth.users.id)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0B. COMPANIES — Company information
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name      TEXT NOT NULL,
  industry          TEXT,
  address           TEXT,
  phone             TEXT,
  website           TEXT,
  logo_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own company" ON companies;
CREATE POLICY "Users manage own company" ON companies FOR ALL USING (owner_user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES — Core user profile (linked to Supabase Auth via auth.users.id)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT,
  full_name             TEXT,
  company_id            UUID REFERENCES companies(id) ON DELETE SET NULL,
  role                  TEXT DEFAULT 'owner',
  company_name          TEXT,
  industry              TEXT,
  company_size          TEXT,
  mobile                TEXT,
  gst_number            TEXT,
  website_url           TEXT,
  company_website       TEXT,
  unit_system            TEXT DEFAULT 'metric',
  monthly_volume        INTEGER DEFAULT 1000,
  primary_carriers      TEXT[] DEFAULT '{}',
  fulfillment_type      TEXT DEFAULT 'In-House',
  warehouses_count      INTEGER DEFAULT 1,
  size_units            TEXT DEFAULT 'cm',
  materials             TEXT[] DEFAULT '{}',
  optimization_goal     TEXT DEFAULT 'void',
  sustainability_mode   BOOLEAN DEFAULT FALSE,
  plan                  TEXT DEFAULT 'starter',
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  optimizations_limit   INTEGER,
  notification_prefs    JSONB DEFAULT '{}',
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Add any columns that might be missing on existing tables (idempotent)
DO $$
BEGIN
  -- Each block tries to add a column; if it already exists the exception is caught and ignored.
  BEGIN ALTER TABLE user_profiles ADD COLUMN full_name TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN company_name TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN industry TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN company_size TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN mobile TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN gst_number TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN website_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN company_website TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN unit_system TEXT DEFAULT 'metric'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN monthly_volume INTEGER DEFAULT 1000; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN primary_carriers TEXT[] DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN fulfillment_type TEXT DEFAULT 'In-House'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN warehouses_count INTEGER DEFAULT 1; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN size_units TEXT DEFAULT 'cm'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN materials TEXT[] DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN optimization_goal TEXT DEFAULT 'void'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN sustainability_mode BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN plan TEXT DEFAULT 'starter'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN stripe_subscription_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN optimizations_limit INTEGER; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN notification_prefs JSONB DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "profiles_own" ON user_profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON user_profiles;

CREATE POLICY "Users manage own profile" ON user_profiles FOR ALL USING (auth.uid() = id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. BOX CATALOG — Standard shipping box sizes per user
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS box_catalog (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sku             TEXT,
  length_cm       DECIMAL NOT NULL DEFAULT 0 CHECK (length_cm > 0),  -- 🔴 BUG #5 FIX: Validate > 0
  width_cm        DECIMAL NOT NULL DEFAULT 0 CHECK (width_cm > 0),   -- 🔴 BUG #5 FIX: Validate > 0
  height_cm       DECIMAL NOT NULL DEFAULT 0 CHECK (height_cm > 0),  -- 🔴 BUG #5 FIX: Validate > 0
  max_weight_kg   DECIMAL DEFAULT 30 CHECK (max_weight_kg > 0),      -- 🔴 BUG #5 FIX: Validate > 0
  weight_limit_kg DECIMAL DEFAULT 30 CHECK (weight_limit_kg > 0),    -- 🔴 BUG #5 FIX: Validate > 0
  cost_usd        DECIMAL DEFAULT 0 CHECK (cost_usd >= 0),           -- Allow 0, but not negative
  cost            DECIMAL DEFAULT 0 CHECK (cost >= 0),               -- Allow 0, but not negative
  material        TEXT DEFAULT 'Corrugated',
  eco_certified   BOOLEAN DEFAULT FALSE,
  double_wall     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  BEGIN ALTER TABLE box_catalog ADD COLUMN weight_limit_kg DECIMAL DEFAULT 30; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE box_catalog ADD COLUMN cost DECIMAL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE box_catalog ADD COLUMN eco_certified BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE box_catalog ADD COLUMN double_wall BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  -- 🔴 BUG #5 FIX: Add constraints to existing table (idempotent via conditional)
  BEGIN
    ALTER TABLE box_catalog ADD CONSTRAINT box_length_positive CHECK (length_cm > 0);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
  BEGIN
    ALTER TABLE box_catalog ADD CONSTRAINT box_width_positive CHECK (width_cm > 0);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
  BEGIN
    ALTER TABLE box_catalog ADD CONSTRAINT box_height_positive CHECK (height_cm > 0);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
  BEGIN
    ALTER TABLE box_catalog ADD CONSTRAINT box_weight_positive CHECK (max_weight_kg > 0);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END $$;

ALTER TABLE box_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own box catalog" ON box_catalog;
CREATE POLICY "Users manage own box catalog" ON box_catalog FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PRODUCTS — Uploaded product data from CSV / manual entry
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sku         TEXT,
  weight_kg   DECIMAL,
  length_cm   DECIMAL,
  width_cm    DECIMAL,
  height_cm   DECIMAL,
  fragile     BOOLEAN DEFAULT FALSE,
  fragility_level TEXT DEFAULT 'low',
  category    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sku)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own products" ON products;
CREATE POLICY "Users manage own products" ON products FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. OPTIMIZATION SESSIONS & RESULTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS optimization_sessions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name         TEXT,
  file_size_bytes   INTEGER,
  total_items       INTEGER DEFAULT 0,
  optimized_items   INTEGER DEFAULT 0,
  unoptimized_items INTEGER DEFAULT 0,
  optimization_rate DECIMAL(5,2) DEFAULT 0,
  estimated_savings DECIMAL(12,2) DEFAULT 0,
  currency          TEXT DEFAULT 'INR',
  high_risk_count   INTEGER DEFAULT 0,
  medium_risk_count INTEGER DEFAULT 0,
  low_risk_count    INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'completed',
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

ALTER TABLE optimization_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_own" ON optimization_sessions;
CREATE POLICY "sessions_own" ON optimization_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS optimization_results (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id               UUID REFERENCES optimization_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sku                      TEXT NOT NULL,
  product_name             TEXT,
  length_cm                DECIMAL(10,2),
  width_cm                 DECIMAL(10,2),
  height_cm                DECIMAL(10,2),
  weight_kg                DECIMAL(10,2),
  quantity                 INTEGER DEFAULT 1,
  is_optimized             BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason           TEXT,
  old_box_name             TEXT,
  old_box_dims             TEXT,
  old_box_cost             DECIMAL(10,2),
  new_box_id               UUID,
  new_box_name             TEXT,
  new_box_dims             TEXT,
  new_box_cost             DECIMAL(10,2),
  new_box_length_cm        DECIMAL(10,2),
  new_box_width_cm         DECIMAL(10,2),
  new_box_height_cm        DECIMAL(10,2),
  ml_score                 DECIMAL(8,4),
  void_percentage          DECIMAL(5,2),
  volume_utilization       DECIMAL(5,2),
  savings_pct              DECIMAL(5,2),
  savings_amount           DECIMAL(10,2),
  recommendation_reason    TEXT,
  score_breakdown          JSONB,
  orientation              JSONB,
  alternatives             JSONB,
  fragility_score          INTEGER DEFAULT 0,
  fragility_level          TEXT DEFAULT 'Low',
  fragility_label          TEXT,
  fragility_recommendation TEXT,
  zone                     TEXT,
  tracking_id              TEXT,
  carrier                  TEXT DEFAULT 'Standard',
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "results_own" ON optimization_results;
CREATE POLICY "results_own" ON optimization_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. ORDERS — Order records linked to products and optimizations
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id                UUID REFERENCES products(id) ON DELETE SET NULL,
  optimization_result_id    UUID REFERENCES optimization_results(id) ON DELETE SET NULL,
  optimization_session_id   UUID REFERENCES optimization_sessions(id) ON DELETE SET NULL,
  sku                       TEXT,
  product_name              TEXT,
  length_cm                 DECIMAL(10,2),
  width_cm                  DECIMAL(10,2),
  height_cm                 DECIMAL(10,2),
  weight_kg                 DECIMAL(10,2),
  fragility_level           TEXT,
  tracking_number           TEXT,
  carrier                   TEXT,
  product_snapshot          JSONB,
  box_snapshot              JSONB,
  quantity                  INTEGER DEFAULT 1,
  total_cost                DECIMAL(12,2) DEFAULT 0,
  currency                  TEXT DEFAULT 'INR',
  status                    TEXT DEFAULT 'pending',
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_own" ON orders;
CREATE POLICY "orders_own" ON orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_opt_result ON orders(optimization_result_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6A. SHIPMENTS — Shipment tracking and print events
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shipments (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id                  UUID REFERENCES orders(id) ON DELETE CASCADE,
  optimization_result_id    UUID REFERENCES optimization_results(id) ON DELETE SET NULL,
  recipient                 JSONB,
  carrier                   TEXT,
  tracking_id               TEXT,
  status                    TEXT DEFAULT 'prepared',
  printed_at                TIMESTAMPTZ,
  shipped_at                TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipments_own" ON shipments;
CREATE POLICY "shipments_own" ON shipments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_id);

-- 🔴 BUG #9 FIX: Add missing indexes for performance optimization
-- Optimization sessions indexes
CREATE INDEX IF NOT EXISTS idx_opt_sessions_user ON optimization_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_sessions_status ON optimization_sessions(user_id, status);

-- Optimization results indexes
CREATE INDEX IF NOT EXISTS idx_opt_results_user ON optimization_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_results_session ON optimization_results(session_id);
CREATE INDEX IF NOT EXISTS idx_opt_results_sku ON optimization_results(user_id, sku);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_user_sku ON products(user_id, sku);

-- Box catalog indexes
CREATE INDEX IF NOT EXISTS idx_box_catalog_user ON box_catalog(user_id);

-- Orders status filter index
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. FUNCTIONS — Dashboard helper RPCs
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-create profile + subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO public.user_profiles (id, full_name, email, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into subscriptions
  INSERT INTO public.subscriptions (
    user_id, plan, monthly_limit, used_this_month,
    billing_period_start, billing_period_end
  )
  VALUES (NEW.id, 'starter', 1000, 0, NOW(), NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10b. get_optimization_summary: Used by the main dashboard to show 30-day KPIs
CREATE OR REPLACE FUNCTION get_optimization_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_runs',       COUNT(*),
    'total_savings_usd', COALESCE(SUM(cost_savings_usd), 0),
    'avg_efficiency',   COALESCE(AVG(efficiency_score), 0),
    'runs_today',       COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)
  ) INTO result
  FROM optimizations
  WHERE user_id = p_user_id
    AND created_at >= (NOW() - (p_days || ' days')::INTERVAL)
    AND status = 'completed';

  RETURN result;
END;
$$;


-- 10c. get_line_summary: Used by the inspections summary endpoint
CREATE OR REPLACE FUNCTION get_line_summary(p_line_id TEXT, p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_inspections', COUNT(*),
    'passed',            COUNT(*) FILTER (WHERE status = 'pass'),
    'failed',            COUNT(*) FILTER (WHERE status = 'fail'),
    'avg_confidence',    COALESCE(AVG(confidence_score), 0),
    'defect_types',      COALESCE(
                           (SELECT json_agg(DISTINCT defect_type)
                            FROM inspections
                            WHERE line_id = p_line_id
                              AND defect_type IS NOT NULL
                              AND created_at BETWEEN p_from AND p_to),
                           '[]'::json
                         )
  ) INTO result
  FROM inspections
  WHERE line_id = p_line_id
    AND created_at BETWEEN p_from AND p_to;

  RETURN result;
END;
$$;

-- 10d. Trigger for auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. STORAGE — Setup buckets
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public logo read" ON storage.objects;
CREATE POLICY "Public logo read" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');

DROP POLICY IF EXISTS "Auth logo upload" ON storage.objects;
CREATE POLICY "Auth logo upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-assets' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Auth logo delete" ON storage.objects;
CREATE POLICY "Auth logo delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-assets' AND auth.uid() IS NOT NULL
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! All tables, policies, and functions are now created.
-- ═══════════════════════════════════════════════════════════════════════════════
