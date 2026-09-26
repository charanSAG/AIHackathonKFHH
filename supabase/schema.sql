-- ==============================================================================
-- Supabase Database Schema for KFHH (Kisan Future Helping Hand)
-- ==============================================================================
-- Run this script in your Supabase Project -> SQL Editor
-- This establishes the persistent source of truth with Row Level Security (RLS)

-- 1. Create farmer_profiles table
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT farmer_profiles_user_id_key UNIQUE (user_id)
);

-- 2. Create farms table
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  farm_name TEXT,
  land_area NUMERIC NOT NULL DEFAULT 1.0,
  land_area_unit TEXT NOT NULL DEFAULT 'Acres',
  village TEXT,
  district TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create farmer_crops table
CREATE TABLE IF NOT EXISTS public.farmer_crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  sowing_date DATE,
  area NUMERIC,
  area_unit TEXT DEFAULT 'Acres',
  season TEXT,
  irrigation_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create crop_scans table (for Crop Doctor history)
CREATE TABLE IF NOT EXISTS public.crop_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  disease_detected TEXT NOT NULL,
  confidence INTEGER,
  severity TEXT,
  recommended_treatment TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_scans ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: farmer_profiles
-- Farmers can only select, insert, update, or delete their own profile based on auth.uid()
DROP POLICY IF EXISTS "farmer_profiles_select_own" ON public.farmer_profiles;
CREATE POLICY "farmer_profiles_select_own"
  ON public.farmer_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "farmer_profiles_insert_own" ON public.farmer_profiles;
CREATE POLICY "farmer_profiles_insert_own"
  ON public.farmer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "farmer_profiles_update_own" ON public.farmer_profiles;
CREATE POLICY "farmer_profiles_update_own"
  ON public.farmer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "farmer_profiles_delete_own" ON public.farmer_profiles;
CREATE POLICY "farmer_profiles_delete_own"
  ON public.farmer_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS Policies: farms
-- Farmers can only access farms linked to their farmer_profiles record
DROP POLICY IF EXISTS "farms_select_own" ON public.farms;
CREATE POLICY "farms_select_own"
  ON public.farms FOR SELECT
  USING (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "farms_insert_own" ON public.farms;
CREATE POLICY "farms_insert_own"
  ON public.farms FOR INSERT
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "farms_update_own" ON public.farms;
CREATE POLICY "farms_update_own"
  ON public.farms FOR UPDATE
  USING (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "farms_delete_own" ON public.farms;
CREATE POLICY "farms_delete_own"
  ON public.farms FOR DELETE
  USING (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

-- 8. RLS Policies: farmer_crops
-- Farmers can only view and mutate their own crops
DROP POLICY IF EXISTS "farmer_crops_select_own" ON public.farmer_crops;
CREATE POLICY "farmer_crops_select_own"
  ON public.farmer_crops FOR SELECT
  USING (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "farmer_crops_insert_own" ON public.farmer_crops;
CREATE POLICY "farmer_crops_insert_own"
  ON public.farmer_crops FOR INSERT
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "farmer_crops_update_own" ON public.farmer_crops;
CREATE POLICY "farmer_crops_update_own"
  ON public.farmer_crops FOR UPDATE
  USING (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "farmer_crops_delete_own" ON public.farmer_crops;
CREATE POLICY "farmer_crops_delete_own"
  ON public.farmer_crops FOR DELETE
  USING (
    farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

-- 9. RLS Policies: crop_scans
DROP POLICY IF EXISTS "crop_scans_select_own" ON public.crop_scans;
CREATE POLICY "crop_scans_select_own"
  ON public.crop_scans FOR SELECT
  USING (
    farmer_id IS NULL OR farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "crop_scans_insert_own" ON public.crop_scans;
CREATE POLICY "crop_scans_insert_own"
  ON public.crop_scans FOR INSERT
  WITH CHECK (
    farmer_id IS NULL OR farmer_id IN (
      SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()
    )
  );

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON public.farmer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON public.farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_crops_farmer_id ON public.farmer_crops(farmer_id);
