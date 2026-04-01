-- Create itinerary_items table
CREATE TABLE public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  time text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX itinerary_items_trip_id_idx ON public.itinerary_items(trip_id);
CREATE INDEX itinerary_items_user_id_idx ON public.itinerary_items(user_id);
CREATE INDEX itinerary_items_date_idx ON public.itinerary_items(date);

-- Enable RLS
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_itinerary_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_itinerary_items_updated_at();
