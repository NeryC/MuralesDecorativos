-- Tabla principal de murales
CREATE TABLE murales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nombre TEXT NOT NULL,
  candidato TEXT,
  url_maps TEXT NOT NULL,
  comentario TEXT,
  imagen_url TEXT NOT NULL,
  imagen_thumbnail_url TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'modificado_pendiente', 'modificado_aprobado')),
  
  -- Campos para reportes de eliminación/modificación
  nuevo_comentario TEXT,
  nueva_imagen_url TEXT,
  nueva_imagen_thumbnail_url TEXT,
  reportado_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_murales_estado ON murales(estado);
CREATE INDEX idx_murales_created_at ON murales(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_murales_updated_at BEFORE UPDATE ON murales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE murales ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer murales (incluye pendientes para panel admin)
CREATE POLICY "Murales aprobados son públicos"
  ON murales FOR SELECT
  USING (estado IN ('pendiente', 'aprobado', 'rechazado', 'modificado_pendiente', 'modificado_aprobado'));

-- Política: Cualquiera puede insertar nuevos murales (quedan pendientes)
CREATE POLICY "Cualquiera puede crear murales"
  ON murales FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Cualquiera puede actualizar para reportar eliminados
CREATE POLICY "Cualquiera puede reportar eliminados"
  ON murales FOR UPDATE
  USING (true)
  WITH CHECK (estado IN ('modificado_pendiente', 'pendiente', 'aprobado', 'rechazado', 'modificado_aprobado'));

-- Storage bucket para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('murales', 'murales', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: Cualquiera puede subir imágenes
CREATE POLICY "Cualquiera puede subir imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'murales');

-- Política de storage: Las imágenes son públicas
CREATE POLICY "Imágenes son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'murales');
