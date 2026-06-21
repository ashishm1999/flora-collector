-- ============================================================
-- Flora Collector v3 — Plant origin + Flowering/Fruiting months
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Plant origin classification (native / indigenous / exotic / unknown)
--    Stored as TEXT to stay flexible until Russell finalises the categories.
ALTER TABLE species ADD COLUMN IF NOT EXISTS plant_origin TEXT;

-- 2. Flowering and fruiting months — stored as text arrays of
--    three-letter month codes: 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
ALTER TABLE species ADD COLUMN IF NOT EXISTS flowering_months TEXT[] DEFAULT '{}';
ALTER TABLE species ADD COLUMN IF NOT EXISTS fruiting_months TEXT[] DEFAULT '{}';

-- 3. Backfill any NULLs to empty arrays so .cs / array operators don't break
UPDATE species SET flowering_months = '{}' WHERE flowering_months IS NULL;
UPDATE species SET fruiting_months = '{}' WHERE fruiting_months IS NULL;

-- 4. (Optional) lightweight check constraint — comment out if you'd rather keep it free-form
-- ALTER TABLE species ADD CONSTRAINT plant_origin_check
--   CHECK (plant_origin IS NULL OR plant_origin IN ('native', 'indigenous', 'exotic', 'unknown'));
