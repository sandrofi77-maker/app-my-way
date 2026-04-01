-- Drop and recreate itinerary_items with safe column names
-- (avoids PostgREST schema cache issues with reserved words like "date" and "time")

DROP TABLE IF EXISTS public.itinerary_items CASCADE;

CREATE TABLE public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_date date,
  scheduled_time text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX itinerary_items_trip_id_idx ON public.itinerary_items(trip_id);
CREATE INDEX itinerary_items_user_id_idx ON public.itinerary_items(user_id);
CREATE INDEX itinerary_items_scheduled_date_idx ON public.itinerary_items(scheduled_date);

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itinerary items"
  ON public.itinerary_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itinerary items"
  ON public.itinerary_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itinerary items"
  ON public.itinerary_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itinerary items"
  ON public.itinerary_items FOR DELETE
  USING (auth.uid() = user_id);
