-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix Orders and Shipments Schema
-- 
-- Purpose: Align frontend Supabase schema with backend database schema
-- - Add missing snapshot columns to orders table
-- - Add missing optimization_result_id and session_id references
-- - Fix relationship structure to use denormalization (snapshots) instead of FK joins
-- - Add proper indexes and RLS policies
-- 
-- This migration is idempotent and safe to run on existing data
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Ensure all missing columns exist on orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS optimization_result_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS optimization_session_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_snapshot JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS box_snapshot JSONB;

-- Step 2: Ensure total_cost column name is consistent (rename if needed)
DO $$
BEGIN
  -- Check if total_cost_usd exists and total_cost does not
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='total_cost_usd'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='total_cost'
  ) THEN
    -- Create total_cost as alias of total_cost_usd
    ALTER TABLE orders ADD COLUMN total_cost DECIMAL(12,2) DEFAULT 0;
    UPDATE orders SET total_cost = total_cost_usd WHERE total_cost_usd IS NOT NULL;
  END IF;
END $$;

-- Step 3: Ensure currency column exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Step 4: Fix RLS policies (drop and recreate for consistency)
DROP POLICY IF EXISTS "Users manage own orders" ON orders;
DROP POLICY IF EXISTS "orders_own" ON orders;
CREATE POLICY "orders_own" ON orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_opt_result ON orders(optimization_result_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(optimization_session_id);

-- Step 6: Ensure shipments table has all required columns
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS optimization_result_id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient JSONB;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prepared';
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Step 7: Fix shipments RLS policies
DROP POLICY IF EXISTS "Users manage own shipments" ON shipments;
DROP POLICY IF EXISTS "shipments_own" ON shipments;
CREATE POLICY "shipments_own" ON shipments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Step 8: Add shipments indexes
CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION NOTES
-- 
-- After applying this migration, verify:
-- 1. Orders table now has: optimization_result_id, optimization_session_id, product_snapshot, box_snapshot
-- 2. Shipments table now has: optimization_result_id, recipient, carrier, tracking_id, status, printed_at, shipped_at, delivered_at
-- 3. All indexes exist: idx_orders_user, idx_orders_opt_result, idx_shipments_user, idx_shipments_tracking
-- 4. RLS policies are correctly set (policies_own)
-- 5. Orders page queries use product_snapshot and box_snapshot for product details
-- ═══════════════════════════════════════════════════════════════════════════════
