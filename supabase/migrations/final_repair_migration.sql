-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PackIQ — FINAL SYSTEM REPAIR & SCHEMA CONSOLIDATION                       ║
-- ║  Run this in Supabase SQL Editor to ensure everything works perfectly      ║
-- ╚═══════════════════════════════════════════════════════════════════════════════

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE CONSOLIDATION
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fragility_level TEXT DEFAULT 'low';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
-- Ensure uniqueness for SKUs per user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_user_id_sku_key') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_user_id_sku_key UNIQUE (user_id, sku);
    END IF;
END $$;

-- 3. ORDERS TABLE REPAIR
-- Add all columns used by the frontend and API
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_result_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_session_id UUID;
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 4. RELATIONSHIP ESTABLISHMENT
-- This is critical for the "Relationship not found" error
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_product_id_fkey'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 5. OPTIMIZATION RESULTS TABLE SYNC
ALTER TABLE public.optimization_results ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE public.optimization_results ADD COLUMN IF NOT EXISTS carrier TEXT DEFAULT 'Standard';
ALTER TABLE public.optimization_results ADD COLUMN IF NOT EXISTS fragility_level TEXT DEFAULT 'Low';

-- 6. RLS POLICIES (Safety First)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_own" ON public.orders;
CREATE POLICY "orders_own" ON public.orders FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_own" ON public.products;
CREATE POLICY "products_own" ON public.products FOR ALL USING (auth.uid() = user_id);

-- 7. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
