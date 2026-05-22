-- ═══════════════════════════════════════════════════════════════════════════════
-- FINAL SYSTEM REPAIR MIGRATION
--
-- Purpose:
-- 1. Fix relationship between orders and products
-- 2. Ensure all snapshot columns exist for denormalization
-- 3. Fix RLS policies for all tables
-- 4. Add missing indexes for performance
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure products table has a proper unique constraint for SKU per user
-- (required for upserts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_user_id_sku_key') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_user_id_sku_key UNIQUE (user_id, sku);
    END IF;
END $$;

-- 2. Fix orders table schema
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_result_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS optimization_session_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_snapshot JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS box_snapshot JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;

-- 3. Add Foreign Keys safely
DO $$
BEGIN
    -- FK to products
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_product') THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_product
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;

    -- FK to optimization_results
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_optimization_result') THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_optimization_result
        FOREIGN KEY (optimization_result_id) REFERENCES public.optimization_results(id) ON DELETE SET NULL;
    END IF;

    -- FK to optimization_sessions
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_optimization_session') THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_optimization_session
        FOREIGN KEY (optimization_session_id) REFERENCES public.optimization_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Fix shipments table schema
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS optimization_result_id UUID;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS recipient JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prepared';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_opt_session ON public.orders(optimization_session_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_id);

-- 6. Ensure RLS is enabled and policies are correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.box_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;

-- Profiles Policy
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Products Policy
DROP POLICY IF EXISTS "products_own" ON public.products;
CREATE POLICY "products_own" ON public.products FOR ALL USING (auth.uid() = user_id);

-- Box Catalog Policy
DROP POLICY IF EXISTS "box_catalog_own" ON public.box_catalog;
CREATE POLICY "box_catalog_own" ON public.box_catalog FOR ALL USING (auth.uid() = user_id);

-- Orders Policy
DROP POLICY IF EXISTS "orders_own" ON public.orders;
CREATE POLICY "orders_own" ON public.orders FOR ALL USING (auth.uid() = user_id);

-- Shipments Policy
DROP POLICY IF EXISTS "shipments_own" ON public.shipments;
CREATE POLICY "shipments_own" ON public.shipments FOR ALL USING (auth.uid() = user_id);

-- Sessions Policy
DROP POLICY IF EXISTS "sessions_own" ON public.optimization_sessions;
CREATE POLICY "sessions_own" ON public.optimization_sessions FOR ALL USING (auth.uid() = user_id);

-- Results Policy
DROP POLICY IF EXISTS "results_own" ON public.optimization_results;
CREATE POLICY "results_own" ON public.optimization_results FOR ALL USING (auth.uid() = user_id);

-- 7. Populate product_id in orders if it can be found via SKU
UPDATE public.orders o
SET product_id = p.id
FROM public.products p
WHERE o.user_id = p.user_id
  AND o.sku = p.sku
  AND o.product_id IS NULL;
