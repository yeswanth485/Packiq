-- 1. Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Optimization runs table
CREATE TABLE IF NOT EXISTS optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  run_name TEXT,
  status TEXT DEFAULT 'pending',
  total_skus INTEGER DEFAULT 0,
  total_savings_inr DECIMAL(12,2) DEFAULT 0,
  avg_utilization_percent DECIMAL(5,2) DEFAULT 0,
  co2_saved_kg DECIMAL(10,3) DEFAULT 0,
  results_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Optimization results (per SKU)
CREATE TABLE IF NOT EXISTS optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES optimization_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  product_name TEXT NOT NULL,
  original_length_cm DECIMAL(8,2),
  original_width_cm DECIMAL(8,2),
  original_height_cm DECIMAL(8,2),
  original_weight_kg DECIMAL(8,3),
  fragility TEXT CHECK (fragility IN ('low','medium','high')),
  quantity INTEGER DEFAULT 1,
  optimized_length_cm DECIMAL(8,2),
  optimized_width_cm DECIMAL(8,2),
  optimized_height_cm DECIMAL(8,2),
  original_box_price_inr DECIMAL(10,2),
  optimized_box_price_inr DECIMAL(10,2),
  savings_inr DECIMAL(10,2),
  savings_percent DECIMAL(5,2),
  fragility_score INTEGER,
  optimization_score INTEGER,
  space_utilization_percent DECIMAL(5,2),
  co2_saved_kg DECIMAL(8,3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'owner',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Supabase Storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT DO NOTHING;

-- 6. RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own company" ON companies
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Users manage own runs" ON optimization_runs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage own results" ON optimization_results
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage own profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Public logo read" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');

CREATE POLICY "Auth logo upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-assets' AND auth.uid() IS NOT NULL
  );
