-- Add map_link column to itinerary_items table (idempotent)
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT NULL;

-- Add index for better query performance on map_link
CREATE INDEX IF NOT EXISTS idx_itinerary_items_map_link ON itinerary_items(map_link) WHERE map_link IS NOT NULL;

