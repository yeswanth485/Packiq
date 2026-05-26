-- ╔═════════════════════════════════════════════════════════════════════════════╗
-- ║ Shipzi/PackIQ — Normalized Schema Migration (Canonical, Idempotent)        ║
-- ║ Ensures all structure/policies match the latest product spec               ║
-- ╚═════════════════════════════════════════════════════════════════════════════╝

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE (user profile, onboarding, account/license data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    company_name TEXT,
    industry TEXT,
    company_size TEXT,
    mobile TEXT,
    gst_number TEXT,
    website_url TEXT,
    unit_system TEXT DEFAULT 'metric',
    monthly_volume INTEGER DEFAULT 1000,
    primary_carriers TEXT[],
    fulfillment_type TEXT DEFAULT 'In-House',
    warehouses_count INTEGER DEFAULT 1,
    size_units TEXT DEFAULT 'cm',
    materials TEXT[],
    optimization_goal TEXT DEFAULT 'void',
    sustainability_mode BOOLEAN DEFAULT FALSE,
    plan TEXT DEFAULT 'starter',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. BOX CATALOG (system and user boxes)
CREATE TABLE IF NOT EXISTS public.box_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_system_box BOOLEAN DEFAULT FALSE,
    name TEXT NOT NULL,
    sku TEXT,
    length_cm DECIMAL(10,2) NOT NULL,
    width_cm DECIMAL(10,2) NOT NULL,
    height_cm DECIMAL(10,2) NOT NULL,
    max_weight_kg DECIMAL(10,2),
    cost_usd DECIMAL(10,2) DEFAULT 0.0,
    material TEXT DEFAULT 'Corrugated',
    eco_certified BOOLEAN DEFAULT FALSE,
    double_wall BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.box_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "box_own" ON public.box_catalog;
CREATE POLICY "box_own" ON public.box_catalog FOR ALL USING (is_system_box OR auth.uid() = owner_id) WITH CHECK (is_system_box OR auth.uid() = owner_id);

-- 4. OPTIMIZATION JOBS
CREATE TABLE IF NOT EXISTS public.optimization_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    input JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.optimization_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs_own" ON public.optimization_jobs;
CREATE POLICY "jobs_own" ON public.optimization_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. OPTIMIZATION RESULTS
CREATE TABLE IF NOT EXISTS public.optimization_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.optimization_jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    output JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "results_own" ON public.optimization_results;
CREATE POLICY "results_own" ON public.optimization_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. PACKAGING LABELS
CREATE TABLE IF NOT EXISTS public.packaging_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    width_cm DECIMAL(10,2) DEFAULT 0,
    length_cm DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.packaging_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "labels_own" ON public.packaging_labels;
CREATE POLICY "labels_own" ON public.packaging_labels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. ORDERS TABLE EXTENSIONS (if needed)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_result_id UUID REFERENCES public.optimization_results(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS label_id UUID REFERENCES public.packaging_labels(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS new_box_dims TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS old_box_dims TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS old_box_cost DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS new_box_cost DECIMAL(10,2);

-- 8. ENSURE TRIGGERS & NEW USER HANDLER FOR PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 9. INDEXES FOR SPEED
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON public.optimization_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user ON public.optimization_results(user_id);
CREATE INDEX IF NOT EXISTS idx_box_owner ON public.box_catalog(owner_id);

-- 10. NOTIFY POSTGREST TO RELOAD (if using postgrest)
NOTIFY pgrst, 'reload schema';

-- END OF CANONICAL MIGRATION
