# Murales Políticos

> Mapa colaborativo para registrar y documentar murales de propaganda política en Paraguay.

**Live:** [murales-politicos.vercel.app](https://murales-politicos.vercel.app)

Cualquier persona puede reportar un mural con foto, ubicación y candidato asociado. Un panel de administración con auditoría revisa cada reporte antes de publicarlo. También se pueden reportar murales eliminados o modificados, con comparativa antes/después.

---

## Tabla de contenidos

- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Setup local](#setup-local)
- [Scripts disponibles](#scripts-disponibles)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [Flujos principales](#flujos-principales)
- [Convenciones de código](#convenciones-de-código)
- [Seguridad](#seguridad)
- [Rendimiento](#rendimiento)
- [Accesibilidad](#accesibilidad)
- [Despliegue](#despliegue)
- [Contribuir](#contribuir)

---

## Características

- **Mapa público** con filtro por estado (todos / aprobados / modificados) y datos server-side renderizados.
- **Formulario público** para reportar un mural nuevo: nombre, candidato opcional, ubicación en el mapa (Leaflet) y foto.
- **Reporte de eliminación o modificación** de murales existentes, con imagen antes/después para las modificaciones.
- **Panel de administración** con tabla paginada, filtros y acciones de aprobar/rechazar vía Server Actions.
- **Log de auditoría** inmutable con admin, IP, user-agent y snapshot de datos antes/después por cada acción.
- **Navegación mobile** con drawer (shadcn Sheet) en el admin y FAB en el mapa público.
- **Compresión cliente** de imágenes a WebP respetando orientación EXIF antes de subir a Storage.
- **SEO** con metadata dinámica, Open Graph image generada en el servidor, sitemap y robots.
- **Accesibilidad** con focus rings visibles, skip link, soporte de `prefers-reduced-motion` y objetivos táctiles ≥ 44×44.

---

## Stack técnico

| Capa | Tecnología | Versión |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.2 |
| Runtime | Node.js | 24 LTS (Vercel) |
| UI | React | 19.2 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | v4 (modo JIT + `@theme`) |
| Componentes base | shadcn/ui | new-york · slate |
| Iconos | lucide-react | — |
| Formularios | react-hook-form + zod + @hookform/resolvers | — |
| Notificaciones | sonner | — |
| Mapa | Leaflet.js + OpenStreetMap tiles | 1.9 |
| Backend | Supabase (PostgreSQL + Storage + Auth) | cloud |
| Cliente SSR Supabase | @supabase/ssr | 0.8 |
| Tipografía | IBM Plex Sans | vía `next/font/google` |
| Analytics | Vercel Analytics + Speed Insights | — |
| Lint / Format | ESLint 10 + Prettier 3 | — |
| Deploy | Vercel | — |

La paleta sigue el estilo "Accessible & Ethical" (WCAG AA/AAA target): navy `#0F172A` como primary, slate secundario, azul `#0369A1` como accent, con variantes desaturadas para dark mode definidas en `app/globals.css`.

---

## Arquitectura

El proyecto es un **monolito Next.js App Router** con foco en **Server Components por default**. Client Components se usan sólo cuando hay APIs de browser (Leaflet), interactividad no-trivial (forms, diálogos) o event handlers.

### Principios de diseño

1. **Server by default.** Toda página es Server Component. Data fetching con Supabase se hace directamente en el servidor vía `lib/queries/*`, sin pasar por un endpoint JSON intermedio.
2. **Server Actions para mutaciones de admin.** `app/admin/_actions/*` expone acciones type-safe que verifican auth, ejecutan la mutación, registran auditoría y llaman a `revalidatePath` para invalidar caches.
3. **API Routes para escritura pública y uploads.** `/api/murales`, `/api/murales/[id]/report`, `/api/upload` — accesibles sin sesión, validadas con zod, rate-limited.
4. **Suspense boundaries granulares.** El shell (header, sidebar, stats) queda montado entre navegaciones; sólo la sección dinámica muestra skeleton y re-streamea cuando cambian los `searchParams`.
5. **Route groups para layouts compartidos.** `/admin/(panel)/*` usa un layout común con sidebar + header que persiste al navegar entre tabs.
6. **Proxy (ex-middleware) como punto único de auth + rate limit.** `proxy.ts` valida la sesión Supabase, rate-limita POSTs y redirige `/admin/*` a `/admin/login` cuando no hay usuario.

### Flujo de un request a `/`

```
Browser → Vercel Edge → proxy.ts (refresh Supabase session)
                      → app/page.tsx (Server Component)
                        ├── getMuralesStats() via createServerClient    (renders shell)
                        └── <Suspense key={filters}>
                              └── HomeMapSection
                                    └── getMuralesAprobados(filters)
                                          ↓ stream HTML to browser
                                          ↓ hidrata <MuralMap> (Client, Leaflet)
```

### Flujo de aprobación de un mural (admin)

```
Admin clickea "Aprobar" en la tabla
    → MuralRowActions (Client)
    → useTransition + aprobarMuralAction (Server Action)
        ├── requireAdminClient() verifica sesión
        ├── supabase.from('murales').update({ estado: 'aprobado' })
        ├── registrarAuditoria({ accion, entidadId, datosNuevos })
        └── revalidatePath('/admin'), revalidatePath('/')
    ← toast("Mural aprobado")
```

### Decisiones clave y trade-offs

- **Server Actions vs API Routes.** Mutaciones de admin usan Server Actions (type-safe de extremo a extremo, invalidación automática). Mutaciones públicas usan API routes (accesibles desde clientes externos como una eventual app móvil).
- **`revalidatePath` sobre `revalidateTag`.** Los queries usan el SDK de Supabase, no `fetch()` con tags — `revalidateTag` sería no-op, así que usamos `revalidatePath` sobre las rutas afectadas.
- **`force-dynamic` en admin, `revalidate: 60` en home.** El mapa público se beneficia de caché corto (1 minuto); el admin exige datos frescos por acción.
- **Leaflet client-side.** Leaflet necesita `window`, por lo que `components/mural-map.tsx` y `components/map-picker.tsx` son Client Components detrás de `dynamic(..., { ssr: false })`.
- **Compresión en el cliente.** `lib/compression.ts` comprime imágenes en el browser con `createImageBitmap({ imageOrientation: 'from-image' })` y las sube como WebP, reduciendo ancho de banda y respetando la orientación EXIF de fotos de celular.

---

## Estructura del proyecto

```
.
├── app/
│   ├── (rutas públicas)
│   │   ├── page.tsx                    Mapa público (Server Component, revalidate: 60)
│   │   ├── nuevo/page.tsx              Form para reportar mural nuevo
│   │   ├── reportar/page.tsx           Form para reportar eliminación/modificación
│   │   ├── layout.tsx                  Raíz: fuente, metadata, viewport, Toaster, SkipLink
│   │   ├── globals.css                 Tokens shadcn + reduced-motion + skip link
│   │   ├── loading.tsx | error.tsx | not-found.tsx
│   │   ├── opengraph-image.tsx         OG 1200×630 con stats reales
│   │   ├── icon.tsx | sitemap.ts | robots.ts
│   │
│   ├── admin/
│   │   ├── login/                      Página de login (sin sidebar)
│   │   ├── (panel)/                    Route group con layout compartido
│   │   │   ├── layout.tsx              Sidebar + header + main wrapper
│   │   │   ├── loading.tsx | error.tsx
│   │   │   ├── page.tsx                Tabla de murales + acciones
│   │   │   ├── modificaciones/page.tsx Cards before/after con aprobar/rechazar
│   │   │   └── auditoria/page.tsx      Log read-only paginado
│   │   └── _actions/                   Server Actions (no generan rutas)
│   │       ├── murales.ts              aprobar/rechazar/actualizarEstado
│   │       └── modificaciones.ts       aprobar/rechazar modificación
│   │
│   └── api/                            Route handlers (runtime: nodejs)
│       ├── murales/route.ts            POST público (crear mural)
│       ├── murales/[id]/route.ts       PATCH autenticado (cambiar estado)
│       ├── murales/[id]/report/route.ts POST público (reporte eliminación/modificación)
│       ├── admin/murales/*             Endpoints admin (legacy, reemplazados por Server Actions)
│       ├── upload/route.ts             Upload a Supabase Storage (rate-limited)
│       └── ping/route.ts               Health check para cron keepalive
│
├── components/
│   ├── ui/                             shadcn/ui (button, input, card, dialog, sheet, etc.)
│   ├── admin/                          Componentes específicos del panel admin
│   │   ├── admin-sidebar.tsx           AdminSidebar (desktop) + AdminMobileNavTrigger (drawer)
│   │   ├── murales-table-section.tsx   Tabla async + skeleton
│   │   ├── mural-row-actions.tsx       Botones aprobar/rechazar (Server Action)
│   │   ├── modificacion-card.tsx, modificacion-actions.tsx
│   │   ├── auditoria-table.tsx, auditoria-section.tsx
│   │   ├── filters-bar.tsx, pagination.tsx
│   ├── site-header.tsx                 Header navy sticky con leading slot opcional
│   ├── stats-bar.tsx                   4 counters con tabular nums
│   ├── filter-chips.tsx, search-bar.tsx
│   ├── mural-map.tsx                   Leaflet render + markers + popups
│   ├── map-field.tsx, map-picker.tsx   Selector de ubicación para forms
│   ├── mural-form.tsx, reporte-form.tsx  Forms con rhf + zod
│   ├── image-uploader.tsx              Dashed-border drop zone con preview (revokes ObjectURL)
│   ├── image-modal.tsx                 Preview grande en Dialog
│   ├── estado-badge.tsx, empty-state.tsx, error-view.tsx, skip-link.tsx
│   ├── admin-login-form.tsx
│   └── home-map-section.tsx, home-map-client.tsx
│
├── lib/
│   ├── env.ts                          Valida process.env con zod al cargar el módulo
│   ├── utils.ts                        Sólo `cn` (clsx + tailwind-merge)
│   ├── formatting.ts                   formatDate, escapeHtml
│   ├── compression.ts                  compressImage → WebP + EXIF
│   ├── maps.ts                         extractCoordinates, generateGoogleMapsUrl, isValidGoogleMapsUrl
│   ├── upload.ts                       uploadImage, uploadImageWithThumbnail
│   ├── types.ts                        Dominio: Mural, MuralModificacion, Auditoria, EstadoMural
│   ├── constants.ts                    DEFAULT_COORDINATES, IMAGE_COMPRESSION, MURAL_ESTADOS
│   ├── messages.ts                     Mensajes UI centralizados (MESSAGES.SUCCESS, ERROR, VALIDATION)
│   ├── api-response.ts                 apiError, apiSuccess helpers para Route Handlers
│   ├── auditoria.ts                    registrarAuditoria() con IP + user-agent
│   ├── map-popup.ts                    buildPopupHTML con escapeHtml + SVG icons inline
│   ├── auth/
│   │   ├── server.ts                   requireAuth, requireAdminClient, getAuthenticatedUser
│   │   ├── client.ts                   getClientUser
│   │   └── types.ts                    AuthUser
│   ├── supabase/
│   │   ├── server.ts                   createClient() para Server Components / Route Handlers
│   │   └── client.ts                   createClient() para Client Components
│   ├── queries/
│   │   ├── murales.ts                  getMuralesAprobados, getMuralById, getMuralesStats
│   │   ├── admin-murales.ts            getAllMurales paginado, countMuralesPendientes, etc.
│   │   ├── modificaciones.ts           getModificacionesPendientes
│   │   └── auditoria.ts                getAuditoria con filtros
│   └── schemas/
│       ├── mural.ts                    muralSchema (zod)
│       └── reporte.ts                  reporteSchema (zod)
│
├── hooks/
│   └── use-image-upload.ts             Pipeline compresión + upload + loading state
│
├── supabase/
│   ├── config.toml                     Config del CLI local
│   ├── migrations/
│   │   ├── 20250101000000_init.sql     Schema inicial + RLS + storage bucket
│   │   └── 20260326000000_fix_rls_policies.sql
│   ├── seed.sql                        Datos de prueba
│   └── snippets/                       Consultas útiles
│
├── public/                             Marker icons, shadow, favicon
├── proxy.ts                            Rate limit + Supabase session refresh + admin guard
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs                   ESLint 10 flat config (next/core-web-vitals + typescript + prettier)
├── .prettierrc.json | .prettierignore
├── components.json                     shadcn config
└── docs/superpowers/                   Specs y plans históricos del rediseño
```

---

## Setup local

### Requisitos

- **Node.js** 20+ (24 LTS recomendado)
- **Yarn** 1.22+
- Cuenta **Supabase** (gratuita) o **Docker Desktop** para ambiente 100% local

### 1. Clonar e instalar

```bash
git clone https://github.com/NeryC/MuralesDecorativos.git
cd MuralesDecorativos
yarn install
```

### 2. Configurar Supabase

**Opción A — Supabase cloud (recomendado para desarrollo):**

1. Crear un proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
2. `Project Settings → API Keys (Legacy)` para obtener el **anon key JWT** (empieza con `eyJ...`). El nuevo formato `sb_publishable_*` todavía no es compatible con el `@supabase/ssr` 0.8 usado aquí.
3. `SQL Editor → New query`, pegar el contenido de `supabase/migrations/20250101000000_init.sql` + `20260326000000_fix_rls_policies.sql` y ejecutar.
4. Crear un usuario admin en `Authentication → Users → Add user → Create new user` (marcar "Auto Confirm").

**Opción B — Supabase local (requiere Docker):**

```bash
npx supabase start       # Levanta Postgres + Auth + Storage local
yarn db:reset             # Aplica migrations + seed
# Copiar el anon key del output a .env.local
```

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

`lib/env.ts` valida estas variables con zod al cargar y falla ruidosamente si faltan o son inválidas.

### 4. Correr en desarrollo

```bash
yarn dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 5. Acceder al admin

Ir a [http://localhost:3000/admin/login](http://localhost:3000/admin/login) con las credenciales del usuario creado en el paso 2.4. El middleware (`proxy.ts`) redirige a `/admin/login?next=%2Fadmin` si no hay sesión.

---

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `yarn dev` | Dev server con Turbopack |
| `yarn build` | Build de producción |
| `yarn start` | Servidor de producción |
| `yarn lint` | ESLint sobre `app/`, `components/`, `lib/`, `hooks/` |
| `yarn lint:fix` | ESLint con `--fix` |
| `yarn format` | Prettier write sobre todo el repo |
| `yarn format:check` | Prettier check (no escribe) |
| `yarn db:start` | Levanta Supabase local (requiere Docker) |
| `yarn db:stop` | Apaga Supabase local |
| `yarn db:reset` | Resetea DB local y aplica migrations + seed |
| `yarn db:migrate` | Aplica migrations nuevas |

---

## Esquema de base de datos

### `murales`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | PK, `gen_random_uuid()` |
| `created_at` | timestamptz | `now()` |
| `updated_at` | timestamptz | trigger que actualiza en cada UPDATE |
| `nombre` | text NOT NULL | |
| `candidato` | text | opcional |
| `url_maps` | text NOT NULL | URL de Google Maps, validada |
| `comentario` | text | opcional |
| `imagen_url` | text NOT NULL | URL en Supabase Storage bucket `murales` |
| `imagen_thumbnail_url` | text | thumbnail 300×300 |
| `estado` | text + CHECK | `pendiente \| aprobado \| rechazado \| modificado_pendiente \| modificado_aprobado` |
| `nuevo_comentario`, `nueva_imagen_url`, `nueva_imagen_thumbnail_url`, `reportado_at` | — | Campos para reportes de eliminación |

**Índices:** `(estado)`, `(created_at DESC)`.

### `mural_modificaciones`

Solicitudes de modificación referenciando un mural. Guarda la imagen original al aprobarse para permitir comparativa antes/después.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `mural_id` | uuid | FK a `murales(id) ON DELETE CASCADE` |
| `nueva_imagen_url`, `nueva_imagen_thumbnail_url` | text | Imagen propuesta |
| `imagen_original_url`, `imagen_original_thumbnail_url` | text | Snapshot al aprobar |
| `nuevo_comentario` | text | |
| `estado_solicitud` | text + CHECK | `pendiente \| aprobada \| rechazada` |
| `created_at`, `reportado_at`, `procesado_at` | timestamptz | |

### `auditoria`

Log append-only de acciones administrativas. Nunca se borra.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `created_at` | timestamptz | |
| `usuario_id`, `usuario_email`, `usuario_nombre` | — | admin que ejecutó |
| `accion` | text + CHECK | `aprobar_mural \| rechazar_mural \| aprobar_modificacion \| rechazar_modificacion \| actualizar_estado` |
| `entidad_tipo`, `entidad_id` | text + uuid | `mural \| modificacion` |
| `datos_anteriores`, `datos_nuevos` | jsonb | snapshot del cambio |
| `comentario` | text | motivo opcional |
| `ip_address`, `user_agent` | text | trazabilidad |

**RLS:** lectura y escritura sólo para `authenticated`.

### Row-Level Security resumen

- `murales.SELECT`: público (todos los estados, el filtrado es responsabilidad del query).
- `murales.INSERT`: anon + authenticated — fuerza `estado = 'pendiente'` vía validación de API.
- `murales.UPDATE` / `DELETE`: sólo `authenticated`.
- `mural_modificaciones.SELECT`: público si el mural asociado es visible.
- `mural_modificaciones.INSERT`: anon + authenticated.
- `mural_modificaciones.UPDATE`: sólo `authenticated`.
- `auditoria.SELECT` / `INSERT`: sólo `authenticated`.
- Bucket `storage.objects` con `bucket_id = 'murales'`: `INSERT` público, `SELECT` público.

---

## Flujos principales

### Crear un mural nuevo

1. Usuario abre `/nuevo`, completa nombre, candidato, ubicación (click en Leaflet), comentario y sube imagen.
2. Zod valida los campos en el cliente vía `muralSchema`.
3. La imagen se comprime a WebP + genera thumbnail (`lib/compression.ts`).
4. `uploadImageWithThumbnail()` sube ambos archivos a Supabase Storage (bucket `murales`) via `POST /api/upload`.
5. `POST /api/murales` inserta el registro con `estado = 'pendiente'`.
6. Redirige al home con toast de confirmación.

### Aprobar un mural

1. Admin entra a `/admin`, ve la tabla filtrada por `pendiente`.
2. Click en "Aprobar" → `aprobarMuralAction(muralId)` (Server Action).
3. Server Action verifica sesión con `requireAdminClient()`, ejecuta `UPDATE murales SET estado = 'aprobado'`.
4. Llama a `registrarAuditoria(...)` con el admin, IP, user-agent y datos nuevos.
5. `revalidatePath('/admin')` y `revalidatePath('/')` invalidan caches.
6. Cliente muestra toast "Mural aprobado" y la fila desaparece del filtro.

### Reportar modificación de un mural existente

1. Usuario navega desde el popup del mapa a `/reportar?id=<uuid>&name=<nombre>`.
2. Selecciona "Fue modificado" y sube foto nueva + motivo.
3. `POST /api/murales/[id]/report` valida con zod, guarda el snapshot de la imagen original en `mural_modificaciones`, inserta la propuesta y cambia el estado del mural a `modificado_pendiente`.
4. El admin ve la solicitud en `/admin/modificaciones` con cards before/after.
5. Al aprobar: `aprobarModificacionAction` actualiza el mural (imagen + estado `modificado_aprobado`) y luego marca la modificación como `aprobada`. El orden es importante: si el update del mural falla, la modificación queda pendiente para reintentar (recuperable). Si fuera al revés, quedaría una modificación "aprobada" sin reflejarse en el mural.

---

## Convenciones de código

### Imports

```ts
import type { Foo } from "@/lib/types";  // types primero
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

Alias `@/*` → raíz del repo (ver `tsconfig.json`).

### Componentes

- **Server por default.** Agregar `"use client"` sólo si se necesitan hooks, event handlers o APIs de browser.
- **Named exports.** `export function Foo()` — reserva `default export` sólo para páginas/layouts de App Router.
- **Tipos con `interface`** para props de componentes, `type` para uniones o aliases.
- **`cn()` para merge de classNames** — nunca concatenar con `+`, siempre `cn("base", condition && "extra")`.
- **Íconos Lucide con `aria-hidden="true"`** si van junto a texto, con `aria-label` si son sólo decorativos clickeables.

### Server Actions

- Archivo en `app/admin/_actions/*.ts` con `"use server"` al tope.
- Retornan `ActionResult = { success: true } | { success: false; error: string }`.
- Autenticación con `requireAdminClient()` de `lib/auth/server.ts`.
- Invalidación con `revalidatePath` (no `revalidateTag`, porque queries no usan fetch cache).

### Queries

- Viven en `lib/queries/*`.
- Archivos con `"server-only"` import arriba para prevenir inclusión accidental en bundles cliente.
- Reciben objetos de filtros (`{ q, estado, page }`), retornan el tipo del dominio o `PagedResult<T>`.
- Log estructurado de errores con `message / code / details / hint`.
- Sanitización de input del usuario antes de `.or()` filters (prevención de PostgREST injection).

### API Routes

- `runtime = "nodejs"` explícito.
- Validación de body con zod + `safeParse`.
- Respuestas con helpers `apiError(msg, status)` / `apiSuccess(data)` de `lib/api-response.ts`.
- Auth con `requireAuth()` donde aplique.
- Rate limiting en `proxy.ts` para rutas públicas POST.

### Tipografía y tokens

- Los colores se definen como CSS variables HSL en `:root` y `.dark` (`app/globals.css`).
- Tailwind los consume vía `@theme { --color-primary: hsl(var(--primary)) }`.
- Nunca usar colores literales en componentes (`bg-[#0F172A]`); siempre `bg-primary`, `text-muted-foreground`, etc.

---

## Seguridad

| Capa | Implementación |
| --- | --- |
| Auth de admin | `requireAuth` / `requireAdminClient` verifican sesión Supabase en cada Server Action y Route Handler sensible |
| Proxy guard | `proxy.ts` redirige `/admin/*` (excepto `/admin/login`) a login cuando no hay sesión, y de `/admin/login` a `/admin` si ya hay |
| Rate limiting | In-memory (proxy) + persistente vía RPC `rate_limit_hit` en Postgres (atómico, compartido entre instancias) en `/api/murales`, `/api/upload` y `/api/murales/[id]/report` |
| Validación de inputs | zod schemas en API routes y forms (`muralSchema`, `reporteSchema`, `updateSchema`) |
| Upload de imágenes | MIME type + extensión validadas en `/api/upload`; tamaño máximo 5 MB (server + bucket); sólo `image/jpeg`, `image/png`, `image/webp` |
| XSS | `escapeHtml()` aplicado a todas las interpolaciones en HTML crudo (popups de Leaflet) |
| Filter injection (PostgREST) | caracteres especiales (`,()*"\`) removidos del search `q` antes de `.or()` |
| Open redirect | `?next=` del login sólo acepta paths que empiecen con `/` y no con `//` |
| Sesión | SameSite cookies via `@supabase/ssr`; `getUser()` (no `getSession()`) para decisiones de auth |
| CSP | Activa en `next.config.ts` con allowlist para Supabase, OpenStreetMap, Cloudflare Turnstile y Vercel Analytics. También HSTS, X-Frame-Options, Referrer-Policy y Permissions-Policy |
| Auditoría | Cada acción admin deja registro inmutable con IP + user-agent |
| Anti-spam | Cloudflare Turnstile en formularios públicos (`/nuevo`, `/reportar`); verificación server-side en `lib/turnstile.ts`. No-op si las env vars no están definidas |
| Observabilidad | Sentry vía `@sentry/nextjs` con `instrumentation.ts`/`instrumentation-client.ts`. Wrapper `lib/observability.ts` activo en todas las API routes |

---

## Rendimiento

- **SSR con streaming.** El shell (header, sidebar, filtros) se renderiza y envía al browser mientras el contenido dinámico espera su Suspense resolviéndose.
- **`revalidate = 60` en home** + invalidación explícita al aprobar/rechazar.
- **`force-dynamic` en admin** para datos siempre frescos por acción.
- **Suspense keys por `searchParams`.** Cambiar un filtro re-monta sólo la sección dinámica; el resto de la página queda intacto.
- **Route group `/admin/(panel)/`** con layout compartido — el sidebar no se re-monta al navegar entre tabs.
- **Leaflet detrás de `dynamic({ ssr: false })`**. El bundle del mapa se descarga sólo cuando hace falta.
- **Compresión cliente** de imágenes antes de upload — reduce tamaño típico de 3 MB → 150-300 KB.
- **Fuente con `display: swap`** vía `next/font/google` (elimina FOIT).
- **Lighthouse (home desktop)**: Performance ≥ 95, Accessibility 100, Best Practices 96, SEO 92+.

---

## Accesibilidad

- `lang="es"` en `<html>`.
- Skip link visible al enfocar (primer elemento en `<body>`).
- Focus ring global `3px solid hsl(var(--ring))` con `outline-offset: 2px` aplicado por `*:focus-visible`.
- `@media (prefers-reduced-motion: reduce)` desactiva animaciones y transiciones.
- `role="alert"` + `aria-invalid` en errores de formulario; toasts de sonner anuncian con `aria-live="polite"`.
- Iconos Lucide con `aria-hidden="true"` cuando acompañan texto.
- Objetivos táctiles ≥ 44×44 en mobile (inputs 48 px, botones `size-10`).
- Contrastes target AA (4.5:1 para texto normal) con muchos AAA en la paleta navy sobre blanco.
- Dialog y Sheet de shadcn incluyen focus trap y Escape listener via Radix.

---

## Despliegue

### Vercel

1. Conectar el repo en [vercel.com](https://vercel.com/new).
2. Framework preset: Next.js.
3. Variables de entorno (en `Project Settings → Environment Variables`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Cada push a `main` dispara preview/production.

El proyecto usa **Fluid Compute** por default (Next.js 16 sobre Vercel). Los route handlers declaran `runtime = "nodejs"` explícitamente.

### Keepalive

`.github/workflows/keep-alive.yml` hace ping a `/api/ping` cada ~5 días para prevenir que Supabase cloud pause el proyecto por inactividad (free tier).

### Otros providers

El código no tiene dependencias específicas de Vercel salvo `@vercel/analytics` y `@vercel/speed-insights` (ambos no-op en otros entornos). Debería funcionar en Netlify, Railway, Fly.io o self-hosted Node con pequeños ajustes.

---

## Contribuir

### Flow sugerido

1. Fork + branch desde `main`.
2. `yarn install && yarn dev`.
3. Correr `yarn lint` y `yarn format` antes de commit.
4. Commits descriptivos en [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
5. `yarn build` pasa sin errores.
6. PR con descripción del cambio y, si afecta UI, screenshots.

### Decisiones de arquitectura pendientes

Ver `docs/superpowers/` para el historial de specs y plans. Roadmap corto:

- Consolidar API routes de admin legacy en Server Actions.
- Supabase type generation (`supabase gen types typescript`).
- Tests mínimos (Vitest + Testing Library) para Server Actions y RLS.
- CSP headers.
- App móvil Expo (plan en `docs/superpowers/specs/2026-04-05-mobile-app-design.md`).

### Estilo de commits

```
refactor(lib): split utils.ts into domain-focused modules

- formatDate, escapeHtml → lib/formatting.ts
- compressImage → lib/compression.ts
- maps helpers → lib/maps.ts
- upload helpers → lib/upload.ts
- cn stays in lib/utils.ts (consumed by shadcn)
```

---

## Licencia

Sin licencia declarada (todos los derechos reservados por default). Si vas a reutilizar el código, abrí un issue o contactá al autor.

---

## Créditos

- Diseño inspirado en patrones **"Accessible & Ethical"** de productos cívicos (gobierno, salud, educación).
- Mapas por [OpenStreetMap](https://www.openstreetmap.org/) contributors.
- Componentes base por [shadcn/ui](https://ui.shadcn.com/).
- Iconos por [Lucide](https://lucide.dev/).
- Tipografía [IBM Plex Sans](https://www.ibm.com/plex/) por IBM.
