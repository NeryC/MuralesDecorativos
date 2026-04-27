# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev            # Next.js dev server (Turbopack)
yarn build          # Production build
yarn start          # Production server
yarn lint           # ESLint 10 flat config (next/core-web-vitals + typescript + prettier)
yarn lint:fix       # ESLint with --fix
yarn format         # Prettier write
yarn format:check   # Prettier check

yarn db:start       # Supabase local (requires Docker)
yarn db:stop
yarn db:reset       # Reset local DB and apply migrations + seed
yarn db:migrate
```

No test script is configured.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # legacy JWT (eyJ...), not sb_publishable_*
```

`lib/env.ts` validates both with zod at module load time and throws loudly if missing/invalid.

Variables opcionales (recomendadas en producción):

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=   # Cloudflare Turnstile site key
TURNSTILE_SECRET_KEY=             # Cloudflare Turnstile secret (server-only)
SENTRY_DSN=                       # Observabilidad (ver lib/observability.ts)
```

Cuando `TURNSTILE_SECRET_KEY` no está definida, `verifyTurnstileToken` es no-op (útil en desarrollo). Ver `docs/OPERATIONS.md` para el checklist de producción.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase (PostgreSQL + Storage + Auth) + Tailwind CSS v4 + Leaflet.js + shadcn/ui + lucide-react + react-hook-form + zod.

**Domain:** Collaborative map for reporting political propaganda murals in Paraguay (Spanish UI, es-PY locale).

### Key principle

**Server Components by default.** `"use client"` only where needed: Leaflet (browser API), forms (event handlers, rhf state), dialogs, dropdowns. Pages are async Server Components that call `lib/queries/*` directly; the public map and admin pages never fetch JSON from internal API routes.

### Routing

| Route | Type | Notes |
| --- | --- | --- |
| `/` | Server Component | Public map, `revalidate: 60` |
| `/nuevo` | Server shell + Client form | Create mural |
| `/reportar?id=&name=` | Server shell + Client form | Report deletion/modification |
| `/admin/login` | Server shell + Client form | Login |
| `/admin/(panel)/*` | Route group with shared layout | Sidebar + header persist between tabs |
| `/admin/(panel)/` | Server Component | Murales table, Server Actions |
| `/admin/(panel)/modificaciones` | Server Component | Pending modification cards |
| `/admin/(panel)/auditoria` | Server Component | Read-only audit log |

### Middleware (Next 16 renamed to `proxy.ts`)

`proxy.ts` at repo root runs on every request. It:
1. Rate-limits POST to `/api/murales` and `/api/upload` (10 req/min per IP, in-memory).
2. Refreshes Supabase session cookies via `@supabase/ssr`.
3. Guards admin: redirects `/admin/*` (except `/admin/login`) to `/admin/login?next=<path>` when no user. Redirects `/admin/login` to `/admin` if user is authenticated.

### Data layer

**Queries (server-only reads):** `lib/queries/*`
- `murales.ts` — `getMuralesAprobados({ q, estado })`, `getMuralById(id)`, `getMuralesStats()`
- `admin-murales.ts` — `getAllMurales({ page, estado, q })`, `countMuralesPendientes()`, `countModificacionesPendientes()`, `PagedResult<T>` helper
- `modificaciones.ts` — `getModificacionesPendientes(page)`
- `auditoria.ts` — `getAuditoria({ page, accion })`

All start with `import "server-only"`. Errors logged with `{ message, code, details, hint }`, return `[]` or `null` on failure (no throw to keep the page rendering).

**Mutations for admin — Server Actions:** `app/admin/_actions/*.ts` (the `_` prefix excludes them from routing)
- `murales.ts` — `aprobarMuralAction`, `rechazarMuralAction`, `actualizarEstadoMuralAction`
- `modificaciones.ts` — `aprobarModificacionAction`, `rechazarModificacionAction`

Each action:
1. Calls `requireAdminClient()` from `lib/auth/server.ts` — returns discriminated `{ ok: true, supabase, userId, userEmail } | { ok: false, error }`.
2. Runs the Supabase mutation.
3. Calls `registrarAuditoria(...)` from `lib/auditoria.ts`.
4. Calls `revalidatePath(...)` on affected routes (use `revalidatePath`, not `revalidateTag` — queries use the Supabase SDK, not `fetch` with tags, so tags are no-ops).
5. Returns `ActionResult = { success: true } | { success: false; error: string }`.

**Mutations for public clients — API Routes:** `app/api/**/route.ts`
- `POST /api/murales` — create mural (pending)
- `POST /api/murales/[id]/report` — deletion/modification report
- `PATCH /api/murales/[id]` — update estado (auth-gated with `requireAuth`, zod-validated body)
- `POST /api/upload` — upload image to Supabase Storage `murales` bucket
- `GET /api/ping` — health check for the keepalive cron
- `GET /api/admin/*` — legacy endpoints, kept but superseded by Server Components + Server Actions

All route handlers declare `export const runtime = "nodejs"` explicitly.

### Suspense strategy

Pages split into a **shell** (header, sidebar, filters, stats, title) and a **dynamic section** (table, map, cards) wrapped in `<Suspense key={searchParams...}>`. Changing a filter re-mounts only the section; the shell stays.

Route group `/admin/(panel)/` with shared `layout.tsx` means the sidebar doesn't re-render between admin tabs.

### Supabase client usage

- `lib/supabase/server.ts` → `createClient()` — Server Components, Route Handlers, Server Actions. Uses `cookies()` from Next.
- `lib/supabase/client.ts` → `createClient()` — Client Components only.
- `lib/auth/server.ts` → `getAuthenticatedUser()`, `requireAuth()`, `requireAdminClient()` — server only.
- `lib/auth/client.ts` → `getClientUser()` — client only.
- Always use `getUser()` (verifies token with Auth server), never `getSession()` (reads unverified cookie).

### Database schema

Three tables (see `supabase/migrations/20250101000000_init.sql`):

**`murales`** — `estado`: `pendiente | aprobado | rechazado | modificado_pendiente | modificado_aprobado`. Stores original `imagen_url` + `imagen_thumbnail_url`; reports of modification temporarily store `nueva_imagen_url` on the row.

**`mural_modificaciones`** — `estado_solicitud`: `pendiente | aprobada | rechazada`. FK to `murales(id) ON DELETE CASCADE`. Stores before/after image URLs for comparison.

**`auditoria`** — append-only, never deleted. `accion`: `aprobar_mural | rechazar_mural | aprobar_modificacion | rechazar_modificacion | actualizar_estado`. `entidad_tipo`: `mural | modificacion`. `datos_anteriores` and `datos_nuevos` are `jsonb` snapshots. Always called via `registrarAuditoria()` in `lib/auditoria.ts`.

RLS enabled on all three. Public: SELECT all murales + INSERT pendientes + SELECT/INSERT modificaciones. Authenticated only: UPDATE/DELETE on murales and mural_modificaciones, full access to `auditoria`. Storage bucket `murales` is public read + public insert (`file_size_limit = 5 MB`, MIME types restringidos a JPG/PNG/WebP, rate-limit en proxy + en cada API route vía `lib/rate-limit.ts`).

**`rate_limits`** — tabla auxiliar (migración `20260426000000_*`) con RPC `rate_limit_hit(p_key, p_limit, p_window_seconds)` para rate limiting atómico compartido entre instancias. Llamada desde `lib/rate-limit.ts`. Limpieza opcional: `select rate_limits_purge();`.

### Key library modules

- `lib/utils.ts` — only `cn()` (clsx + tailwind-merge)
- `lib/formatting.ts` — `formatDate` (Intl, es-PY), `escapeHtml` (XSS-safe for popup HTML)
- `lib/compression.ts` — `compressImage` (WebP + EXIF orientation via `createImageBitmap`)
- `lib/maps.ts` — `extractCoordinates`, `generateGoogleMapsUrl`, `isValidGoogleMapsUrl`
- `lib/upload.ts` — `uploadImage`, `uploadImageWithThumbnail` (calls `/api/upload`)
- `lib/api-response.ts` — `apiError`, `apiSuccess` helpers for Route Handlers
- `lib/auditoria.ts` — `registrarAuditoria()` with IP + user-agent capture; non-blocking (returns boolean)
- `lib/map-popup.ts` — `buildPopupHTML()` with `escapeHtml` on every interpolation, inline Lucide-style SVGs
- `lib/env.ts` — zod-validated env at module load
- `lib/types.ts` — `Mural`, `MuralModificacion`, `Auditoria`, `EstadoMural`, `AccionAuditoria`, DTOs
- `lib/constants.ts` — `DEFAULT_COORDINATES` (Asunción), `IMAGE_COMPRESSION`, `MURAL_ESTADOS`
- `lib/messages.ts` — `MESSAGES.SUCCESS`, `.ERROR`, `.VALIDATION`, `.LOADING`, `.UI`
- `lib/schemas/` — `muralSchema` (form), `muralCreateApiSchema` (server), `reporteSchema` (form), `reporteApiSchema` (server). Los `*ApiSchema` validan también las URLs de Storage y el `turnstileToken`.
- `lib/turnstile.ts` — `verifyTurnstileToken()` server-side, no-op cuando `TURNSTILE_SECRET_KEY` no está definida.
- `lib/rate-limit.ts` — `checkRateLimit()` persistente vía RPC `rate_limit_hit` (Postgres). Fallback in-memory si la RPC falla.
- `lib/observability.ts` — `captureException`, `captureMessage`. Reporter por defecto `console`; `instrumentation.ts` lo reemplaza por Sentry cuando `SENTRY_DSN` está definida (`@sentry/nextjs` ya instalado, `next.config.ts` envuelto con `withSentryConfig`).

### Hooks

- `hooks/use-image-upload.ts` — pipeline: compressImage → uploadImageWithThumbnail, with `isUploading` state.

### Components

- `components/ui/*` — shadcn/ui primitives (do not edit by hand; install via `npx shadcn@latest add <name>`).
- `components/admin/*` — admin-specific (sidebar, tables, actions, cards, sections, pagination).
- `components/site-header.tsx` — shared header, accepts `leading?: ReactNode` for the mobile admin nav trigger and `showAddButton?: boolean` to hide the "Agregar mural" CTA on admin pages.
- `components/mural-map.tsx` — Leaflet rendering (Client, `dynamic({ ssr: false })`).
- `components/map-field.tsx`, `components/map-picker.tsx` — location picker for forms.
- `components/mural-form.tsx`, `components/reporte-form.tsx` — rhf + zod forms.
- `components/image-uploader.tsx` — dashed drop zone; revokes ObjectURL on unmount and on replace (memory-safe).
- `components/image-modal.tsx` — preview in shadcn Dialog (focus-trapped by Radix).
- `components/skip-link.tsx`, `components/error-view.tsx`, `components/empty-state.tsx`, `components/estado-badge.tsx`.

### Styling

Colors are CSS HSL variables in `:root` and `.dark` (`app/globals.css`). Tailwind consumes them via the `@theme` block: `--color-primary: hsl(var(--primary))`. Never hardcode colors in components; use `bg-primary`, `text-muted-foreground`, `border-accent`, etc.

Global focus ring is `3px solid hsl(var(--ring))` with `outline-offset: 2px` via `*:focus-visible`. `prefers-reduced-motion` disables animations globally.

### Authentication

Admin users are created manually in the Supabase dashboard (no self-registration). Session refresh is handled in `proxy.ts` on every request. Pages inside `/admin/(panel)/` are protected by the proxy guard; there's no need for per-page `requireAuth` calls in those Server Components.

### Things to avoid

- Don't use `revalidateTag` — queries use Supabase SDK, not `fetch` with tags. Use `revalidatePath`.
- Don't read `process.env.NEXT_PUBLIC_*` directly; import `env` from `lib/env.ts`.
- Don't fetch JSON from internal API routes inside Server Components or Server Actions — call the `lib/queries/*` helpers or the Supabase client directly.
- Don't hardcode colors — always use shadcn tokens (`bg-primary`, `text-accent`, etc.).
- Don't use emojis as structural icons — import from `lucide-react`.
- Don't add `Co-Authored-By: Claude` trailers to commits (user preference).
