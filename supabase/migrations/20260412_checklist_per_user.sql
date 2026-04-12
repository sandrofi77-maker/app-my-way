-- Checklist individual por usuário
-- Cada usuário só pode ver/editar/deletar seus próprios itens de checklist,
-- mesmo em viagens compartilhadas.

-- SELECT: só seus próprios itens + precisa ter acesso à viagem
DROP POLICY IF EXISTS "trip_checklists_select" ON trip_checklists;
DROP POLICY IF EXISTS "Checklists select own trips" ON trip_checklists;
CREATE POLICY "trip_checklists_select" ON trip_checklists
  FOR SELECT USING (
    user_id = auth.uid()
    AND user_can_access_trip(trip_id)
  );

-- INSERT: só pode inserir com seu próprio user_id + precisa poder editar a viagem
DROP POLICY IF EXISTS "trip_checklists_insert" ON trip_checklists;
DROP POLICY IF EXISTS "Checklists insert own trips" ON trip_checklists;
CREATE POLICY "trip_checklists_insert" ON trip_checklists
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND user_can_access_trip(trip_id)
  );

-- UPDATE: só seus próprios itens + precisa ter acesso à viagem
DROP POLICY IF EXISTS "trip_checklists_update" ON trip_checklists;
DROP POLICY IF EXISTS "Checklists update own trips" ON trip_checklists;
CREATE POLICY "trip_checklists_update" ON trip_checklists
  FOR UPDATE USING (
    user_id = auth.uid()
    AND user_can_access_trip(trip_id)
  );

-- DELETE: só seus próprios itens + precisa ter acesso à viagem
DROP POLICY IF EXISTS "trip_checklists_delete" ON trip_checklists;
DROP POLICY IF EXISTS "Checklists delete own trips" ON trip_checklists;
CREATE POLICY "trip_checklists_delete" ON trip_checklists
  FOR DELETE USING (
    user_id = auth.uid()
    AND user_can_access_trip(trip_id)
  );
