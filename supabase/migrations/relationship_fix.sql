-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PackIQ — Relationship Fix & Schema Sync                                   ║
-- ║  Run this in Supabase SQL Editor to fix "Could not find a relationship"    ║
-- ╚═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure foreign key exists between orders and products
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

-- 2. Ensure fragility_level column exists in products (was missing in some versions)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fragility_level TEXT DEFAULT 'low';

-- 3. Sync any missing columns to orders to ensure the dashboard can render
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

-- 4. REFRESH SCHEMA CACHE
-- Note: In Supabase, the schema cache usually refreshes automatically after DDL,
-- but sometimes an explicit NOTIFY is helpful if using PostgREST directly.
NOTIFY pgrst, 'reload schema';
