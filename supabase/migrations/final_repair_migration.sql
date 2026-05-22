-- ═══════════════════════════════════════════════════════════════════════════════
-- FINAL SYSTEM REPAIR MIGRATION v2
--
-- Purpose:
-- 1. Ensure all tables are correctly defined for the denormalized architecture
-- 2. Fix relationship between orders and products
-- 3. Add all missing columns for shipments and orders
-- 4. Fix RLS and indexes
-- ═══════════════════════════════════════════════════════════════════════════════

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Ensure all columns exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    company_name TEXT,
    industry TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Master
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sku TEXT NOT NULL,
    name TEXT,
    length_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    weight_kg DECIMAL(10,2),
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sku)
);

-- 3. Box Catalog
CREATE TABLE IF NOT EXISTS public.box_catalog (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    length_cm DECIMAL(10,2) NOT NULL,
    width_cm DECIMAL(10,2) NOT NULL,
    height_cm DECIMAL(10,2) NOT NULL,
    weight_limit_kg DECIMAL(10,2) DEFAULT 30,
    cost DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Optimization Sessions
CREATE TABLE IF NOT EXISTS public.optimization_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT,
    total_items INTEGER DEFAULT 0,
    optimized_items INTEGER DEFAULT 0,
    unoptimized_items INTEGER DEFAULT 0,
    optimization_rate DECIMAL(5,2) DEFAULT 0,
    estimated_savings DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 5. Optimization Results
CREATE TABLE IF NOT EXISTS public.optimization_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.optimization_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    length_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    weight_kg DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    is_optimized BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    old_box_name TEXT,
    old_box_dims TEXT,
    old_box_cost DECIMAL(10,2),
    new_box_id UUID,
    new_box_name TEXT,
    new_box_dims TEXT,
    new_box_cost DECIMAL(10,2),
    new_box_length_cm DECIMAL(10,2),
    new_box_width_cm DECIMAL(10,2),
    new_box_height_cm DECIMAL(10,2),
    ml_score DECIMAL(8,4),
    void_percentage DECIMAL(5,2),
    volume_utilization DECIMAL(5,2),
    savings_pct DECIMAL(5,2),
    savings_amount DECIMAL(10,2),
    recommendation_reason TEXT,
    fragility_level TEXT,
    tracking_id TEXT,
    carrier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders (Full fix)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    optimization_result_id UUID REFERENCES public.optimization_results(id) ON DELETE SET NULL,
    optimization_session_id UUID REFERENCES public.optimization_sessions(id) ON DELETE SET NULL,
    sku TEXT,
    product_name TEXT,
    length_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    weight_kg DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    total_cost DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending',
    tracking_number TEXT,
    carrier TEXT,
    fragility_level TEXT,
    product_snapshot JSONB,
    box_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing orders table if needed
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS length_cm DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS width_cm DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS height_cm DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fragility_level TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;

-- 7. Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    optimization_result_id UUID REFERENCES public.optimization_results(id) ON DELETE SET NULL,
    recipient JSONB,
    carrier TEXT,
    tracking_id TEXT,
    status TEXT DEFAULT 'prepared',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.box_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
    CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

    DROP POLICY IF EXISTS "products_own" ON public.products;
    CREATE POLICY "products_own" ON public.products FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "box_catalog_own" ON public.box_catalog;
    CREATE POLICY "box_catalog_own" ON public.box_catalog FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "sessions_own" ON public.optimization_sessions;
    CREATE POLICY "sessions_own" ON public.optimization_sessions FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "results_own" ON public.optimization_results;
    CREATE POLICY "results_own" ON public.optimization_results FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "orders_own" ON public.orders;
    CREATE POLICY "orders_own" ON public.orders FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "shipments_own" ON public.shipments;
    CREATE POLICY "shipments_own" ON public.shipments FOR ALL USING (auth.uid() = user_id);
END $$;

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON public.orders(optimization_session_id);
CREATE INDEX IF NOT EXISTS idx_results_session ON public.optimization_results(session_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(user_id, sku);
