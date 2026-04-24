# Rediseño Civic + SSR integral — Mural Decorativo

**Fecha:** 2026-04-24
**Proyecto:** Murales Políticos — Mapa colaborativo de murales de propaganda política en Paraguay
**Stack:** Next.js 16.2 (App Router) · React 19.2 · TypeScript · Supabase · Tailwind CSS v4 · Leaflet.js
**Estado:** Pre-producción
**Reemplaza:** `2026-03-26-pre-launch-review-design.md` (Fase 2) · `2026-03-26-frontend-redesign.md`

---

## Resumen

Rediseño visual completo + migración a Server Components por default + biblioteca de componentes accesibles (shadcn/ui). El sistema objetivo es "Accessible & Ethical" (WCAG AAA target, AA mínimo) con paleta navy/slate institucional y tipografía IBM Plex Sans. Se reemplazan todas las llamadas client→API interna por reads server-side directos a Supabase y Server Actions para mutaciones admin. Cero emojis como íconos (se usan SVG de Lucide).

Fuera de alcance: schema Supabase, RLS, auth lógica, rate limiting, audit logs (lógica), `/shared/` folder (plan ortogonal), mobile app Expo (plan ortogonal).

---

## Objetivos

1. **SSR correcto** — Server Components por default, Client solo donde hay APIs del browser o interactividad no-trivial.
2. **A11y sólida** — WCAG AA mínimo, AAA donde sea viable; navegación por teclado completa; focus visible 3-4px; respeto a `prefers-reduced-motion`.
3. **Identidad visual consistente** — paleta única, escala tipográfica única, sistema de spacing único, íconos SVG únicos.
4. **Performance perceptible** — Home LCP < 1.5s con datos ya hidratados; admin sin spinners de fetch inicial; skeleton por segmento.
5. **SEO básico** — metadata dinámica, OG image, sitemap, robots.

---

## Criterios de éxito (verificables)

| # | Criterio | Método |
|---|---|---|
| 1 | `yarn build` sin errores ni warnings | CLI |
| 2 | Lighthouse home: Performance ≥ 95, A11y ≥ 95, Best Practices ≥ 95, SEO 100 | Chrome DevTools |
| 3 | No hay emoji usado como ícono estructural | grep `/[🗺🔄📋➕✕→×✓]/` en `app/` y `components/` retorna vacío |
| 4 | Todos los pares texto/fondo cumplen 4.5:1 (normal) o 3:1 (large) | axe DevTools |
| 5 | Tab order = orden visual en `/`, `/nuevo`, `/admin` | Test manual con teclado |
| 6 | Skip link funcional en todas las páginas | Tab desde inicio |
| 7 | Funciona en 375/768/1024/1440px sin horizontal scroll | Chrome DevTools responsive |
| 8 | `prefers-reduced-motion: reduce` desactiva animaciones | DevTools Rendering tab |
| 9 | Home: datos de murales llegan en el HTML inicial (ver "View Source") | Chrome "View Source" |
| 10 | Admin navega entre páginas sin spinner de fetch inicial | Manual |
| 11 | Touch targets ≥ 44×44px en mobile | Chrome DevTools |
| 12 | `yarn dev` sin errores de consola al cargar cada ruta | Manual |

---

## Arquitectura

### División Server/Client por página

| Ruta | Page | Loading | Error | Notas |
|---|---|---|---|---|
| `/` | Server | Skeleton stats + mapa | `error.tsx` | Lee murales filtrados por `searchParams` |
| `/nuevo` | Server shell | — | `error.tsx` | Form es Client Component |
| `/reportar` | Server shell | — | `error.tsx` | Form es Client Component |
| `/admin/login` | Server shell | — | `error.tsx` | Form es Client Component |
| `/admin` | Server | Skeleton tabla | `error.tsx` | Paginación vía `searchParams` |
| `/admin/modificaciones` | Server | Skeleton tabla | `error.tsx` | Idem |
| `/admin/auditoria` | Server | Skeleton tabla | `error.tsx` | Read-only |

### Data layer

**Nuevos módulos en `lib/queries/`:**

```
lib/queries/
  murales.ts       ← getMuralesAprobados({q?, estado?}), getMuralById(id), getMuralesStats()
  admin-murales.ts ← getAllMurales({page, pageSize, estado?, q?}), countMuralesPendientes()
  modificaciones.ts← getModificacionesPendientes({page, pageSize})
  auditoria.ts     ← getAuditoria({page, pageSize, accion?, desde?, hasta?})
```

Cada función es async, usa `createServerClient` de `@supabase/ssr` con `cookies()` de Next 16, y retorna tipos de `lib/types.ts` o `{ data, total }` para paginados.

**Cache policy a nivel de página:**

```ts
// app/page.tsx (home)
export const revalidate = 60 // ISR: 60s

// app/admin/*/page.tsx
export const dynamic = 'force-dynamic'
```

**Tags de cache** en queries públicas: `['murales']`. Se invalidan con `revalidateTag('murales')` desde Server Actions admin después de aprobar/rechazar.

### Mutaciones con Server Actions

**Nuevo: `app/admin/_actions/murales.ts`, `app/admin/_actions/modificaciones.ts`.**

Firmas:

```ts
'use server'
export async function aprobarMuralAction(id: string): Promise<ActionResult>
export async function rechazarMuralAction(id: string, motivo: string): Promise<ActionResult>
export async function aprobarModificacionAction(muralId: string, modId: string): Promise<ActionResult>
export async function rechazarModificacionAction(muralId: string, modId: string, motivo: string): Promise<ActionResult>

type ActionResult = { success: true } | { success: false; error: string }
```

Cada una:
1. Verifica auth con `getUser()`
2. Ejecuta la mutación Supabase
3. Llama `registrarAuditoria()` existente
4. `revalidateTag('murales')` + `revalidatePath('/admin/...')` según corresponda
5. Retorna `ActionResult`

**API routes existentes:** se mantienen. `/api/upload` y `/api/murales/[id]/report` siguen siendo públicas (útiles para mobile app). Las rutas admin bajo `/api/admin/*` se mantienen por ahora como respaldo (no se eliminan en este spec).

### Proxy (`proxy.ts`)

Next 16 renombra `middleware.ts` a `proxy.ts`. El proyecto ya tiene el archivo. Se amplía con:

1. **Refresh de sesión Supabase** — crear `createServerClient` con `cookies.getAll` / `cookies.setAll` de `request/response`, llamar `await supabase.auth.getUser()` antes de responder. Este paso es **obligatorio** según docs de `@supabase/ssr` para que las sesiones se mantengan vivas.
2. **Rate limiting existente** — preservar tal cual.
3. **Guard admin** — si la ruta empieza con `/admin` (excepto `/admin/login`) y `getUser()` retorna null → redirect a `/admin/login`.

Orden: rate-limit → session refresh → admin guard → next.

---

## Sistema de diseño

### Paleta (CSS variables en `app/globals.css`)

**Light mode:**

```css
:root {
  --background: 0 0% 100%;            /* #FFFFFF */
  --foreground: 222 47% 4%;           /* #020617 */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 4%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 4%;
  --primary: 222 47% 11%;             /* #0F172A navy */
  --primary-foreground: 0 0% 100%;
  --secondary: 215 25% 27%;           /* #334155 slate */
  --secondary-foreground: 0 0% 100%;
  --muted: 210 20% 93%;               /* #E8ECF1 */
  --muted-foreground: 215 16% 47%;    /* #64748B */
  --accent: 201 96% 32%;              /* #0369A1 azul link */
  --accent-foreground: 0 0% 100%;
  --destructive: 0 72% 41%;           /* #B91C1C AA sobre blanco */
  --destructive-foreground: 0 0% 100%;
  --success: 160 84% 30%;             /* #059669 */
  --success-foreground: 0 0% 100%;
  --warning: 32 91% 36%;              /* #B45309 AA sobre blanco */
  --warning-foreground: 0 0% 100%;
  --border: 214 32% 91%;              /* #E2E8F0 */
  --input: 214 32% 91%;
  --ring: 201 96% 32%;                /* foco = accent */
  --radius: 0.5rem;                   /* 8px base */
}
```

**Dark mode** (`.dark`): variantes desaturadas, no inversión directa. `--primary` se mantiene navy pero el background sube a `222 47% 7%`, accent sube a `201 90% 55%` para mantener contraste. Detalles completos se derivan de `baseColor: slate` de shadcn init.

### Tipografía

**Fuente:** IBM Plex Sans via `next/font/google`:

```ts
// app/layout.tsx
import { IBM_Plex_Sans } from 'next/font/google'
const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
})
```

Aplicar `plex.variable` en `<html>` y `font-family: var(--font-plex), system-ui, sans-serif` en Tailwind theme. Remover `<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />` del layout actual.

**Escala tipográfica:**

| Token | Tamaño | Line-height | Uso |
|---|---|---|---|
| `text-xs` | 12px | 16px | Labels, meta |
| `text-sm` | 14px | 20px | Body compacto, tabla admin |
| `text-base` | 16px | 24px | Body default |
| `text-lg` | 18px | 28px | Intro |
| `text-xl` | 20px | 28px | Subtítulos de sección |
| `text-2xl` | 24px | 32px | Títulos h3 |
| `text-3xl` | 30px | 36px | Títulos h2 |
| `text-4xl` | 36px | 40px | Títulos h1 públicos |

**Números tabulares:** `font-variant-numeric: tabular-nums` en stats y columnas numéricas del admin para evitar layout shift.

### Iconografía

**Librería:** `lucide-react`. Stroke 1.5, tamaños `16 | 20 | 24`. Uso:

```tsx
import { Map, Plus, LogOut, GitCompare, ClipboardList } from 'lucide-react'
<Map className="size-5" aria-hidden="true" />
```

**Reemplazos obligatorios** (el sidebar admin actual usa emojis):
- 🗺 → `Map`
- 🔄 → `GitCompare`
- 📋 → `ClipboardList`
- ➕ → `Plus`
- ✕ → `X`
- → → `ArrowRight`

Ícono siempre con `aria-hidden="true"` si está junto a texto; con `aria-label` si es solo ícono.

### Spacing & radius

- **Spacing scale:** 4/8/12/16/20/24/32/40/48/64 (Tailwind default)
- **Radius:** `--radius-sm: 6px`, `--radius-md: 8px` (default), `--radius-lg: 12px`
- **Shadows:** 3 niveles — `shadow-sm` (cards), `shadow-md` (dropdowns, popovers), `shadow-lg` (modales, sheet)

### Focus ring

**Global:**

```css
*:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 2px;
}
```

No eliminar el outline en ningún componente. shadcn lo maneja con `ring-*` utilities — mantenemos esa convención en componentes custom.

### Animaciones

**Tokens:** todas las transiciones UI usan `duration-200` por default, `ease-out` al entrar, `ease-in` al salir. Animar solo `transform` y `opacity`. Nada de `width/height/top/left`.

**Reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Componentes base

### De shadcn/ui (instalar en este orden)

```
button, input, label, textarea, card, badge, alert, skeleton,
tooltip, dropdown-menu, select, dialog, sheet, tabs,
toggle-group, form, sonner
```

Cada uno queda en `components/ui/<nombre>.tsx`. Config:

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Componentes custom (sobre shadcn)

Ubicación: `components/`.

| Componente | Server/Client | Propósito |
|---|---|---|
| `site-header.tsx` | Server | Header navy con logo + búsqueda + CTA |
| `admin-sidebar.tsx` | Client (needs pathname) | Sidebar navy oscuro con Lucide icons + badges |
| `stats-bar.tsx` | Server | 4 counters con tabular nums |
| `mural-map.tsx` | Client (Leaflet) | El mapa — recibe `murales: Mural[]` por props |
| `search-bar.tsx` | Client | Input con debounce que actualiza `searchParams` |
| `filter-chips.tsx` | Client | ToggleGroup de estados |
| `image-uploader.tsx` | Client | Dashed-border, preview, progress (refactor del actual) |
| `mural-form.tsx` | Client | Form de `/nuevo` con react-hook-form + zod |
| `reporte-form.tsx` | Client | Form de `/reportar` |
| `estado-badge.tsx` | — | Badge con variant por estado |
| `skip-link.tsx` | — | `<a href="#main">` oculto hasta foco |
| `error-view.tsx` | — | Usado por `error.tsx` de cada segmento |
| `empty-state.tsx` | — | Ícono + título + descripción + CTA opcional |

### Componentes admin

| Componente | Server/Client | Propósito |
|---|---|---|
| `admin/murales-table.tsx` | Server | Tabla con header sticky, zebra, hover |
| `admin/mural-row-actions.tsx` | Client | Botones aprobar/rechazar que llaman Server Actions |
| `admin/filters-bar.tsx` | Client | Select + input que actualiza searchParams |
| `admin/pagination.tsx` | Server | Controles que linkean a `?page=N` |
| `admin/auditoria-table.tsx` | Server | Tabla read-only de auditoría |
| `admin/modificacion-card.tsx` | Server | Card before/after |
| `admin/modificacion-actions.tsx` | Client | Aprobar/rechazar modificación |

---

## Páginas — cambios específicos

### `/` (home)

**Estructura:**

```
<body>
  <SkipLink />
  <SiteHeader />           {/* sticky top, navy */}
  <main id="main">
    <StatsBar />           {/* 4 counters */}
    <FilterChips />        {/* toggle: Todos | Aprobados | Modificados */}
    <SearchBar />          {/* busca por nombre/candidato */}
    <MuralMap />           {/* full-width, calc(100dvh - header - stats) */}
  </main>
  <FABNuevo />             {/* solo mobile */}
  <Toaster />
</body>
```

**Data:** `searchParams: { q?, estado? }` → `getMuralesAprobados({ q, estado })` → pasa array a `<MuralMap>`.

**Metadata:**

```ts
export async function generateMetadata() {
  const stats = await getMuralesStats()
  return {
    title: `${stats.aprobados} murales registrados · Murales Políticos Paraguay`,
    description: `Mapa colaborativo con ${stats.aprobados} murales de propaganda política documentados en Paraguay.`,
    openGraph: { ... }
  }
}
```

### `/nuevo`

- Layout: 2 columnas desktop (form | upload), 1 columna mobile
- Form: react-hook-form + zod schema con mensajes en español
- Inputs: min-height 48px, labels visibles arriba, asterisco rojo en required, error debajo del input con `role="alert"` y `aria-live="polite"`
- Submit sticky en mobile
- MapPicker sigue siendo Client (Leaflet)

### `/reportar`

Igual patrón que `/nuevo` pero simpler: muestra card con info del mural prefijado por `?id=&name=`, form con motivo + imagen opcional.

### `/admin`

- Sidebar fijo en `lg+`, drawer en mobile (shadcn `Sheet`)
- Tabla con columnas: Thumbnail, Nombre, Candidato, Estado, Fecha, Acciones
- Filtros arriba: select estado, input búsqueda, date-range
- Paginación abajo: controles Server-rendered que navegan con searchParams
- Acciones por fila llaman a Server Actions; on success → toast + revalidate automático

### `/admin/modificaciones`

- Layout cards (no tabla): cada modificación es una card con before/after lado a lado
- Botones aprobar/rechazar con confirmación (shadcn Dialog)

### `/admin/auditoria`

- Tabla read-only, paginada server-side
- Filtros: acción, rango de fechas
- Sin export CSV en este spec (fuera de scope)

### `/admin/login`

- Card centrada, max-width 420px
- Form con email/password usando react-hook-form + zod
- Client Component que llama `supabase.auth.signInWithPassword` directamente y luego `router.refresh()` + redirect a `/admin`
- No usar Server Action aquí (el flujo actual de `@supabase/ssr` en cliente es más directo)

---

## Utilidades modificadas

### `lib/utils.ts` → `compressImage`

Cambios:
- Salida: `image/webp` en lugar de `image/jpeg`
- Respeto a EXIF orientation: leer tag orientation antes de redimensionar, aplicar rotación correspondiente al canvas
- Mantener dos resoluciones (original 800×800 calidad 0.8, thumb 300×300 calidad 0.7)
- Firma compatible: retorna `File` con extensión `.webp` y `type: 'image/webp'`

Consecuencia: `app/api/upload/route.ts` ya acepta `image/webp` en `ALLOWED_MIME_TYPES` (`app/api/upload/route.ts:5`) — no requiere cambio.

### `lib/map-popup.ts`

Mantener función existente pero:
- Actualizar tipografía del HTML generado para usar `font-family: var(--font-plex), system-ui`
- Reemplazar emoji actuales por SVG inline de Lucide (serializados como string por ser HTML no React)
- `escapeHtml()` ya está aplicado en los 14 puntos de interpolación — no tocar esa lógica

### `proxy.ts`

Ver sección "Arquitectura / Proxy".

---

## SEO

- `app/robots.ts` → permite crawl de `/`, `/nuevo`, `/reportar`; bloquea `/admin/*`
- `app/sitemap.ts` → lista rutas estáticas + dinámicas por mural aprobado (si se decide hacer páginas de detalle; caso contrario solo estáticas)
- `app/opengraph-image.tsx` → genera 1200×630 dinámica con stats actuales usando `ImageResponse`
- `app/icon.tsx` → favicon generado con ImageResponse o SVG estático en `app/`

Metadata por ruta:

| Ruta | Title | Description |
|---|---|---|
| `/` | `N murales registrados · Murales Políticos Paraguay` | Con count real |
| `/nuevo` | `Registrar mural · Murales Políticos` | Fija |
| `/reportar` | `Reportar mural · Murales Políticos` | Fija |
| `/admin/*` | — | `robots: { index: false, follow: false }` |

---

## Archivos: crear / modificar / eliminar

### Crear

```
app/
  loading.tsx                          (skeleton global fallback)
  error.tsx                            (error global)
  robots.ts
  sitemap.ts
  opengraph-image.tsx
  icon.tsx
  admin/
    _actions/
      murales.ts                       (server actions)
      modificaciones.ts
    loading.tsx
    error.tsx
  nuevo/error.tsx
  reportar/error.tsx

components/
  ui/                                  (shadcn: button, input, label, textarea, card,
                                        badge, alert, skeleton, tooltip, dropdown-menu,
                                        select, dialog, sheet, tabs, toggle-group, form,
                                        sonner)
  site-header.tsx
  stats-bar.tsx                        (refactor de stats-grid.tsx)
  mural-map.tsx                        (refactor de map-view.tsx)
  search-bar.tsx
  filter-chips.tsx
  skip-link.tsx
  error-view.tsx
  empty-state.tsx
  mural-form.tsx                       (extraído de app/nuevo/page.tsx)
  reporte-form.tsx                     (extraído de app/reportar/page.tsx)
  admin/
    admin-sidebar.tsx                  (refactor del actual)
    murales-table.tsx
    mural-row-actions.tsx
    filters-bar.tsx
    pagination.tsx
    auditoria-table.tsx
    modificacion-card.tsx
    modificacion-actions.tsx

lib/queries/
  murales.ts
  admin-murales.ts
  modificaciones.ts
  auditoria.ts

lib/schemas/                           (zod schemas)
  mural.ts
  reporte.ts

components.json                        (shadcn config)
```

### Modificar

```
app/
  layout.tsx                           (IBM Plex Sans, Toaster, skip link)
  globals.css                          (tokens shadcn, animation, reduced motion)
  page.tsx                             (→ Server Component)
  nuevo/page.tsx                       (→ Server shell + Client form)
  reportar/page.tsx                    (idem)
  admin/page.tsx                       (→ Server Component con queries)
  admin/login/page.tsx                 (rediseño)
  admin/modificaciones/page.tsx        (→ Server Component)
  admin/auditoria/page.tsx             (→ Server Component)

components/
  page-shell.tsx                       (reemplazar con site-header + admin-sidebar)
  image-uploader.tsx                   (rediseño con shadcn primitives)
  estado-badge.tsx                     (usa Badge shadcn)
  form-field.tsx                       (usa Form + Input shadcn)
  status-alert.tsx                     (reemplazar por sonner)
  image-modal.tsx                      (usa Dialog shadcn)
  map-view.tsx                         (→ mural-map.tsx, mantener Leaflet dynamic import)

lib/
  utils.ts                             (compressImage → WebP + EXIF)
  map-popup.ts                         (tipografía, sin emojis)

proxy.ts                               (+ supabase session refresh + admin guard)
package.json                           (nuevas deps)
next.config.ts                         (si es necesario por next/og o images)
tsconfig.json                          (posibles paths nuevos si shadcn los pide)
```

### Eliminar

```
components/captcha-field.tsx           (confirmado sin referencias)
docs/superpowers/specs/2026-03-26-pre-launch-review-design.md
docs/superpowers/plans/2026-03-26-frontend-redesign.md
```

Nota: en la ejecución, correr `grep -r "captcha-field\|use-captcha" app/ components/ hooks/ lib/` antes de eliminar, para confirmar una vez más que no hay imports.

---

## Dependencias

### Agregar

```json
"dependencies": {
  "lucide-react": "^0.454.0",
  "class-variance-authority": "^0.7.1",
  "@radix-ui/react-slot": "^1.1.2",
  "@radix-ui/react-label": "^2.1.2",
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-select": "^2.1.6",
  "@radix-ui/react-tabs": "^1.1.3",
  "@radix-ui/react-toggle-group": "^1.1.2",
  "@radix-ui/react-tooltip": "^1.1.8",
  "sonner": "^1.7.4",
  "react-hook-form": "^7.54.2",
  "zod": "^3.24.2",
  "@hookform/resolvers": "^3.10.0"
}
```

Nota: versiones son las actuales al 2026-04; al instalar usar `npx shadcn@latest add <comp>` que fija versiones compatibles.

### Remover

```json
"react-modal": "^3.16.3",
"@types/react-modal": "^3.16.3"
```

(reemplazado por shadcn `Dialog` que usa Radix).

---

## Orden de ejecución sugerido (para el plan de implementación)

1. **Setup** — instalar shadcn, configurar `components.json`, tokens en `globals.css`, IBM Plex Sans
2. **Fundamentos** — skip link, `error.tsx` y `loading.tsx` por segmento, tokens de animación
3. **Data layer** — `lib/queries/*` y Server Actions
4. **Componentes base custom** — site-header, stats-bar, skip-link, empty-state, error-view
5. **Home** — rediseño `/` con Server Component + búsqueda + filtros
6. **Forms públicos** — `/nuevo` y `/reportar` con react-hook-form + zod
7. **Admin sidebar + login** — admin-sidebar con Lucide, /admin/login
8. **Admin tablas + Server Actions** — `/admin`, `/admin/modificaciones`, `/admin/auditoria`
9. **Proxy extendido** — session refresh + admin guard
10. **SEO** — robots, sitemap, OG image, metadata dinámica
11. **Imágenes** — compressImage → WebP + EXIF
12. **Limpieza** — remover deps obsoletas, archivos sin uso, docs superseded
13. **Verificación final** — Lighthouse, axe, teclado, 375px, reduced motion

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Leaflet rompe con SSR | Alto | Mantener `dynamic(import, { ssr: false })` en `MuralMap`; no cambiar esa parte |
| shadcn init sobreescribe `globals.css` existente | Medio | Correr `init` primero, después aplicar tokens customizados sobre base generada |
| Server Actions vs Supabase RLS | Medio | Actions usan `createServerClient` con cookies del usuario → RLS aplica normalmente |
| `revalidateTag` no invalida si la ruta es static | Medio | Usar `revalidatePath` además de `revalidateTag` en mutaciones admin |
| IBM Plex Sans pesa más que system font | Bajo | `display: swap` + subset latin, cargar solo 400/500/600/700 |
| `react-hook-form` + `zod` agregan ~25 KB | Bajo | Solo se cargan en páginas con forms (client chunk) |
| Migración WebP rompe thumbnails existentes | Medio | No reprocesar imágenes antiguas; nuevas se suben como WebP, antiguas siguen sirviéndose tal cual |
| Pérdida de estado al rediseñar admin | Medio | Paginación y filtros van a searchParams → preservan en URL → navegación back funciona |

---

## Fuera de alcance (explícito)

- `/shared/` folder (plan `2026-04-05-monorepo-web-mobile.md`)
- App móvil Expo (plan `2026-04-05-monorepo-web-mobile.md`)
- Schema Supabase o migraciones nuevas
- RLS policies
- Lógica de autenticación (`lib/auth/*`)
- Rate limiting (lógica)
- Lógica de `registrarAuditoria`
- Captcha (si existe lógica, se mantiene tal cual)
- Internacionalización — sigue solo en es-PY
- Tests automatizados — el proyecto no tiene y no se agregan en este spec
- Detalle de mural en página propia (`/mural/[id]`) — se mantiene popup en mapa

---

## Anexo — Referencias

- **ui-ux-pro-max** `--design-system` con query `"civic collaborative map political propaganda public reporting paraguay trust serious"` → Style "Accessible & Ethical", IBM Plex Sans, paleta navy+blue
- **context7 `/vercel/next.js/v16.2.2`** — patrones oficiales de data fetching, `generateMetadata`, ISR con `revalidate`
- **context7 `/supabase/ssr`** — `createServerClient` con cookies, middleware obligatorio para refresh, `getUser()` para auth
- **context7 `/shadcn-ui/ui`** — init CLI, `components.json`, theming con CSS variables
