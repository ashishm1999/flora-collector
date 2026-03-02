-- ============================================================
-- Flora Collector — Supabase Database Migration
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Species table
CREATE TABLE IF NOT EXISTS species (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),

  -- Core taxonomy
  scientific_name             TEXT NOT NULL,
  scientific_name_without_author TEXT NOT NULL,
  scientific_name_authorship  TEXT,
  kingdom                     TEXT DEFAULT 'Plantae',
  phylum                      TEXT,
  class                       TEXT,
  "order"                     TEXT,
  family                      TEXT,
  genus                       TEXT,
  specific_epithet            TEXT,
  rank                        TEXT DEFAULT 'SPECIES',
  taxonomic_status            TEXT,

  -- Common names
  common_names                JSONB DEFAULT '[]'::jsonb,

  -- Distribution
  distribution_native         JSONB DEFAULT '[]'::jsonb,
  distribution_introduced     JSONB DEFAULT '[]'::jsonb,

  -- External database identifiers
  gbif_key                    BIGINT,
  powo_id                     TEXT,
  inaturalist_id              BIGINT,
  ala_guid                    TEXT,
  vicflora_uuid               TEXT,

  -- Conservation
  conservation_status         JSONB DEFAULT '{}'::jsonb,

  -- Traits
  life_form                   TEXT,
  height                      TEXT,
  flowering_season            TEXT,
  habitat_notes               TEXT,

  -- Description & publication
  description                 TEXT,
  first_published             TEXT,

  -- Synonyms
  synonyms                    JSONB DEFAULT '[]'::jsonb,

  -- Notes
  notes                       TEXT
);

-- 2. Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_species_scientific_name ON species USING gin(to_tsvector('english', scientific_name));
CREATE INDEX IF NOT EXISTS idx_species_common_names ON species USING gin(common_names);
CREATE INDEX IF NOT EXISTS idx_species_family ON species(family);
CREATE INDEX IF NOT EXISTS idx_species_genus ON species(genus);

-- 3. Species images table
CREATE TABLE IF NOT EXISTS species_images (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  species_id      UUID REFERENCES species(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  public_url      TEXT NOT NULL,
  license         TEXT,
  creator         TEXT,
  organ           TEXT,
  caption         TEXT,
  is_primary      BOOLEAN DEFAULT false,
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_species ON species_images(species_id);

-- 4. Row Level Security — Species (fully public access, no auth required)
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON species FOR SELECT USING (true);
CREATE POLICY "Public insert" ON species FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON species FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON species FOR DELETE USING (true);

-- 5. Row Level Security — Species Images (fully public access)
ALTER TABLE species_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read images" ON species_images FOR SELECT USING (true);
CREATE POLICY "Public insert images" ON species_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete images" ON species_images FOR DELETE USING (true);

-- 6. Storage bucket for plant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public access)
CREATE POLICY "Public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'plant-images');

CREATE POLICY "Public read storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'plant-images');

CREATE POLICY "Public delete storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'plant-images');

-- 7. Seed data: Banksia marginata
INSERT INTO species (
  scientific_name,
  scientific_name_without_author,
  scientific_name_authorship,
  kingdom, phylum, class, "order", family, genus, specific_epithet,
  rank, taxonomic_status,
  common_names,
  distribution_native,
  distribution_introduced,
  gbif_key, powo_id, inaturalist_id, ala_guid, vicflora_uuid,
  conservation_status,
  life_form, height, flowering_season, habitat_notes,
  description, first_published,
  synonyms
) VALUES (
  'Banksia marginata Cav.',
  'Banksia marginata',
  'Cav.',
  'Plantae', 'Tracheophyta', 'Magnoliopsida', 'Proteales', 'Proteaceae', 'Banksia', 'marginata',
  'SPECIES', 'Accepted',
  '["Silver Banksia", "Honeysuckle"]'::jsonb,
  '["New South Wales", "Victoria", "Tasmania", "South Australia"]'::jsonb,
  '[]'::jsonb,
  7124257, 'urn:lsid:ipni.org:names:703136-1', 133274,
  'https://id.biodiversity.org.au/taxon/apni/51445257',
  'd53901b2-4f12-47e6-a8ad-7f57b8d32c42',
  '{"iucnCategory": "LC", "authority": "IUCN", "nationalStatus": null}'::jsonb,
  'shrub or tree', '1-12 meters', 'December-May (summer-autumn)',
  'Heathland, dry sclerophyll forest, coastal scrub. Tolerates poor soils and exposure.',
  'Highly variable shrub or small tree to 12m. Leaves linear to lanceolate, 1-8cm long, margins entire to serrate. Flower spikes cylindrical, pale yellow to golden.',
  'Anales Hist. Nat. 1: 227 (1799)',
  '["Banksia australis R.Br.", "Banksia depressa R.Br.", "Banksia insularis R.Br."]'::jsonb
);
