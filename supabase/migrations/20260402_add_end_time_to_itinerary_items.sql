-- Add end_time column to itinerary_items
ALTER TABLE public.itinerary_items ADD COLUMN IF NOT EXISTS end_time text;
