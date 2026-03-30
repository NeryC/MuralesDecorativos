# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev       # Start development server
yarn build     # Build for production
yarn start     # Run production server
```

No lint or test scripts are configured.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Supabase (PostgreSQL + Storage + Auth) + Tailwind CSS v4 + Leaflet.js

**Domain:** Collaborative map for reporting political propaganda murals in Paraguay (Spanish UI, es-PY locale).

### Routing

| Route | Description |
|-------|-------------|
| `/` | Public map showing approved murals |
| `/nuevo` | Public form to submit new mural |
| `/reportar?id=&name=` | Report a mural deletion/modification |
| `/admin` | Admin dashboard (auth required) |
| `/admin/login` | Admin login |
| `/admin/auditoria` | Audit log viewer |
| `/admin/modificaciones` | Manage modification requests |

### API Routes

**Public:**
- `GET/POST /api/murales` — List approved murals / submit new mural
- `GET /api/murales/[id]` — Mural details
- `POST /api/murales/[id]/report` — Report deletion/modification
- `POST /api/upload` — Upload image to Supabase Storage

**Admin (auth required):**
- `GET /api/admin/murales` — All murals regardless of state
- `PUT /api/admin/murales/[id]` — Update mural status
- `POST /api/admin/murales/[id]/modificaciones/[modId]` — Process modification request
- `GET /api/admin/auditoria` — Audit logs

### Supabase Client Usage

Always use the correct client based on context:
- `lib/supabase/server.ts` — In API routes and Server Components
- `lib/supabase/client.ts` — In Client Components (`'use client'`)
- `lib/auth/server.ts` → `getAuthenticatedUser()` / `requireAuth()` — In API routes
- `lib/auth/client.ts` → `getClientUser()` — In Client Components

### Database Schema

Three main tables in Supabase (PostgreSQL):

**`murales`** — Core table with `estado` enum: `pendiente | aprobado | rechazado | modificado_pendiente | modificado_aprobado`. Stores both the original and pending-modification image URLs.

**`mural_modificaciones`** — Modification requests linked to murals (`estado_solicitud`: `pendiente | aprobada | rechazada`). Stores before/after image URLs for comparison.

**`auditoria`** — Immutable audit trail of all admin actions (`accion`: `aprobar_mural | rechazar_mural | aprobar_modificacion | rechazar_modificacion | actualizar_estado`). Called via `lib/auditoria.ts` → `registrarAuditoria()`.

RLS is enabled on all tables. Public users can read approved murals and insert new ones. Only authenticated users can read audit logs.

### Key Libraries

- **`lib/types.ts`** — All TypeScript interfaces (`Mural`, `MuralModificacion`, DTOs, etc.)
- **`lib/constants.ts`** — `DEFAULT_COORDINATES` (Asunción), `IMAGE_COMPRESSION` settings, `MURAL_ESTADOS`
- **`lib/messages.ts`** — Centralized UI messages (`MESSAGES.SUCCESS`, `MESSAGES.ERROR`, etc.)
- **`lib/utils.ts`** — `cn()` (clsx + tailwind-merge), `compressImage()` (client-side compression before upload)

### Custom Hooks Pattern

Hooks in `hooks/` follow this pattern: manage `loading`/`error` state, expose a `refetch` callback, and use `useCallback` + `useEffect` for data fetching. Key hooks:
- `use-mural-data` — Fetch murals with filtering
- `use-form-submit` — Generic form submission
- `use-image-upload` — Compress + upload to Supabase Storage
- `use-mural-filters` — Filter state for admin dashboard

### Image Handling

Images are compressed client-side before upload (max 800×800px, 0.7 quality for original; 300×300px, 0.6 for thumbnail). Both URLs are stored in the database. Supabase Storage bucket name: `murales`.

### Authentication

Admin users are created manually in the Supabase Dashboard (no self-registration). `middleware.ts` refreshes sessions on every request. Admin pages redirect to `/admin/login` if unauthenticated.
