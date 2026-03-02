-- ============================================================
-- Flora Collector v2 — Add api_verified flag + geolocation
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add api_verified column to species (false = not found in APIs)
ALTER TABLE species ADD COLUMN IF NOT EXISTS api_verified BOOLEAN DEFAULT false;

-- 2. Add geolocation columns to species_images
ALTER TABLE species_images ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE species_images ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE species_images ADD COLUMN IF NOT EXISTS location_label TEXT;

-- 3. Mark existing species with API keys as verified
UPDATE species SET api_verified = true WHERE gbif_key IS NOT NULL;

-- 4. Set any remaining NULLs to false (species without API data)
UPDATE species SET api_verified = false WHERE api_verified IS NULL;
