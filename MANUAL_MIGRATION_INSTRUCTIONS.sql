-- Execute this SQL directly in Supabase SQL editor to apply the map_link migration
-- https://supabase.com/dashboard/project/pxbpkkizfvpnocopnsjt/sql

ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_itinerary_items_map_link ON itinerary_items(map_link) WHERE map_link IS NOT NULL;

-- Then run this to mark the migration as applied in the schema_migrations table:
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260420',
  '20260420_add_map_link_to_itinerary_items.sql',
  'ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL; CREATE INDEX IF NOT EXISTS idx_itinerary_items_map_link ON itinerary_items(map_link) WHERE map_link IS NOT NULL;'
)
ON CONFLICT (version) DO NOTHING;
