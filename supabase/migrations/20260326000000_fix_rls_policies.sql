-- Fix RLS policies: restringir UPDATE y DELETE a usuarios autenticados
-- Las policies actuales permiten que usuarios anónimos modifiquen datos admin

-- Eliminar policies permisivas existentes
DROP POLICY IF EXISTS "Cualquiera puede reportar eliminados" ON murales;
DROP POLICY IF EXISTS "Cualquiera puede actualizar solicitudes de modificación" ON mural_modificaciones;

-- Nueva policy: Solo autenticados pueden actualizar murales
CREATE POLICY "Solo autenticados pueden actualizar murales"
  ON murales FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Nueva policy: Solo autenticados pueden eliminar murales
CREATE POLICY "Solo autenticados pueden eliminar murales"
  ON murales FOR DELETE
  USING (auth.role() = 'authenticated');

-- Nueva policy: Solo autenticados pueden actualizar modificaciones
CREATE POLICY "Solo autenticados pueden actualizar modificaciones"
  ON mural_modificaciones FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Los INSERT y SELECT públicos en murales y mural_modificaciones se mantienen sin cambios
