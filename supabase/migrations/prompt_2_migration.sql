BEGIN;

-- optimization_sessions table
CREATE TABLE IF NOT EXISTS public.optimization_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  total_processed INTEGER DEFAULT 0,
  total_optimized INTEGER DEFAULT 0,
  total_not_optimized INTEGER DEFAULT 0,
  total_savings NUMERIC(12,2) DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- optimization_results table
CREATE TABLE IF NOT EXISTS public.optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.optimization_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  optimized BOOLEAN NOT NULL DEFAULT false,
  reason_code TEXT,
  reason TEXT,
  explanation TEXT,
  recommendation TEXT,
  fragility TEXT DEFAULT 'LOW',
  fragility_score NUMERIC(5,2) DEFAULT 0,
  why_chosen TEXT,
  baseline_box TEXT,
  optimized_box TEXT,
  baseline_cost NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  savings NUMERIC(10,2) DEFAULT 0,
  savings_percent NUMERIC(5,2) DEFAULT 0,
  volume_util NUMERIC(5,2) DEFAULT 0,
  weight NUMERIC(8,3),
  dimensions JSONB,
  optimized_dims JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.optimization_sessions(id),
  ADD COLUMN IF NOT EXISTS product_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS optimized_box TEXT,
  ADD COLUMN IF NOT EXISTS baseline_box TEXT,
  ADD COLUMN IF NOT EXISTS optimized_dims JSONB,
  ADD COLUMN IF NOT EXISTS product_dims JSONB,
  ADD COLUMN IF NOT EXISTS savings NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS baseline_cost NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS fragility TEXT DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS weight NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Enable realtime for orders (needed for realtime subscription)
-- Note: Publication might already exist, so we use a safe way to add the table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_results_session ON public.optimization_results(session_id);
CREATE INDEX IF NOT EXISTS idx_opt_results_user ON public.optimization_results(user_id);
CREATE INDEX IF NOT EXISTS idx_opt_sessions_user ON public.optimization_sessions(user_id);

-- RLS
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own optimization_results" ON public.optimization_results;
CREATE POLICY "Users own optimization_results" ON public.optimization_results
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own optimization_sessions" ON public.optimization_sessions;
CREATE POLICY "Users own optimization_sessions" ON public.optimization_sessions
  FOR ALL USING (auth.uid() = user_id);

COMMIT;
