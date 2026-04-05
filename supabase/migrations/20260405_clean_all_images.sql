-- Limpa TODOS os campos de imagem para recomecar do zero
-- As imagens no Storage devem ser limpas manualmente via Dashboard > Storage > trip-images > Delete All

UPDATE trips SET cover_image = NULL WHERE cover_image IS NOT NULL;
UPDATE expenses SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE accommodations SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE itinerary_items SET image_url = NULL WHERE image_url IS NOT NULL;
