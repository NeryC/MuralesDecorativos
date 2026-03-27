# Pre-Launch Review — Mural Decorativo

**Fecha:** 2026-03-26
**Proyecto:** Mural Decorativo — Mapa colaborativo de murales políticos en Paraguay
**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Supabase · Tailwind CSS v4 · Leaflet.js
**Estado:** Pre-producción — aún no lanzado

---

## Contexto

La app permite a ciudadanos reportar murales de propaganda política en Paraguay. Incluye:
- Mapa público con murales aprobados
- Formularios de carga y reporte (`/nuevo`, `/reportar`)
- Panel admin con autenticación para aprobar/rechazar murales y modificaciones
- Auditoría de acciones administrativas

El objetivo de este trabajo es dejarlo production-ready: seguridad sólida, Supabase local completo y rediseño frontend.

---

## Orden de ejecución

**Fase 1 (base técnica):** Supabase local + Seguridad + Bugs — estos van juntos porque las migraciones y las RLS fixes son inseparables.

**Fase 2 (producto):** Rediseño frontend Civic Tech — sobre base limpia.

> Nota: El fix de XSS en popups (1.3) va junto con el rediseño del popup en Fase 2, ya que ambos tocan el mismo archivo (`map-view.tsx`). En Fase 1 se implementa `escapeHtml()` en `lib/utils.ts` pero su uso en el popup se integra en Fase 2.

---

## Fase 1: Supabase Local

### 1.1 Migrar schema a migraciones versionadas

**Problema:** `supabase/migrations/` está vacío. Solo existe `supabase/schema.sql` sin versionar.

**Fix:** Convertir el schema monolítico en migración inicial usando la fecha real del proyecto:

```
supabase/migrations/
  20250101000000_init.sql          ← contenido actual de schema.sql
  20260326000000_fix_rls_policies.sql  ← nuevas policies (ver 2.1)
```

`supabase/schema.sql` se elimina una vez que las migraciones estén funcionando.

### 1.2 Seed data

Crear `supabase/seed.sql` con datos de prueba representativos:
- 5 murales `aprobado`
- 3 murales `pendiente`
- 2 murales `modificado_pendiente` (con registros relacionados en `mural_modificaciones`)
- 1 mural `rechazado`
- Imágenes: usar URLs de imágenes públicas de Unsplash (dominio ya permitido por Next.js) para evitar broken images en desarrollo local
- Coordenadas reales en el área de Asunción, Paraguay

### 1.3 Scripts en package.json

```json
"db:start": "supabase start",
"db:stop": "supabase stop",
"db:reset": "supabase db reset",
"db:migrate": "supabase migration up"
```

### 1.4 Variables de entorno locales

Actualizar `.env.local.example`:

```env
# Desarrollo local con Supabase CLI (después de correr yarn db:start)
# Obtené las keys con: npx supabase status
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del output de supabase start>

# Producción (Supabase cloud)
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 1.5 Validación de variables de entorno

**Ubicación:** En `lib/supabase/server.ts` y `lib/supabase/client.ts`, al inicio del módulo (antes de crear el cliente), lanzar error con mensaje claro si las variables no están definidas:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. ' +
    'Copiá .env.local.example a .env.local y completá los valores. ' +
    'Para desarrollo local: ejecutá yarn db:start primero.'
  )
}
```

---

## Fase 1: Seguridad y Bugs

### 2.1 RLS Policies — CRÍTICO

**Problema:** Las policies actuales permiten que cualquier usuario anónimo haga UPDATE en `murales` y `mural_modificaciones`, permitiendo que alguien apruebe sus propias solicitudes.

**Fix en `supabase/migrations/20260326000000_fix_rls_policies.sql`:**

```sql
-- Eliminar policies permisivas existentes
DROP POLICY IF EXISTS "Cualquiera puede actualizar murales" ON murales;
DROP POLICY IF EXISTS "Cualquiera puede actualizar solicitudes de modificación" ON mural_modificaciones;
DROP POLICY IF EXISTS "Cualquiera puede eliminar murales" ON murales;

-- Nuevas policies restrictivas para murales
CREATE POLICY "Solo autenticados pueden actualizar murales"
  ON murales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo autenticados pueden eliminar murales"
  ON murales FOR DELETE
  USING (auth.role() = 'authenticated');

-- Nuevas policies restrictivas para modificaciones
CREATE POLICY "Solo autenticados pueden actualizar modificaciones"
  ON mural_modificaciones FOR UPDATE
  USING (auth.role() = 'authenticated');

-- INSERT en mural_modificaciones permanece público (ciudadanos pueden reportar)
-- SELECT en murales permanece público (el mapa es público)
-- SELECT en mural_modificaciones permanece público (las modificaciones se muestran en el mapa)
```

Los INSERT y SELECT públicos en `murales` y `mural_modificaciones` se mantienen sin cambios.

### 2.2 Validación de uploads en servidor

**Problema:** `/api/upload` solo extrae la extensión del nombre del archivo sin verificar el tipo real.

**Fix en `app/api/upload/route.ts`:**

```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIME_TO_EXT: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
}

// Verificar MIME type declarado por el browser (file.type)
if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  return apiError('Tipo de archivo no permitido. Solo JPG, PNG y WebP.', 400)
}

// Verificar que la extensión del nombre coincida con el MIME declarado
const fileExt = file.name.split('.').pop()?.toLowerCase()
const allowedExts = MIME_TO_EXT[file.type] ?? []
if (!fileExt || !allowedExts.includes(fileExt)) {
  return apiError('La extensión del archivo no coincide con su tipo.', 400)
}
```

> **Alcance de la validación:** Se valida el MIME type declarado por el browser y la extensión del nombre. No se usan magic bytes (requeriría una librería externa como `file-type`). Un archivo binario renombrado con extensión `.jpg` cuyo MIME declarado sea `image/jpeg` pasará la validación — esto es aceptable dado que los archivos se almacenan en Supabase Storage sin ejecutarse, y el riesgo real es bajo.

### 2.3 XSS en popups del mapa

**Problema:** `components/map-view.tsx` construye HTML de popups interpolando valores de la BD sin escapar.

**Fix en `lib/utils.ts`** — agregar función utilitaria:

```typescript
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

Esta función se implementa en Fase 1 pero su uso en los popups se integra en Fase 2 junto con el rediseño de `map-view.tsx`.

### 2.4 Error handling estandarizado en APIs

**Problema:** Respuestas de error inconsistentes entre routes.

**Fix — crear `lib/api-response.ts`:**

```typescript
import { NextResponse } from 'next/server'

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}
```

Todas las API routes reemplazan sus respuestas manuales por estas funciones. Los fetches del cliente agregan verificación `response.ok`:

```typescript
const response = await fetch('/api/...')
if (!response.ok) {
  const { error } = await response.json()
  throw new Error(error ?? 'Error inesperado')
}
const data = await response.json()
```

### 2.5 Rate limiting básico

**Problema:** Rutas POST públicas sin protección contra spam.

**Fix:** En `middleware.ts`, usar un Map en memoria para trackear requests por IP. Retornar HTTP 429 con body `{ error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' }` si se supera el límite.

**Límite:** 10 requests por IP en ventana de 60 segundos, solo en rutas `POST /api/murales` y `POST /api/upload`.

> **Nota importante:** El rate limiting en memoria no se comparte entre instancias de Vercel (múltiples workers) y se resetea en cada cold start. Esto es aceptable para el caso de uso actual (app pública con tráfico moderado en Paraguay). Si en el futuro se necesita algo distribuido, migrar a Upstash Redis con `@upstash/ratelimit`.

El rate limiting retorna:
```json
HTTP 429
{ "error": "Demasiadas solicitudes. Intentá de nuevo en un minuto." }
```

### 2.6 Validación de coordenadas

**Problema:** `extractCoordinates()` en `lib/utils.ts` no valida rangos.

**Fix en `lib/utils.ts`** (función existente, agregar validación después del `parseFloat`):

```typescript
if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
  return null
}
```

### 2.7 Auditoría con warning en respuesta

**Problema:** `registrarAuditoria()` falla silenciosamente.

**Fix en `lib/auditoria.ts`** — retornar booleano indicando éxito:

```typescript
export async function registrarAuditoria(params): Promise<boolean> {
  // ... lógica actual ...
  if (error) {
    console.error('Error registrando auditoría:', error)
    return false
  }
  return true
}
```

En las API routes admin que llaman a `registrarAuditoria()`, usar `apiSuccess` con un tipo que admita el campo opcional:

```typescript
const auditoriaOk = await registrarAuditoria({ ... })
// data es el objeto de respuesta principal (ej: el mural actualizado)
const responseBody = auditoriaOk
  ? data
  : { ...data, _auditWarning: 'Acción completada pero no se pudo registrar en auditoría.' }
return apiSuccess(responseBody)
```

`_auditWarning` es un campo `string` opcional en el body de la respuesta exitosa. Aplica a las dos routes que llaman a `registrarAuditoria()`: `PATCH /api/murales/[id]` (actualización de estado de mural) y `PATCH /api/admin/murales/[id]/modificaciones/[modId]` (procesar modificación).

El cliente (páginas admin) solo logea el warning en consola: `if (result._auditWarning) console.warn('[Auditoría]', result._auditWarning)`. No se muestra UI al admin — no es un error que requiera acción del usuario.

---

## Fase 2: Rediseño Frontend — Civic Tech

### Paleta de colores

| Token | Valor | Uso |
|-------|-------|-----|
| `navy` | `#1e3a5f` | Header, sidebar admin |
| `primary` | `#1e40af` | CTAs, acciones primarias |
| `accent` | `#3b82f6` | Links, acentos |
| `amber` | `#d97706` | Estados pendientes, advertencias |
| `success` | `#059669` | Estados aprobados, éxito |
| `danger` | `#dc2626` | Rechazar, errores |
| `bg` | `#f8fafc` | Fondo de página |
| `text` | `#1e293b` | Texto principal |

### Breakpoints de referencia

- **Mobile:** < 640px — layout columna única, FAB flotante
- **Tablet:** 640px–1024px — layout adaptado
- **Desktop:** > 1024px — layout completo con sidebar admin

### Componentes a rediseñar

**Header (`components/page-shell.tsx`):**
- Fondo `#1e3a5f` en lugar del header actual
- Logo: ícono de mapa + "Mural Decorativo" + tagline "Registro de propaganda política · Paraguay"
- Botón "+ Agregar mural" en azul `#1e40af`
- Link "Admin" discreto con fondo `rgba(255,255,255,0.1)`

**Stats bar:**
- Barra horizontal bajo el header, fondo `#f8fafc`, borde inferior
- 4 contadores: Total, Aprobados, Pendientes, Modificados
- Número en color semántico, label uppercase 10px con letter-spacing
- Separadores verticales entre stats
- **Fuente de datos:** Calculados client-side desde el array ya cargado en `useMuralData()` — no requiere nuevo endpoint. Los counts se derivan filtrando por `estado` del array completo.

**Popups del mapa — `lib/map-popup.ts` (nuevo archivo):**
- Firma: `buildPopupHTML(mural: MuralWithModificaciones, modAprobada?: MuralModificacion): string`
- Usar `escapeHtml()` en los siguientes campos del mural: `nombre`, `candidato`, `comentario`, `imagen_url`, `imagen_thumbnail_url`, y las URLs de `modAprobada` si existe
- Popup base (sin `modAprobada`): imagen del mural arriba (60px alto), nombre en bold, candidato + fecha en gris, badge de estado, botones "Ver mapa" y "Reportar" en fila
- Popup con `modAprobada`: comparativa before/after (imagen original | imagen nueva) lado a lado, mismo badge y botones. Mantiene el comportamiento actual del mapa que ya muestra esta comparativa.

**Formularios (`/nuevo` y `/reportar`):**
- Header con fondo `#1e3a5f` + título + subtítulo
- Layout 2 columnas en desktop (datos | foto), 1 columna en mobile
- Labels uppercase 11px con asterisco rojo para requeridos
- Upload zone con área dashed border + ícono + texto
- Botón submit alineado a la derecha, prominente

**Panel Admin:**
- Sidebar oscuro `#0f172a` (180px, fijo)
- Nav items: Murales, Modificaciones, Auditoría, Salir
- Badge rojo con conteo de pendientes en Murales y Modificaciones
- Tabla con header sticky, hover en filas
- Botones de acción con color semántico: verde/rojo para aprobar/rechazar
- Estado como badge pill coloreado

**Mobile:**
- FAB azul `#1e40af` superpuesto al mapa (bottom-right, 48x48px, border-radius 12px) — al hacer click navega a `/nuevo` (misma acción que el botón "+ Agregar mural" del header)
- Stats en 3 columnas compactas
- Inputs con min-height 44px (touch targets)
- Panel admin: tabla con scroll horizontal

### Limpiezas de código

- Eliminar `lib/types-improved.ts` (no se usa en ningún archivo)
- Eliminar del root del proyecto: `design-options.html`, `design-mockup.html`
- Agregar `.superpowers/` a `.gitignore`

---

## Archivos a NO modificar

- `middleware.ts` — (excepto agregar rate limiting del punto 2.5)
- `lib/auth/server.ts` y `lib/auth/client.ts`
- `hooks/use-captcha.ts`
- Lógica de compresión de imágenes en `lib/utils.ts` (solo agregar `escapeHtml` y fix de coordenadas)

---

## Resumen de cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `supabase/schema.sql` | Eliminar (reemplazado por migraciones) |
| `supabase/migrations/20250101000000_init.sql` | Crear (contenido actual de schema.sql) |
| `supabase/migrations/20260326000000_fix_rls_policies.sql` | Crear (RLS fixes) |
| `supabase/seed.sql` | Crear |
| `lib/api-response.ts` | Crear |
| `lib/map-popup.ts` | Crear |
| `lib/utils.ts` | Agregar `escapeHtml()`, fix coordenadas |
| `lib/types-improved.ts` | Eliminar |
| `lib/supabase/server.ts` | Validación env vars |
| `lib/supabase/client.ts` | Validación env vars |
| `lib/auditoria.ts` | Retornar boolean, warning |
| `middleware.ts` | Rate limiting |
| `app/api/upload/route.ts` | Validar MIME type + usar apiResponse |
| `app/api/murales/route.ts` | Usar apiResponse |
| `app/api/murales/[id]/route.ts` | Usar apiResponse |
| `app/api/murales/[id]/report/route.ts` | Usar apiResponse |
| `app/api/admin/murales/route.ts` | Usar apiResponse |
| `app/api/admin/murales/[id]/modificaciones/[modId]/route.ts` | Usar apiResponse |
| `app/api/admin/auditoria/route.ts` | Usar apiResponse |
| `components/map-view.tsx` | Usar buildPopupHTML + rediseño |
| `components/page-shell.tsx` | Rediseño header |
| `components/stats-grid.tsx` | Rediseño stats bar |
| `components/image-uploader.tsx` | Rediseño upload zone |
| `components/estado-badge.tsx` | Ajuste colores |
| `components/admin/mural-row.tsx` | Rediseño tabla |
| `components/admin/filter-buttons.tsx` | Rediseño filtros |
| `app/page.tsx` | Integrar nuevo diseño |
| `app/nuevo/page.tsx` | Rediseño formulario |
| `app/reportar/page.tsx` | Rediseño formulario |
| `app/admin/page.tsx` | Sidebar + tabla nueva |
| `app/admin/login/page.tsx` | Rediseño |
| `app/admin/modificaciones/page.tsx` | Rediseño |
| `app/admin/auditoria/page.tsx` | Rediseño |
| `package.json` | Scripts db:* |
| `.env.local.example` | Actualizar |
| `.gitignore` | Agregar `.superpowers/` |
| `design-options.html` (root) | Eliminar |
| `design-mockup.html` (root) | Eliminar |

---

## Criterios de éxito

**Supabase local:**
- [ ] `yarn db:reset` ejecuta sin errores y puebla la BD con seed data
- [ ] `yarn dev` con `.env.local` apuntando a local arranca sin errores

**Seguridad:**
- [ ] Un usuario anónimo que hace `PATCH /api/admin/murales/:id` recibe 401 o 403
- [ ] Un usuario anónimo que hace UPDATE directo a Supabase en `murales` recibe error de RLS
- [ ] Subir un archivo `.pdf` a `/api/upload` retorna HTTP 400
- [ ] Subir un archivo con MIME type no permitido (ej: `application/pdf`) retorna HTTP 400
- [ ] Una IP que supera 10 POSTs en 60s a `/api/murales` recibe HTTP 429

**Calidad de código:**
- [ ] Todos los fetches del cliente tienen `response.ok` check
- [ ] No hay errores de TypeScript con `yarn build`

**Frontend:**
- [ ] Header azul marino visible en todas las páginas públicas
- [ ] Panel admin tiene sidebar visible en desktop (> 1024px)
- [ ] En mobile (< 640px) el FAB aparece sobre el mapa
- [ ] Los formularios tienen layout 1 columna en mobile, 2 columnas en desktop
