-- Function to reset tokens monthly
CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET used_this_month = 0
  WHERE last_reset < date_trunc('month', now());

  UPDATE subscriptions
  SET last_reset = now()
  WHERE last_reset < date_trunc('month', now()) OR last_reset IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Adding last_reset column to subscriptions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'subscriptions'::regclass AND attname = 'last_reset') THEN
        ALTER TABLE subscriptions ADD COLUMN last_reset TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;
