# Base Técnica: Supabase Local + Seguridad + Bugs

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la base técnica production-ready: Supabase local funcional con migraciones, datos de prueba, y todos los bugs de seguridad corregidos antes del lanzamiento.

**Architecture:** Se organiza el schema en migraciones versionadas (Supabase CLI), se cierran las políticas RLS que permiten acceso anónimo a operaciones admin, y se estandariza el manejo de errores en todas las API routes con un helper centralizado.

**Tech Stack:** Next.js 15 App Router · Supabase CLI · TypeScript · PostgreSQL RLS

**Spec:** `docs/superpowers/specs/2026-03-26-pre-launch-review-design.md`

---

## Chunk 1: Supabase Local

### Task 1: Crear migración inicial desde schema.sql

**Files:**
- Create: `supabase/migrations/20250101000000_init.sql`
- Delete: `supabase/schema.sql` (al final de este task)

- [ ] **Step 1: Crear el directorio y archivo de migración inicial**

Crear `supabase/migrations/20250101000000_init.sql` con el contenido exacto de `supabase/schema.sql` actual. El contenido ya contiene tablas, índices, triggers, RLS policies y storage bucket.

Contenido completo del archivo:

```sql
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

-- Tabla de solicitudes de modificación de murales
CREATE TABLE mural_modificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  mural_id UUID NOT NULL REFERENCES murales(id) ON DELETE CASCADE,

  -- Datos propuestos en la modificación
  nuevo_comentario TEXT,
  nueva_imagen_url TEXT NOT NULL,
  nueva_imagen_thumbnail_url TEXT,

  -- Imagen original del mural al momento de aprobar (para poder mostrar antes/después)
  imagen_original_url TEXT,
  imagen_original_thumbnail_url TEXT,

  -- Estado de la solicitud de modificación
  estado_solicitud TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_solicitud IN ('pendiente', 'aprobada', 'rechazada')),
  procesado_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  reportado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mural_modificaciones_mural_id ON mural_modificaciones(mural_id);
CREATE INDEX idx_mural_modificaciones_estado ON mural_modificaciones(estado_solicitud);

ALTER TABLE murales ENABLE ROW LEVEL SECURITY;
ALTER TABLE mural_modificaciones ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer murales
CREATE POLICY "Murales aprobados son públicos"
  ON murales FOR SELECT
  USING (estado IN ('pendiente', 'aprobado', 'rechazado', 'modificado_pendiente', 'modificado_aprobado'));

-- Política: Cualquiera puede leer solicitudes de modificación
CREATE POLICY "Solicitudes de modificación son públicas"
  ON mural_modificaciones FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM murales m
    WHERE m.id = mural_modificaciones.mural_id
      AND m.estado IN ('pendiente', 'aprobado', 'rechazado', 'modificado_pendiente', 'modificado_aprobado')
  ));

-- Política: Cualquiera puede insertar nuevos murales (quedan pendientes)
CREATE POLICY "Cualquiera puede crear murales"
  ON murales FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Cualquiera puede crear solicitudes de modificación
CREATE POLICY "Cualquiera puede crear solicitudes de modificación"
  ON mural_modificaciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Cualquiera puede actualizar para reportar eliminados (SERÁ REEMPLAZADA EN MIGRACIÓN 2)
CREATE POLICY "Cualquiera puede reportar eliminados"
  ON murales FOR UPDATE
  USING (true)
  WITH CHECK (estado IN ('modificado_pendiente', 'pendiente', 'aprobado', 'rechazado', 'modificado_aprobado'));

-- Política: Cualquiera puede actualizar solicitudes (SERÁ REEMPLAZADA EN MIGRACIÓN 2)
CREATE POLICY "Cualquiera puede actualizar solicitudes de modificación"
  ON mural_modificaciones FOR UPDATE
  USING (true)
  WITH CHECK (estado_solicitud IN ('pendiente', 'aprobada', 'rechazada'));

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

-- Tabla de auditoría
CREATE TABLE auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_email TEXT,
  usuario_nombre TEXT,
  accion TEXT NOT NULL CHECK (accion IN (
    'aprobar_mural',
    'rechazar_mural',
    'aprobar_modificacion',
    'rechazar_modificacion',
    'actualizar_estado'
  )),
  entidad_tipo TEXT NOT NULL CHECK (entidad_tipo IN ('mural', 'modificacion')),
  entidad_id UUID NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  comentario TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad_tipo, entidad_id);
CREATE INDEX idx_auditoria_created_at ON auditoria(created_at DESC);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer auditoría"
  ON auditoria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar auditoría"
  ON auditoria FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

- [ ] **Step 2: Eliminar supabase/schema.sql**

```bash
rm supabase/schema.sql
```

- [ ] **Step 3: Verificar que el archivo de migración existe**

```bash
ls supabase/migrations/
```
Resultado esperado: `20250101000000_init.sql`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20250101000000_init.sql
git rm supabase/schema.sql
git commit -m "chore: convert schema.sql to versioned migration"
```

---

### Task 2: Crear migración de fix de RLS policies

**Files:**
- Create: `supabase/migrations/20260326000000_fix_rls_policies.sql`

- [ ] **Step 1: Crear la migración de RLS**

Crear `supabase/migrations/20260326000000_fix_rls_policies.sql`:

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260326000000_fix_rls_policies.sql
git commit -m "security: restrict RLS UPDATE/DELETE to authenticated users only"
```

---

### Task 3: Crear seed data

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Crear supabase/seed.sql**

```sql
-- Seed data para desarrollo local
-- Coordenadas reales en el área de Asunción, Paraguay
-- Imágenes de Unsplash (públicas, sin autenticación)

INSERT INTO murales (nombre, candidato, url_maps, comentario, imagen_url, imagen_thumbnail_url, estado) VALUES

-- Murales aprobados (5)
(
  'Ruta 1 km 12, Luque',
  'Fulano De Tal - Partido Colorado',
  'https://www.google.com/maps?q=-25.2670,-57.4822',
  'Mural grande sobre pared de hormigón, visible desde la ruta',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=300',
  'aprobado'
),
(
  'Av. España 1200, Asunción',
  'Mengano XYZ - PLRA',
  'https://www.google.com/maps?q=-25.2820,-57.6350',
  'Mural en medianera de edificio comercial',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300',
  'aprobado'
),
(
  'San Lorenzo Centro',
  'Perengano ABC - PEN',
  'https://www.google.com/maps?q=-25.3320,-57.5020',
  null,
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=300',
  'aprobado'
),
(
  'Luque km 18',
  'Candidato Independiente',
  'https://www.google.com/maps?q=-25.2780,-57.4910',
  'Mural pintado sobre barda de chapa',
  'https://images.unsplash.com/photo-1551913902-c92207136625?w=800',
  'https://images.unsplash.com/photo-1551913902-c92207136625?w=300',
  'aprobado'
),
(
  'Fernando de la Mora, calle Mcal. López',
  'Partido Colorado - Lista 1',
  'https://www.google.com/maps?q=-25.3390,-57.5510',
  'Mural doble cara en esquina céntrica',
  'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800',
  'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=300',
  'aprobado'
),

-- Murales pendientes (3)
(
  'Capiatá, Ruta Transchaco',
  'Sin identificar',
  'https://www.google.com/maps?q=-25.3610,-57.4470',
  'Mural sin candidato visible, solo logo de partido',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300',
  'pendiente'
),
(
  'Ñemby km 5',
  'Fulana De Tal - PLRA',
  'https://www.google.com/maps?q=-25.3880,-57.5280',
  null,
  'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800',
  'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=300',
  'pendiente'
),
(
  'Villa Elisa centro',
  'Lista 400 - Colorado',
  'https://www.google.com/maps?q=-25.3990,-57.6020',
  'Mural reciente, pintado sobre mural anterior',
  'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=800',
  'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=300',
  'pendiente'
),

-- Mural rechazado (1)
(
  'Entrada duplicada - test',
  'Test',
  'https://www.google.com/maps?q=-25.3085,-57.6056',
  'Entrada de prueba rechazada por duplicado',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
  'rechazado'
);

-- Murales con modificación pendiente (2) — insertar modificaciones relacionadas
-- Primero insertar los murales base
INSERT INTO murales (id, nombre, candidato, url_maps, comentario, imagen_url, imagen_thumbnail_url, estado) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Itauguá km 30',
  'Partido X - Lista 2',
  'https://www.google.com/maps?q=-25.3960,-57.3590',
  'Mural modificado recientemente',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=300',
  'modificado_pendiente'
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  'Lambaré, Av. Artigas',
  'PLRA - Candidato Local',
  'https://www.google.com/maps?q=-25.3490,-57.6120',
  null,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
  'modificado_pendiente'
);

-- Solicitudes de modificación para los murales anteriores
INSERT INTO mural_modificaciones (mural_id, nueva_imagen_url, nueva_imagen_thumbnail_url, nuevo_comentario, estado_solicitud) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=300',
  'El mural fue ampliado, ahora ocupa toda la pared lateral',
  'pendiente'
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  'https://images.unsplash.com/photo-1565799557186-4c66a3b9e8d8?w=800',
  'https://images.unsplash.com/photo-1565799557186-4c66a3b9e8d8?w=300',
  'Mural fue repintado con otro candidato encima',
  'pendiente'
);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore: add seed data for local development"
```

---

### Task 4: Actualizar package.json y .env.local.example

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Agregar scripts de Supabase CLI a package.json**

En `package.json`, dentro de `"scripts"`, agregar después del último script existente:

```json
"db:start": "supabase start",
"db:stop": "supabase stop",
"db:reset": "supabase db reset",
"db:migrate": "supabase migration up"
```

- [ ] **Step 2: Actualizar .env.local.example**

Reemplazar el contenido actual de `.env.local.example` con:

```env
# ============================================================
# Supabase - Desarrollo Local (Supabase CLI)
# ============================================================
# 1. Instalá Supabase CLI: https://supabase.com/docs/guides/cli
# 2. Corré: yarn db:start
# 3. Copiá las keys del output (ANON KEY) y pegá abajo
# 4. Copiá este archivo: cp .env.local.example .env.local

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del output de yarn db:start>

# ============================================================
# Supabase - Producción (Supabase Cloud)
# ============================================================
# Descomentar y completar para producción:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxx
```

- [ ] **Step 3: Agregar .superpowers/ al .gitignore**

Abrir `.gitignore` y agregar al final:

```
# Brainstorming visual companion
.superpowers/
```

- [ ] **Step 4: Verificar que yarn dev arranca sin errores de env**

```bash
yarn dev
```
Resultado esperado: servidor arranca en `http://localhost:3000` (o error claro de Supabase si no hay `.env.local`, no un crash silencioso).

- [ ] **Step 5: Commit**

```bash
git add package.json .env.local.example .gitignore
git commit -m "chore: add supabase CLI scripts, update env example, update gitignore"
```

---

### Task 5: Agregar validación de variables de entorno en clientes Supabase

**Files:**
- Modify: `lib/supabase/server.ts`
- Modify: `lib/supabase/client.ts`

- [ ] **Step 1: Actualizar lib/supabase/server.ts**

Reemplazar el contenido actual con:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. ' +
    'Copiá .env.local.example a .env.local y completá los valores. ' +
    'Para desarrollo local: ejecutá yarn db:start primero.'
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 2: Actualizar lib/supabase/client.ts**

Reemplazar el contenido actual con:

```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. ' +
    'Copiá .env.local.example a .env.local y completá los valores.'
  )
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
```

- [ ] **Step 3: Verificar que TypeScript no da errores**

```bash
yarn build 2>&1 | head -30
```
Resultado esperado: sin errores de tipos en los archivos modificados.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/server.ts lib/supabase/client.ts
git commit -m "feat: add environment variable validation to Supabase clients"
```

---

### Task 6: Probar el reset completo de la BD local

> Requiere Docker instalado y corriendo.

- [ ] **Step 1: Arrancar Supabase local**

```bash
yarn db:start
```
Resultado esperado: output con URLs y keys. Guardar la `anon key` para `.env.local`.

- [ ] **Step 2: Crear .env.local con las keys locales**

```bash
cp .env.local.example .env.local
# Editar .env.local con la anon key del output anterior
```

- [ ] **Step 3: Resetear la BD y verificar seed**

```bash
yarn db:reset
```
Resultado esperado: "Finished supabase db reset" sin errores.

- [ ] **Step 4: Verificar datos en Supabase Studio**

Abrir `http://localhost:54323` → Table Editor → `murales`.
Resultado esperado: 11 filas (5 aprobados + 3 pendientes + 1 rechazado + 2 modificado_pendiente).

- [ ] **Step 5: Correr la app y verificar el mapa**

```bash
yarn dev
```
Abrir `http://localhost:3000`. Resultado esperado: mapa con marcadores (murales aprobados y modificados).

---

## Chunk 2: Seguridad y Bugs

### Task 7: Crear helper centralizado de respuestas API

**Files:**
- Create: `lib/api-response.ts`

- [ ] **Step 1: Crear lib/api-response.ts**

```typescript
import { NextResponse } from 'next/server'

/**
 * Helper para respuestas de error estandarizadas en API routes.
 * Siempre retorna { error: string } con el status HTTP correcto.
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Helper para respuestas exitosas estandarizadas en API routes.
 * Retorna los datos directamente (sin wrapper).
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api-response.ts
git commit -m "feat: add centralized API response helpers"
```

---

### Task 8: Actualizar lib/auditoria.ts para retornar boolean

**Files:**
- Modify: `lib/auditoria.ts`

- [ ] **Step 1: Actualizar la función para retornar boolean**

Reemplazar el contenido completo de `lib/auditoria.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { AccionAuditoria } from '@/lib/types';
import { getAuthenticatedUser } from './auth/server';
import { headers } from 'next/headers';

interface RegistrarAuditoriaParams {
  accion: AccionAuditoria;
  entidadTipo: 'mural' | 'modificacion';
  entidadId: string;
  datosAnteriores?: Record<string, unknown>;
  datosNuevos?: Record<string, unknown>;
  comentario?: string;
}

/**
 * Registra una acción en el historial de auditoría.
 * Retorna true si el registro fue exitoso, false si falló.
 * No lanza error para no interrumpir el flujo principal.
 */
export async function registrarAuditoria(params: RegistrarAuditoriaParams): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    const headersList = await headers();

    const supabase = await createClient();

    const auditoriaData = {
      usuario_id: user?.id || null,
      usuario_email: user?.email || null,
      usuario_nombre: user?.name || null,
      accion: params.accion,
      entidad_tipo: params.entidadTipo,
      entidad_id: params.entidadId,
      datos_anteriores: params.datosAnteriores || null,
      datos_nuevos: params.datosNuevos || null,
      comentario: params.comentario || null,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    };

    const { error } = await supabase.from('auditoria').insert(auditoriaData);

    if (error) {
      console.error('Error registrando auditoría:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error inesperado al registrar auditoría:', error);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auditoria.ts
git commit -m "feat: registrarAuditoria returns boolean to surface failures"
```

---

### Task 9: Agregar escapeHtml y fix de coordenadas en lib/utils.ts

**Files:**
- Modify: `lib/utils.ts`

- [ ] **Step 1: Agregar escapeHtml() al final de lib/utils.ts**

Agregar esta función al final del archivo (después de `uploadImageWithThumbnail`):

```typescript
/**
 * Escapa caracteres especiales HTML para prevenir XSS.
 * Usar en todos los valores interpolados en strings HTML (ej: popups del mapa).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

- [ ] **Step 2: Agregar validación de rango en extractCoordinates()**

En `lib/utils.ts`, en la función `extractCoordinates()`, reemplazar el bloque de validación (líneas 97-99):

```typescript
// ANTES:
if (!isNaN(lat) && !isNaN(lng)) {
  return { lat, lng };
}

// DESPUÉS:
if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
  return { lat, lng };
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
yarn build 2>&1 | grep -E "error|warning" | head -20
```
Resultado esperado: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add escapeHtml utility, fix coordinate range validation"
```

---

### Task 10: Actualizar todas las API routes para usar apiResponse

**Files:**
- Modify: `app/api/upload/route.ts`
- Modify: `app/api/murales/route.ts`
- Modify: `app/api/murales/[id]/route.ts` ← también llama a registrarAuditoria
- Modify: `app/api/murales/[id]/report/route.ts`
- Modify: `app/api/admin/murales/route.ts`
- Modify: `app/api/admin/murales/[id]/modificaciones/[modId]/route.ts` ← también llama a registrarAuditoria
- Modify: `app/api/admin/auditoria/route.ts`

> **Nota:** No existe `app/api/admin/murales/[id]/route.ts`. Las actualizaciones de estado de murales van a través de `PATCH /api/murales/[id]` (route pública que comprueba el referer). Las dos routes que llaman a `registrarAuditoria()` son `app/api/murales/[id]/route.ts` y `app/api/admin/murales/[id]/modificaciones/[modId]/route.ts`.

- [ ] **Step 1: Leer y actualizar app/api/upload/route.ts**

Reemplazar el contenido completo con:

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-response';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIME_TO_EXT: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return apiError('No se proporcionó ningún archivo', 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError('Tipo de archivo no permitido. Solo JPG, PNG y WebP.', 400);
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedExts = MIME_TO_EXT[file.type] ?? []
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return apiError('La extensión del archivo no coincide con su tipo.', 400);
    }

    const supabase = await createClient();

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = type === 'thumbnail' ? `thumbnails/${fileName}` : `originals/${fileName}`;

    const { data, error } = await supabase.storage
      .from('murales')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Error uploading file:', error);
      return apiError(error.message, 500);
    }

    const { data: { publicUrl } } = supabase.storage.from('murales').getPublicUrl(data.path);

    return apiSuccess({ success: true, url: publicUrl, path: data.path });
  } catch (error) {
    console.error('Unexpected error:', error);
    return apiError('Error interno del servidor', 500);
  }
}
```

- [ ] **Step 2: Leer y actualizar app/api/murales/route.ts, app/api/murales/[id]/report/route.ts, app/api/admin/murales/route.ts, app/api/admin/auditoria/route.ts**

Para cada uno, leer el archivo actual y aplicar este patrón:

```typescript
// 1. Agregar import
import { apiError, apiSuccess } from '@/lib/api-response';

// 2. Reemplazar todas las respuestas de error:
// ANTES: return NextResponse.json({ error: 'mensaje' }, { status: N })
// DESPUÉS: return apiError('mensaje', N)

// 3. Reemplazar todas las respuestas exitosas:
// ANTES: return NextResponse.json(data)
// DESPUÉS: return apiSuccess(data)

// 4. Eliminar el import de NextResponse si ya no se usa en la route
```

- [ ] **Step 3: Leer y actualizar app/api/murales/[id]/route.ts (con _auditWarning)**

Este archivo tiene GET y PATCH. La función PATCH llama a `registrarAuditoria()` pero no captura el resultado. Actualizarla:

```typescript
import { apiError, apiSuccess } from '@/lib/api-response';

// En la función PATCH, reemplazar el bloque de auditoría (líneas 82-93) y la respuesta final:
const referer = request.headers.get('referer');
const isAdminRequest = referer?.includes('/admin');
let auditoriaOk = true;
if (isAdminRequest) {
  const accion = estado === 'aprobado' ? 'aprobar_mural' : estado === 'rechazado' ? 'rechazar_mural' : 'actualizar_estado';
  auditoriaOk = await registrarAuditoria({
    accion,
    entidadTipo: 'mural',
    entidadId: id,
    datosAnteriores: muralAnterior ? { estado: muralAnterior.estado } : undefined,
    datosNuevos: { estado },
    comentario: `Estado del mural "${muralAnterior?.nombre || id}" actualizado a ${estado}`,
  });
}

const responseBody = auditoriaOk
  ? { success: true, data }
  : { success: true, data, _auditWarning: 'Acción completada pero no se pudo registrar en auditoría.' };
return apiSuccess(responseBody);
```

También reemplazar los `NextResponse.json(...)` de GET y del manejo de errores en PATCH con `apiError`/`apiSuccess`.

- [ ] **Step 4: Leer y actualizar app/api/admin/murales/[id]/modificaciones/[modId]/route.ts**

Esta es la route más compleja. Leer el archivo completo, mantener toda la lógica de aprobación/rechazo, y aplicar los mismos cambios:
- Agregar import de `apiError`/`apiSuccess`
- Capturar el boolean de `registrarAuditoria()` y agregar `_auditWarning` si es false
- Reemplazar todos los `NextResponse.json(...)` con los helpers

- [ ] **Step 5: Verificar TypeScript**

```bash
yarn build 2>&1 | grep -E "^.*(error TS|Error)" | head -30
```
Resultado esperado: sin errores de tipos.

- [ ] **Step 6: Commit**

```bash
git add app/api/murales/route.ts \
        app/api/murales/[id]/route.ts \
        app/api/murales/[id]/report/route.ts \
        app/api/admin/murales/route.ts \
        app/api/admin/murales/[id]/modificaciones/[modId]/route.ts \
        app/api/admin/auditoria/route.ts \
        app/api/upload/route.ts
git commit -m "refactor: standardize all API routes to use apiError/apiSuccess helpers"
```

---

### Task 11: Agregar rate limiting en middleware.ts

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Reemplazar el contenido de middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rate limiting: Map en memoria (se resetea en cold starts, aceptable para este caso de uso)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 segundos
// Rutas exactas a proteger (POST /api/murales crea murales, POST /api/upload sube imágenes)
// También incluye /api/murales/[id]/report — es POST público y merece protección
const RATE_LIMITED_PATHS = ['/api/upload'];

function isRateLimited(ip: string, pathname: string): boolean {
  // Aplicar en /api/upload y cualquier POST a /api/murales (crear o reportar)
  const isMuralesPost = pathname === '/api/murales' || pathname.startsWith('/api/murales/');
  const isUploadPost = RATE_LIMITED_PATHS.some(path => pathname.startsWith(path));
  if (!isMuralesPost && !isUploadPost) {
    return false;
  }

  const now = Date.now();
  // Agrupar todas las rutas /api/murales/* bajo la misma key para contar el total
  // Esto da 10 req/min por IP para TODA la familia murales, no 10 por sub-ruta
  const routeFamily = isMuralesPost ? 'murales' : 'upload';
  const key = `${ip}:${routeFamily}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  // Rate limiting solo en POSTs
  if (request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (isRateLimited(ip, request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' },
        { status: 429 }
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: Verificar TypeScript**

```bash
yarn build 2>&1 | grep -E "^.*(error|Error)" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add IP-based rate limiting for public POST routes"
```

---

### Task 12: Eliminar archivos no usados

**Files:**
- Delete: `lib/types-improved.ts`
- Delete: `design-options.html` (root)
- Delete: `design-mockup.html` (root)

- [ ] **Step 1: Verificar que types-improved.ts no se importa en ningún lado**

```bash
grep -r "types-improved" --include="*.ts" --include="*.tsx" .
```
Resultado esperado: sin resultados (no hay imports).

- [ ] **Step 2: Eliminar los archivos**

```bash
git rm lib/types-improved.ts
git rm design-options.html
git rm design-mockup.html
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove unused files (types-improved.ts, design mockups)"
```

---

### Task 13: Verificación final del Chunk 2

- [ ] **Step 1: Build limpio**

```bash
yarn build
```
Resultado esperado: build exitoso sin errores TypeScript.

- [ ] **Step 2: Smoke test de seguridad — subir archivo con MIME no permitido**

Con la app corriendo (`yarn dev`), crear un archivo de prueba y enviarlo con MIME de PDF:

```bash
echo "test content" > /tmp/test.pdf
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/tmp/test.pdf;type=application/pdf" \
  -F "type=original"
```
Resultado esperado: `{"error":"Tipo de archivo no permitido. Solo JPG, PNG y WebP."}` con status 400.

Probar también extensión con MIME inconsistente:
```bash
echo "test content" > /tmp/fake.jpg
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/tmp/fake.jpg;type=image/png" \
  -F "type=original"
```
Resultado esperado: `{"error":"La extensión del archivo no coincide con su tipo."}` con status 400.

- [ ] **Step 3: Smoke test de seguridad — rate limiting**

```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/api/murales \
    -H "Content-Type: application/json" \
    -d '{"nombre":"test","url_maps":"https://maps.google.com/maps?q=-25.3,-57.6","imagen_url":"http://test.com/img.jpg"}'
done
```
Resultado esperado: primeros 10 retornan 400 o 201, requests 11 y 12 retornan 429.

- [ ] **Step 4: Verificar que no hay cambios sin commitear**

```bash
git status
```
Resultado esperado: "nothing to commit, working tree clean"
