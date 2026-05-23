-- Add missing void percentage columns to optimization_results
ALTER TABLE public.optimization_results ADD COLUMN IF NOT EXISTS void_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.optimization_results ADD COLUMN IF NOT EXISTS baseline_void_pct NUMERIC(5,2) DEFAULT 0;

-- Also add to orders for consistency
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS void_pct_after NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS void_pct_before NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS match_score NUMERIC(5,2) DEFAULT 0;
