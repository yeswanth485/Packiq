-- Fix for missing companies table and storage bucket

-- 1. Companies table
CREATE TABLE IF NOT EXISTS companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name      TEXT NOT NULL,
  industry          TEXT,
  address           TEXT,
  phone             TEXT,
  website           TEXT,
  logo_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own company" ON companies;
CREATE POLICY "Users manage own company" ON companies FOR ALL USING (owner_user_id = auth.uid());

-- 3. Ensure user_profiles has company_id column correctly
DO $$
BEGIN
  BEGIN
    ALTER TABLE user_profiles ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- 4. Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Policies
DROP POLICY IF EXISTS "Public logo read" ON storage.objects;
CREATE POLICY "Public logo read" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');

DROP POLICY IF EXISTS "Auth logo upload" ON storage.objects;
CREATE POLICY "Auth logo upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-assets' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Auth logo delete" ON storage.objects;
CREATE POLICY "Auth logo delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-assets' AND auth.uid() IS NOT NULL
  );
