-- Fix for optimization_count issue and new schema additions

-- 1. Ensure user_profiles has optimization_count and monthly_opt_count
DO $$
BEGIN
  BEGIN ALTER TABLE user_profiles ADD COLUMN optimization_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN monthly_opt_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE user_profiles ADD COLUMN monthly_opt_reset TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 2. Drop old faulty triggers and recreate for user_profiles
DROP TRIGGER IF EXISTS on_session_complete ON optimization_sessions;
DROP FUNCTION IF EXISTS public.increment_subscription_usage();

CREATE OR REPLACE FUNCTION public.increment_subscription_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- We don't have a subscriptions table fully robustly tied in frontend schema in some cases,
  -- but we can update it if it exists. If not, we just update user_profiles.
  -- To be safe from missing table errors:
  BEGIN
    UPDATE public.subscriptions
      SET used_this_month = used_this_month + NEW.total_items,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  UPDATE public.user_profiles
    SET optimization_count = COALESCE(optimization_count, 0) + 1,
        monthly_opt_count  = COALESCE(monthly_opt_count, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_session_complete
  AFTER INSERT ON public.optimization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.increment_subscription_usage();

-- 3. Create packaging_labels table
CREATE TABLE IF NOT EXISTS packaging_labels (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  price           DECIMAL(10,2) DEFAULT 0,
  width_cm        DECIMAL(10,2) DEFAULT 0,
  length_cm       DECIMAL(10,2) DEFAULT 0,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "labels_own" ON packaging_labels;
CREATE POLICY "labels_own" ON packaging_labels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Update orders and optimization_results with new columns
DO $$
BEGIN
  BEGIN ALTER TABLE orders ADD COLUMN label_id UUID REFERENCES packaging_labels(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE orders ADD COLUMN risk_score TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE orders ADD COLUMN old_box_dims TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE orders ADD COLUMN new_box_dims TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE orders ADD COLUMN old_box_cost DECIMAL(10,2); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE orders ADD COLUMN new_box_cost DECIMAL(10,2); EXCEPTION WHEN duplicate_column THEN NULL; END;
  
  BEGIN ALTER TABLE optimization_results ADD COLUMN label_id UUID REFERENCES packaging_labels(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE optimization_results ADD COLUMN risk_score TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
