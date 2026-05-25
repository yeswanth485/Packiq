-- ═══════════════════════════════════════════════════════════════════════════════
-- PackIQ Comprehensive Database Fix
-- This migration ensures all tables have the necessary columns for the application
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. FIX PROFILES TABLE
-- Ensure onboarding_complete and company fields exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_website TEXT; -- Some code uses this instead
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_system TEXT DEFAULT 'metric';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_volume INTEGER DEFAULT 1000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_carriers TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'In-House';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS warehouses_count INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS size_units TEXT DEFAULT 'cm';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS materials TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS optimization_goal TEXT DEFAULT 'void';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sustainability_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';

-- Handle some naming inconsistencies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
        UPDATE public.profiles SET company_name = company WHERE company_name IS NULL AND company IS NOT NULL;
    END IF;
END $$;

-- 2. FIX ORDERS TABLE
-- Add missing columns being used in API and Frontend
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_result_id UUID REFERENCES public.optimization_results(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_session_id UUID REFERENCES public.optimization_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS length_cm DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS width_cm DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS height_cm DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fragility_level TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_snapshot JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS box_snapshot JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. FIX SHIPMENTS TABLE
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS optimization_result_id UUID REFERENCES public.optimization_results(id) ON DELETE SET NULL;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS recipient JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prepared';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 4. ENSURE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_sku ON public.orders(sku);
CREATE INDEX IF NOT EXISTS idx_results_session ON public.optimization_results(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.optimization_sessions(user_id);

-- 5. RE-APPLY RLS POLICIES (Ensuring they use auth.uid())
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_own" ON public.orders;
CREATE POLICY "orders_own" ON public.orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. ENSURE HANDLE NEW USER TRIGGER IS CORRECT
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

  INSERT INTO public.subscriptions (
    user_id, plan, monthly_limit, used_this_month,
    billing_period_start, billing_period_end
  )
  VALUES (NEW.id, 'starter', 500, 0, NOW(), NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ADD TRIGGER FOR NEW USER
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
