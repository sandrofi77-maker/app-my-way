-- ─────────────────────────────────────────────────────────────────
-- PASSO 1: Criar tabela trip_members PRIMEIRO
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trip_id, invited_email)
);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id  ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id  ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_email    ON trip_members(invited_email);

-- ─────────────────────────────────────────────────────────────────
-- PASSO 2: Criar funções helper (dependem de trip_members existir)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION user_can_access_trip(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = p_trip_id
      AND (
        trips.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trip_members
          WHERE trip_members.trip_id = p_trip_id
            AND trip_members.user_id = auth.uid()
            AND trip_members.status = 'accepted'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION user_can_edit_trip(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = p_trip_id
      AND (
        trips.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trip_members
          WHERE trip_members.trip_id = p_trip_id
            AND trip_members.user_id = auth.uid()
            AND trip_members.status = 'accepted'
            AND trip_members.role IN ('admin', 'editor')
        )
      )
  );
$$;

-- ─────────────────────────────────────────────────────────────────
-- PASSO 3: RLS na tabela trip_members
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_members_select" ON trip_members;
CREATE POLICY "trip_members_select" ON trip_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_members tm2
            WHERE tm2.trip_id = trip_members.trip_id
              AND tm2.user_id = auth.uid()
              AND tm2.status = 'accepted'
          )
        )
    )
  );

DROP POLICY IF EXISTS "trip_members_insert" ON trip_members;
CREATE POLICY "trip_members_insert" ON trip_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
        AND (
          trips.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_members tm2
            WHERE tm2.trip_id = trip_id
              AND tm2.user_id = auth.uid()
              AND tm2.role = 'admin'
              AND tm2.status = 'accepted'
          )
        )
    )
  );

DROP POLICY IF EXISTS "trip_members_update" ON trip_members;
CREATE POLICY "trip_members_update" ON trip_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_members tm2
            WHERE tm2.trip_id = trip_members.trip_id
              AND tm2.user_id = auth.uid()
              AND tm2.role = 'admin'
              AND tm2.status = 'accepted'
          )
        )
    )
    OR trip_members.user_id = auth.uid()
  );

DROP POLICY IF EXISTS "trip_members_delete" ON trip_members;
CREATE POLICY "trip_members_delete" ON trip_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_members tm2
            WHERE tm2.trip_id = trip_members.trip_id
              AND tm2.user_id = auth.uid()
              AND tm2.role = 'admin'
              AND tm2.status = 'accepted'
          )
        )
    )
    OR trip_members.user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────
-- PASSO 4: Atualizar RLS das outras tabelas usando as funções helper
-- ─────────────────────────────────────────────────────────────────

-- trips
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "trips_select" ON trips;
CREATE POLICY "trips_select" ON trips
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
        AND trip_members.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "trips_insert" ON trips;
CREATE POLICY "trips_insert" ON trips
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "trips_update" ON trips;
CREATE POLICY "trips_update" ON trips
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
        AND trip_members.status = 'accepted'
        AND trip_members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;
DROP POLICY IF EXISTS "trips_delete" ON trips;
CREATE POLICY "trips_delete" ON trips
  FOR DELETE USING (owner_id = auth.uid());

-- flights
DROP POLICY IF EXISTS "Users can view flights for their trips" ON flights;
DROP POLICY IF EXISTS "flights_select" ON flights;
CREATE POLICY "flights_select" ON flights
  FOR SELECT USING (user_can_access_trip(trip_id));

DROP POLICY IF EXISTS "Users can insert flights for their trips" ON flights;
DROP POLICY IF EXISTS "flights_insert" ON flights;
CREATE POLICY "flights_insert" ON flights
  FOR INSERT WITH CHECK (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can update their flights" ON flights;
DROP POLICY IF EXISTS "flights_update" ON flights;
CREATE POLICY "flights_update" ON flights
  FOR UPDATE USING (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can delete their flights" ON flights;
DROP POLICY IF EXISTS "flights_delete" ON flights;
CREATE POLICY "flights_delete" ON flights
  FOR DELETE USING (user_can_edit_trip(trip_id));

-- accommodations
DROP POLICY IF EXISTS "Users can view accommodations for their trips" ON accommodations;
DROP POLICY IF EXISTS "accommodations_select" ON accommodations;
CREATE POLICY "accommodations_select" ON accommodations
  FOR SELECT USING (user_can_access_trip(trip_id));

DROP POLICY IF EXISTS "Users can insert accommodations for their trips" ON accommodations;
DROP POLICY IF EXISTS "accommodations_insert" ON accommodations;
CREATE POLICY "accommodations_insert" ON accommodations
  FOR INSERT WITH CHECK (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can update their accommodations" ON accommodations;
DROP POLICY IF EXISTS "accommodations_update" ON accommodations;
CREATE POLICY "accommodations_update" ON accommodations
  FOR UPDATE USING (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can delete their accommodations" ON accommodations;
DROP POLICY IF EXISTS "accommodations_delete" ON accommodations;
CREATE POLICY "accommodations_delete" ON accommodations
  FOR DELETE USING (user_can_edit_trip(trip_id));

-- itinerary_items
DROP POLICY IF EXISTS "Users can view itinerary items for their trips" ON itinerary_items;
DROP POLICY IF EXISTS "itinerary_items_select" ON itinerary_items;
CREATE POLICY "itinerary_items_select" ON itinerary_items
  FOR SELECT USING (user_can_access_trip(trip_id));

DROP POLICY IF EXISTS "Users can insert itinerary items for their trips" ON itinerary_items;
DROP POLICY IF EXISTS "itinerary_items_insert" ON itinerary_items;
CREATE POLICY "itinerary_items_insert" ON itinerary_items
  FOR INSERT WITH CHECK (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can update their itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "itinerary_items_update" ON itinerary_items;
CREATE POLICY "itinerary_items_update" ON itinerary_items
  FOR UPDATE USING (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can delete their itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "itinerary_items_delete" ON itinerary_items;
CREATE POLICY "itinerary_items_delete" ON itinerary_items
  FOR DELETE USING (user_can_edit_trip(trip_id));

-- expenses
DROP POLICY IF EXISTS "Users can view expenses for their trips" ON expenses;
DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (user_can_access_trip(trip_id));

DROP POLICY IF EXISTS "Users can insert expenses for their trips" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT WITH CHECK (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can update their expenses" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE USING (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can delete their expenses" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE USING (user_can_edit_trip(trip_id));

-- trip_checklists
DROP POLICY IF EXISTS "Users can view checklists for their trips" ON trip_checklists;
DROP POLICY IF EXISTS "trip_checklists_select" ON trip_checklists;
CREATE POLICY "trip_checklists_select" ON trip_checklists
  FOR SELECT USING (user_can_access_trip(trip_id));

DROP POLICY IF EXISTS "Users can insert checklists for their trips" ON trip_checklists;
DROP POLICY IF EXISTS "trip_checklists_insert" ON trip_checklists;
CREATE POLICY "trip_checklists_insert" ON trip_checklists
  FOR INSERT WITH CHECK (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can update their checklists" ON trip_checklists;
DROP POLICY IF EXISTS "trip_checklists_update" ON trip_checklists;
CREATE POLICY "trip_checklists_update" ON trip_checklists
  FOR UPDATE USING (user_can_edit_trip(trip_id));

DROP POLICY IF EXISTS "Users can delete their checklists" ON trip_checklists;
DROP POLICY IF EXISTS "trip_checklists_delete" ON trip_checklists;
CREATE POLICY "trip_checklists_delete" ON trip_checklists
  FOR DELETE USING (user_can_edit_trip(trip_id));
