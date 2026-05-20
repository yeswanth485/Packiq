-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PackIQ — Complete Supabase Schema (Run from scratch)                       ║
-- ║  Run this in Supabase SQL Editor → New Query → Paste → Run                  ║
-- ║  This is SAFE to run on a fresh project or existing project.                ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0. CLEANUP — Drop existing functions to avoid "cannot change return type" errors
-- ═══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS get_optimization_summary(UUID, INT);
DROP FUNCTION IF EXISTS get_optimization_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_line_summary(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES — Core user profile (linked to Supabase Auth via auth.users.id)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT,
  full_name             TEXT,
  company               TEXT,
  industry              TEXT,
  company_size          TEXT,
  mobile                TEXT,
  gst_number            TEXT,
  website_url           TEXT,
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
  notification_prefs    JSONB DEFAULT '{}',
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Add any columns that might be missing on existing tables (idempotent)
DO $$
BEGIN
  -- Each block tries to add a column; if it already exists the exception is caught and ignored.
  BEGIN ALTER TABLE profiles ADD COLUMN full_name TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN company TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN industry TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN company_size TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN mobile TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN gst_number TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN website_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN unit_system TEXT DEFAULT 'metric'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN monthly_volume INTEGER DEFAULT 1000; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN primary_carriers TEXT[] DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN fulfillment_type TEXT DEFAULT 'In-House'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN warehouses_count INTEGER DEFAULT 1; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN size_units TEXT DEFAULT 'cm'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN materials TEXT[] DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN optimization_goal TEXT DEFAULT 'void'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN sustainability_mode BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'starter'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN notification_prefs JSONB DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. BOX CATALOG — Standard shipping box sizes per user
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS box_catalog (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sku             TEXT,
  length_cm       DECIMAL NOT NULL DEFAULT 0,
  width_cm        DECIMAL NOT NULL DEFAULT 0,
  height_cm       DECIMAL NOT NULL DEFAULT 0,
  max_weight_kg   DECIMAL DEFAULT 30,
  weight_limit_kg DECIMAL DEFAULT 30,
  cost_usd        DECIMAL DEFAULT 0,
  cost            DECIMAL DEFAULT 0,
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
  category    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own products" ON products;
CREATE POLICY "Users manage own products" ON products FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. OPTIMIZATIONS — Each optimization run result
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS optimizations (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id          UUID,
  batch_id            UUID,
  file_name           TEXT,
  status              TEXT DEFAULT 'pending',
  product_snapshot    JSONB,
  ai_response         JSONB,
  recommended_box     TEXT,
  cost_savings_usd    DECIMAL DEFAULT 0,
  efficiency_score    DECIMAL DEFAULT 0,
  space_utilization   DECIMAL DEFAULT 0,
  co2_savings_kg      DECIMAL DEFAULT 0,
  ai_model            TEXT DEFAULT 'PackVision Heuristic v2.0',
  total_items         INTEGER DEFAULT 0,
  optimized_items     INTEGER DEFAULT 0,
  unoptimized_items   INTEGER DEFAULT 0,
  optimization_rate   DECIMAL DEFAULT 0,
  estimated_savings   DECIMAL DEFAULT 0,
  results             JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  BEGIN ALTER TABLE optimizations ADD COLUMN batch_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN file_name TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN co2_savings_kg DECIMAL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN total_items INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN optimized_items INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN unoptimized_items INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN optimization_rate DECIMAL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN estimated_savings DECIMAL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimizations ADD COLUMN results JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

ALTER TABLE optimizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own optimizations" ON optimizations;
CREATE POLICY "Users manage own optimizations" ON optimizations FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. OPTIMIZATION RESULTS — Aggregated batch-level summaries
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS optimization_results (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id                UUID,
  file_name               TEXT,
  total_items             INTEGER DEFAULT 0,
  optimized_items         INTEGER DEFAULT 0,
  failed_items            INTEGER DEFAULT 0,
  total_savings_usd       DECIMAL DEFAULT 0,
  avg_efficiency_percent  DECIMAL DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own optimization results" ON optimization_results;
CREATE POLICY "Users manage own optimization results" ON optimization_results FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. ORDERS — Order records linked to products and optimizations
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id        UUID,
  optimization_id   UUID,
  box_id            UUID,
  status            TEXT DEFAULT 'pending',
  quantity          INTEGER DEFAULT 1,
  total_cost_usd    DECIMAL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own orders" ON orders;
CREATE POLICY "Users manage own orders" ON orders FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. INSPECTIONS — Quality inspection data (IoT / AI vision)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inspections (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id           TEXT NOT NULL,
  unit_id           TEXT NOT NULL,
  defect_type       TEXT,
  confidence_score  DECIMAL,
  status            TEXT NOT NULL DEFAULT 'pass',
  image_url         TEXT,
  model_version     TEXT DEFAULT 'v1.0',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access inspections" ON inspections;
CREATE POLICY "Service role full access inspections" ON inspections FOR ALL USING (TRUE);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. AI ANALYSES — Stored AI analysis results
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_analyses (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id           TEXT,
  model_used        TEXT,
  summary           TEXT,
  anomalies         TEXT[],
  recommendations   TEXT[],
  health_score      INTEGER DEFAULT 50,
  raw_response      JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access ai_analyses" ON ai_analyses;
CREATE POLICY "Service role full access ai_analyses" ON ai_analyses FOR ALL USING (TRUE);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. ALERT CONFIGS — User-configurable alert thresholds per production line
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS alert_configs (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id                   TEXT NOT NULL UNIQUE,
  rejection_rate_threshold  DECIMAL DEFAULT 0.03,
  confidence_threshold      DECIMAL DEFAULT 0.70,
  alert_email               TEXT,
  alert_webhook_url         TEXT,
  is_active                 BOOLEAN DEFAULT TRUE,
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access alert_configs" ON alert_configs;
CREATE POLICY "Service role full access alert_configs" ON alert_configs FOR ALL USING (TRUE);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. FUNCTIONS — Dashboard helper RPCs
-- ═══════════════════════════════════════════════════════════════════════════════

-- 10a. get_optimization_summary: Used by the main dashboard to show 30-day KPIs
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


-- 10b. get_line_summary: Used by the inspections summary endpoint
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


-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. STORAGE BUCKETS (optional — uncomment if you need file uploads via storage)
-- ═══════════════════════════════════════════════════════════════════════════════

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('uploads', 'uploads', false)
-- ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. GOOGLE AUTH — Ensure Google OAuth provider is enabled
-- ═══════════════════════════════════════════════════════════════════════════════
-- Google OAuth is configured in the Supabase Dashboard:
--   Authentication → Providers → Google → Enable
--   Set Client ID and Client Secret from Google Cloud Console
--   Redirect URL: https://<your-project>.supabase.co/auth/v1/callback
--
-- Email/Password Auth is configured in the Supabase Dashboard:
--   Authentication → Providers → Email → Enable
--   Confirm email: Enabled (or Disabled for dev)


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! All tables, policies, and functions are now created.
-- ═══════════════════════════════════════════════════════════════════════════════
