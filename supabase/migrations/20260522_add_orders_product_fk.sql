-- Migration: Add optional product_id FK to orders and ensure referential integrity
-- Date: 2026-05-22

-- 1) Add product_id column if missing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID;

-- 2) Populate product_id from product_snapshot->>'id' when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='product_snapshot'
  ) THEN
    UPDATE public.orders
    SET product_id = (product_snapshot->>'id')::uuid
    WHERE product_id IS NULL
      AND product_snapshot IS NOT NULL
      AND (product_snapshot->>'id') IS NOT NULL;
  END IF;
END $$;

-- 3) Add index on product_id for performance
CREATE INDEX IF NOT EXISTS idx_orders_product ON public.orders(product_id);

-- 4) Add FK constraint only when there are no violating rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='orders' AND constraint_name='fk_orders_product'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.product_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = o.product_id)
    ) THEN
      ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 5) Ensure optimization_result_id and optimization_session_id have FK constraints if possible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='orders' AND constraint_name='fk_orders_optimization_result'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.optimization_result_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.optimization_results r WHERE r.id = o.optimization_result_id)
    ) THEN
      -- only add if there are NO violating rows
      NULL; -- skip if violations exist
    ELSE
      ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_optimization_result FOREIGN KEY (optimization_result_id) REFERENCES public.optimization_results(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 6) Add similar FK for optimization_session_id if safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='orders' AND constraint_name='fk_orders_optimization_session'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.optimization_session_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.optimization_sessions s WHERE s.id = o.optimization_session_id)
    ) THEN
      NULL; -- skip if violations exist
    ELSE
      ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_optimization_session FOREIGN KEY (optimization_session_id) REFERENCES public.optimization_sessions(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- End migration
