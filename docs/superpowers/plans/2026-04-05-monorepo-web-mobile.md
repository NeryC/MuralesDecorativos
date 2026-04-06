# Monorepo Setup + Web Mobile-First Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the repo for future mobile sharing by extracting shared TypeScript files into `/shared/`, then make all web pages usable on mobile screens.

**Architecture:** Create a `/shared/` folder that holds pure TypeScript (types, constants, messages) used by both web and future mobile. The web `lib/` files become thin re-exports — all existing `@/lib/*` imports continue to work unchanged. Web mobile-first improvements are CSS/layout only, no logic changes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4. No test framework configured — verification is via `yarn build` (TypeScript + Next.js compilation) and manual viewport checks at 390px in browser DevTools.

**Spec:** `docs/superpowers/specs/2026-04-05-mobile-app-design.md`

---

## Chunk 1: Shared code setup

### Task 1: Create `/shared/` folder with copied files

**Files:**
- Create: `shared/types.ts`
- Create: `shared/constants.ts`
- Create: `shared/messages.ts`

- [ ] **Step 1: Copy `lib/types.ts` content to `shared/types.ts`**

The file already exists at `lib/types.ts`. Copy its entire content verbatim to `shared/types.ts`. Do not modify anything.

- [ ] **Step 2: Copy `lib/constants.ts` content to `shared/constants.ts`**

Copy `lib/constants.ts` content verbatim to `shared/constants.ts`.

- [ ] **Step 3: Copy `lib/messages.ts` content to `shared/messages.ts`**

Copy `lib/messages.ts` content verbatim to `shared/messages.ts`.

---

### Task 2: Convert `lib/` files to thin re-exports

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/constants.ts`
- Modify: `lib/messages.ts`

No other files need changes — all web code uses `@/lib/*` which continues to resolve correctly via the existing tsconfig alias `"@/*": ["./*"]`. Note: `lib/utils.ts` imports from `./constants` — this continues to work because `lib/constants.ts` remains in place as a re-export, so the resolution chain is unbroken.

- [ ] **Step 1: Replace `lib/types.ts` with a re-export**

```typescript
export * from '../shared/types';
```

- [ ] **Step 2: Replace `lib/constants.ts` with a re-export**

```typescript
export * from '../shared/constants';
```

- [ ] **Step 3: Replace `lib/messages.ts` with a re-export**

```typescript
export * from '../shared/messages';
```

---

### Task 3: Verify the build still passes

**Files:** none

- [ ] **Step 1: Run the build**

```bash
yarn build
```

Expected: build completes with no TypeScript errors. The re-exports must be transparent to Next.js.

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts shared/constants.ts shared/messages.ts lib/types.ts lib/constants.ts lib/messages.ts
git commit -m "refactor: extract shared types/constants/messages to /shared/"
```

---

## Chunk 2: Web forms mobile-first

### Task 4: Make `/nuevo` form mobile-friendly

**Files:**
- Modify: `app/nuevo/page.tsx`

Current issues on mobile:
- Action buttons (`Cancelar` + `Enviar mural →`) are right-aligned and narrow
- Inputs have only 36px effective height (below 44px touch target minimum)

- [ ] **Step 1: Update input padding for taller touch targets**

In `app/nuevo/page.tsx`, change the inline style for all `<input>` and `<textarea>` elements from `padding: '8px 12px'` to `padding: '11px 12px'`. This brings the effective height to ~44px. There are 3 elements to update: nombre input, candidato input, and comentario textarea.

- [ ] **Step 2: Make action buttons full-width on mobile**

Find the action buttons container (currently `<div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>`).

Replace with:
```tsx
<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
```

Add `className="w-full sm:w-auto"` to the `<Link>` (Cancelar) and update the submit `<button>` to also include `w-full sm:w-auto` in its className:

```tsx
<Link
  href="/"
  className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg text-center"
  style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b' }}
>
  Cancelar
</Link>
<button
  type="submit"
  disabled={isSubmitting || isUploadingImage}
  className="w-full sm:w-auto px-5 py-2 text-sm font-bold rounded-lg text-white transition-colors"
  style={{ background: isSubmitting || isUploadingImage ? '#93c5fd' : '#1e40af' }}
>
  {isUploadingImage ? 'Subiendo imagen...' : isSubmitting ? 'Enviando...' : 'Enviar mural →'}
</button>
```

- [ ] **Step 3: Verify visually**

Open `http://localhost:3000/nuevo` in browser DevTools at 390px width. Confirm:
- Inputs are comfortably tappable
- Buttons are full-width and stacked (Cancel below, Submit above)
- No horizontal overflow

- [ ] **Step 4: Commit**

```bash
git add app/nuevo/page.tsx
git commit -m "style: make /nuevo form mobile-first with full-width buttons"
```

---

### Task 5: Make `/reportar` form mobile-friendly

**Files:**
- Modify: `app/reportar/page.tsx`

Same issues as `/nuevo`.

- [ ] **Step 1: Update textarea padding**

Find the `<textarea>` for `nuevo_comentario`. Change `padding: '8px 12px'` to `padding: '11px 12px'`.

- [ ] **Step 2: Make action buttons full-width on mobile**

Find the action buttons container (currently `<div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>`).

Replace with:
```tsx
<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
```

Add `w-full sm:w-auto text-center` to the `<Link>` (Cancelar) className, and `w-full sm:w-auto` to the submit `<button>` className.

- [ ] **Step 3: Verify visually**

Open `/reportar?id=test&name=Test` at 390px. Confirm buttons are full-width and stacked.

- [ ] **Step 4: Commit**

```bash
git add app/reportar/page.tsx
git commit -m "style: make /reportar form mobile-first with full-width buttons"
```

---

## Chunk 3: Web admin mobile-first

### Task 6: Add mobile card view to `/admin` dashboard

**Files:**
- Create: `components/admin/mural-card.tsx`
- Modify: `app/admin/page.tsx`

The admin dashboard uses a `<table>` which overflows on mobile. Strategy: keep the table for `md+` screens, add a card list for small screens. `MuralCard` will accept the same props as `MuralRow` but render a card.

- [ ] **Step 1: Create `components/admin/mural-card.tsx`**

```tsx
'use client';

import { memo } from 'react';
import Link from 'next/link';
import { EstadoBadge } from '@/components/estado-badge';
import { formatDate } from '@/lib/utils';
import { MuralImageCell } from './mural-image-cell';
import { MuralActionsCell } from './mural-actions-cell';
import type { FilterType } from '@/hooks/use-mural-filters';
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types';

interface MuralCardProps {
  mural: MuralWithModificaciones;
  filter: FilterType;
  onImageClick: (url: string) => void;
  onUpdateEstado: (id: string, estado: string) => void;
  getUltimaModificacionPendiente: (mural: MuralWithModificaciones) => MuralModificacion | undefined;
  getImagenAmostrar: (mural: MuralWithModificaciones) => { url: string; thumbnailUrl?: string | null; esAprobada: boolean } | null;
  isProcessingModificacion: boolean;
  isUpdatingEstado: boolean;
  processingModificacionKey: string | null;
}

export const MuralCard = memo(function MuralCard({
  mural,
  filter,
  onImageClick,
  onUpdateEstado,
  getUltimaModificacionPendiente,
  getImagenAmostrar,
  isProcessingModificacion,
  isUpdatingEstado,
  processingModificacionKey,
}: MuralCardProps) {
  const ultimaModificacionPendiente = getUltimaModificacionPendiente(mural);
  const isDisabled = isProcessingModificacion || isUpdatingEstado;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{mural.nombre}</p>
          {mural.candidato && (
            <p className="text-xs text-gray-500 mt-0.5">{mural.candidato}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(mural.created_at)}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <EstadoBadge estado={mural.estado} />
          <Link
            href={`/?highlight=${mural.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 underline"
          >
            🗺️ Ver en mapa
          </Link>
        </div>
      </div>

      <div className="mb-3">
        <MuralImageCell
          mural={mural}
          filter={filter}
          onImageClick={onImageClick}
          getImagenAmostrar={getImagenAmostrar}
        />
      </div>

      {mural.comentario && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{mural.comentario}</p>
      )}

      {ultimaModificacionPendiente?.nuevo_comentario && (
        <p className="text-xs text-red-600 mb-3 line-clamp-2">
          Nuevo: {ultimaModificacionPendiente.nuevo_comentario}
        </p>
      )}

      <MuralActionsCell
        mural={mural}
        ultimaModificacionPendiente={ultimaModificacionPendiente}
        isDisabled={isDisabled}
        isUpdatingEstado={isUpdatingEstado}
        onUpdateEstado={onUpdateEstado}
      />
    </div>
  );
});
```

- [ ] **Step 2: Update `app/admin/page.tsx` to use MuralCard on mobile**

Add the import at the top:
```tsx
import { MuralCard } from '@/components/admin/mural-card';
```

Find the section that renders the table (`<div className="overflow-x-auto">`). Add `hidden md:block` to that wrapper:
```tsx
<div className="hidden md:block overflow-x-auto">
  <table ...>
    ...
  </table>
</div>
```

Immediately after that closing `</div>`, add the mobile card list:
```tsx
<div className="md:hidden flex flex-col gap-3">
  {filteredMurales.map((mural) => (
    <MuralCard
      key={mural.id}
      mural={mural}
      filter={filter}
      onImageClick={handleImageClick}
      onUpdateEstado={updateEstado}
      getUltimaModificacionPendiente={getUltimaModificacionPendiente}
      getImagenAmostrar={getImagenAmostrar}
      isProcessingModificacion={processingModificacion !== null}
      isUpdatingEstado={updatingEstado === mural.id}
      processingModificacionKey={processingModificacion}
    />
  ))}
</div>
```

- [ ] **Step 3: Verify visually**

Open `/admin` at 390px. Confirm: cards are visible, contain nombre/estado/imagen/acciones. At 768px+ confirm the table still displays correctly.

- [ ] **Step 4: Run build**

```bash
yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/mural-card.tsx app/admin/page.tsx
git commit -m "style: add mobile card view to /admin dashboard"
```

---

### Task 7: Add mobile card view to `/admin/auditoria`

**Files:**
- Modify: `app/admin/auditoria/page.tsx`

The auditoria table has 6 columns which is too wide for mobile. Strategy: keep table for `md+`, add compact card list for mobile.

> **Note:** `getAccionLabel` and `formatFecha` are local functions defined inside `AuditoriaPage` in this same file — they will be in scope for the JSX added below.

> **Important:** The page uses a ternary `{auditoria.length === 0 ? (...) : (...)}`. Both the table wrapper and the card list must go inside the `else` branch of the ternary, wrapped in a React fragment `<>...</>`, otherwise the cards won't render when there is data.

- [ ] **Step 1: Replace the ternary `else` branch to include both table and cards**

Find the ternary in `app/admin/auditoria/page.tsx`. The current `else` branch is:
```tsx
) : (
  <div className="overflow-x-auto bg-white rounded-lg shadow">
    <table ...>
      ...
    </table>
  </div>
)}
```

Replace the entire `else` branch with:
```tsx
) : (
  <>
    <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
      {/* keep the existing <table> here unchanged */}
    </div>
    <div className="md:hidden flex flex-col gap-3">
      {/* card list below */}
    </div>
  </>
)}
```

- [ ] **Step 2: Add mobile card list inside the `md:hidden` div**

The complete card list content for the `md:hidden` div:

```tsx
<div className="md:hidden flex flex-col gap-3">
  {auditoria.map((item) => (
    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getAccionLabel(item.accion)}
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatFecha(item.created_at)}</span>
      </div>
      <p className="text-xs font-medium text-gray-700 mb-1">
        {item.usuario_email || 'Sistema'}
        {item.usuario_nombre && <span className="text-gray-400 font-normal"> · {item.usuario_nombre}</span>}
      </p>
      <p className="text-xs text-gray-500 mb-2 font-mono">
        <span className="capitalize">{item.entidad_tipo}</span> · {item.entidad_id.slice(0, 8)}...
      </p>
      {item.datos_anteriores && item.datos_nuevos && (
        <div className="space-y-0.5">
          {Object.keys(item.datos_nuevos).map((key) => {
            const anterior = item.datos_anteriores?.[key];
            const nuevo = item.datos_nuevos?.[key];
            if (anterior === nuevo) return null;
            return (
              <div key={key} className="text-xs">
                <span className="font-medium">{key}:</span>{' '}
                <span className="text-red-600 line-through">{String(anterior)}</span>{' '}
                → <span className="text-green-600">{String(nuevo)}</span>
              </div>
            );
          })}
        </div>
      )}
      {item.comentario && (
        <p className="text-xs text-gray-600 mt-2">{item.comentario}</p>
      )}
    </div>
  ))}
</div>
```

- [ ] **Step 3: Verify visually**

Open `/admin/auditoria` at 390px. Confirm cards show acción, fecha, usuario y cambios. At 768px+ confirm table is visible and cards are hidden.

- [ ] **Step 4: Run build**

```bash
yarn build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/auditoria/page.tsx
git commit -m "style: add mobile card view to /admin/auditoria"
```

---

### Task 8: Final verification

**Files:** none

- [ ] **Step 1: Run full build**

```bash
yarn build
```

Expected: build passes with zero errors.

- [ ] **Step 2: Manual checklist at 390px viewport**

Open each URL in browser DevTools at 390px width and confirm:

| URL | Check |
|---|---|
| `/nuevo` | Buttons full-width, inputs tappable, no horizontal scroll |
| `/reportar?id=x&name=x` | Buttons full-width, no horizontal scroll |
| `/admin` | Cards visible, table hidden — switch to 768px and verify table appears |
| `/admin/auditoria` | Cards visible, table hidden — switch to 768px and verify table appears |
| `/admin/modificaciones` | Already mobile-friendly (flex-col layout) — confirm no regressions |
| `/` | FAB visible, map fills screen, stats visible |

- [ ] **Step 3: Final commit if any minor fixes were needed**

```bash
git add -p
git commit -m "style: mobile-first minor fixes"
```

---

## Notes for Plan 2 (Android App)

The following is **out of scope for this plan** and will be addressed in a separate plan:

- Initialize Expo project in `/mobile/`
- Configure NativeWind v3 + Tailwind v3 for `/mobile/`
- MapScreen, NuevoMuralScreen, ReportarScreen, admin screens
- Supabase client with AsyncStorage
- EAS build + APK distribution

Prerequisite for Plan 2: obtain a Google Maps API key from Google Cloud Console before starting Task 3 of that plan (MapScreen).
