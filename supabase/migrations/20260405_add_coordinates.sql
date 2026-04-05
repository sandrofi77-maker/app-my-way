-- Adiciona coordenadas para visualizacao no mapa
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS longitude numeric;
