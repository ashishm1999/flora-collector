-- ============================================================
-- Fix RLS Policies: Drop old auth-based policies, create public ones
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop ALL existing policies on species
DROP POLICY IF EXISTS "Public read" ON species;
DROP POLICY IF EXISTS "Auth insert" ON species;
DROP POLICY IF EXISTS "Auth update" ON species;
DROP POLICY IF EXISTS "Admin delete" ON species;
DROP POLICY IF EXISTS "Public insert" ON species;
DROP POLICY IF EXISTS "Public update" ON species;
DROP POLICY IF EXISTS "Public delete" ON species;

-- 2. Create fully public policies on species
CREATE POLICY "Public read" ON species FOR SELECT USING (true);
CREATE POLICY "Public insert" ON species FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON species FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON species FOR DELETE USING (true);

-- 3. Drop ALL existing policies on species_images
DROP POLICY IF EXISTS "Public read images" ON species_images;
DROP POLICY IF EXISTS "Auth insert images" ON species_images;
DROP POLICY IF EXISTS "Auth delete images" ON species_images;
DROP POLICY IF EXISTS "Public insert images" ON species_images;
DROP POLICY IF EXISTS "Public delete images" ON species_images;

-- 4. Create fully public policies on species_images
CREATE POLICY "Public read images" ON species_images FOR SELECT USING (true);
CREATE POLICY "Public insert images" ON species_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete images" ON species_images FOR DELETE USING (true);

-- 5. Drop ALL existing policies on storage.objects
DROP POLICY IF EXISTS "Auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Public read storage" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete storage" ON storage.objects;
DROP POLICY IF EXISTS "Public upload" ON storage.objects;
DROP POLICY IF EXISTS "Public delete storage" ON storage.objects;

-- 6. Drop the created_by column (no auth, so no user to track)
ALTER TABLE species DROP COLUMN IF EXISTS created_by;
ALTER TABLE species_images DROP COLUMN IF EXISTS uploaded_by;

-- 7. Create fully public storage policies
CREATE POLICY "Public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'plant-images');
CREATE POLICY "Public read storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'plant-images');
CREATE POLICY "Public delete storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'plant-images');
