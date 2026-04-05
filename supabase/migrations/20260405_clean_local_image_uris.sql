-- Limpa campos de imagem que contem URIs locais (file:/// ou caminhos que nao sao URLs https)
-- Essas imagens foram salvas localmente no dispositivo e nao foram enviadas ao Supabase Storage

-- trips.cover_image
UPDATE trips
SET cover_image = NULL
WHERE cover_image IS NOT NULL
  AND cover_image NOT LIKE 'https://%';

-- expenses.image_url
UPDATE expenses
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND image_url NOT LIKE 'https://%';

-- accommodations.image_url
UPDATE accommodations
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND image_url NOT LIKE 'https://%';

-- itinerary_items.image_url
UPDATE itinerary_items
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND image_url NOT LIKE 'https://%';
