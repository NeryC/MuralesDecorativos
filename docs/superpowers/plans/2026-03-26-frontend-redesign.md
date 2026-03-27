# Frontend Redesign: Civic Tech

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la interfaz con identidad visual Civic Tech (navy/azul institucional) con layout mobile-first y panel admin con sidebar.

**Architecture:** Se reemplazan los componentes de layout actuales (Card-based header genérico) por un sistema con header navy fijo, stats bar horizontal y sidebar oscuro para admin. Los componentes de UI se actualizan para usar la nueva paleta semántica. Para popups del mapa se extrae la lógica a `lib/map-popup.ts` usando `escapeHtml()`.

**Tech Stack:** Next.js 15 App Router · React 19 · Tailwind CSS v4 · Leaflet.js

**Prerequisite:** Plan `2026-03-26-base-tecnica.md` debe estar completamente ejecutado (provee `escapeHtml()` en `lib/utils.ts`).

**Spec:** `docs/superpowers/specs/2026-03-26-pre-launch-review-design.md`

---

## Paleta de referencia

```
navy:    #1e3a5f  → headers, sidebar
primary: #1e40af  → botones CTA, links
accent:  #3b82f6  → acentos
amber:   #d97706  → pendientes, warnings
success: #059669  → aprobados, éxito
danger:  #dc2626  → rechazar, errores
bg:      #f8fafc  → fondo de página
text:    #1e293b  → texto principal
muted:   #64748b  → texto secundario
border:  #e2e8f0  → bordes
```

---

## Chunk 3: Map Popup & Mapa

### Task 1: Crear lib/map-popup.ts

**Files:**
- Create: `lib/map-popup.ts`

- [ ] **Step 1: Crear lib/map-popup.ts**

```typescript
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types'
import { escapeHtml } from '@/lib/utils'

/**
 * Construye el HTML del popup de Leaflet para un mural.
 * Usa escapeHtml() en todos los valores interpolados para prevenir XSS.
 *
 * @param mural - El mural con sus modificaciones
 * @param modAprobada - La última modificación aprobada (si existe), para mostrar before/after
 */
export function buildPopupHTML(
  mural: MuralWithModificaciones,
  modAprobada?: MuralModificacion
): string {
  const nombre = escapeHtml(mural.nombre)
  const comentario = escapeHtml(mural.comentario || '')
  const urlMaps = escapeHtml(mural.url_maps)
  const muralId = escapeHtml(mural.id)
  const muralNombreEncoded = encodeURIComponent(mural.nombre)

  if (modAprobada) {
    // Popup before/after para murales con modificación aprobada
    const imgOriginal = escapeHtml(
      modAprobada.imagen_original_thumbnail_url ||
      modAprobada.imagen_original_url ||
      mural.imagen_thumbnail_url ||
      mural.imagen_url || ''
    )
    const imgOriginalFull = escapeHtml(
      modAprobada.imagen_original_url || mural.imagen_url || ''
    )
    const imgNueva = escapeHtml(
      modAprobada.nueva_imagen_thumbnail_url ||
      modAprobada.nueva_imagen_url || ''
    )
    const imgNuevaFull = escapeHtml(modAprobada.nueva_imagen_url || '')
    const comentarioNuevo = escapeHtml(modAprobada.nuevo_comentario || comentario)

    return `
      <div style="min-width:220px;font-family:system-ui,sans-serif;">
        <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:4px;">${nombre}</div>
        <div style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;margin-bottom:8px;">
          🔄 Modificado
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Antes</div>
            ${imgOriginal ? `<img src="${imgOriginal}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e2e8f0;" onclick="window.openImageModal('${imgOriginalFull}')">` : '<div style="width:100%;height:70px;background:#f1f5f9;border-radius:6px;"></div>'}
            ${comentario ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">${comentario}</div>` : ''}
          </div>
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ahora</div>
            ${imgNueva ? `<img src="${imgNueva}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e2e8f0;" onclick="window.openImageModal('${imgNuevaFull}')">` : '<div style="width:100%;height:70px;background:#f1f5f9;border-radius:6px;"></div>'}
            ${comentarioNuevo ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">${comentarioNuevo}</div>` : ''}
          </div>
        </div>
        <a href="${urlMaps}" target="_blank" style="display:block;text-align:center;background:#eff6ff;color:#1e40af;font-size:11px;font-weight:600;padding:5px 10px;border-radius:6px;text-decoration:none;margin-bottom:0;">
          🗺️ Ver en Google Maps
        </a>
      </div>
    `
  }

  // Popup estándar
  const candidato = mural.candidato ? escapeHtml(mural.candidato) : null
  const imgThumb = escapeHtml(mural.imagen_thumbnail_url || mural.imagen_url || '')
  const imgFull = escapeHtml(mural.imagen_url || '')

  return `
    <div style="min-width:180px;font-family:system-ui,sans-serif;">
      ${imgThumb ? `<img src="${imgThumb}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e2e8f0;margin-bottom:8px;" onclick="window.openImageModal('${imgFull}')">` : ''}
      <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:2px;">${nombre}</div>
      ${candidato ? `<div style="font-size:11px;color:#64748b;margin-bottom:2px;">${candidato}</div>` : ''}
      ${comentario ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${comentario}</div>` : '<div style="margin-bottom:6px;"></div>'}
      <div style="display:flex;gap:6px;">
        <a href="${urlMaps}" target="_blank" style="flex:1;text-align:center;background:#eff6ff;color:#1e40af;font-size:11px;font-weight:600;padding:5px 8px;border-radius:6px;text-decoration:none;">
          🗺️ Mapa
        </a>
        <a href="/reportar?id=${muralId}&name=${muralNombreEncoded}" style="flex:1;text-align:center;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:600;padding:5px 8px;border-radius:6px;text-decoration:none;">
          🚩 Reportar
        </a>
      </div>
    </div>
  `
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
yarn build 2>&1 | grep -E "error TS" | head -10
```
Resultado esperado: sin errores en `lib/map-popup.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/map-popup.ts
git commit -m "feat: add map popup builder with XSS-safe HTML generation"
```

---

### Task 2: Actualizar components/map-view.tsx

**Files:**
- Modify: `components/map-view.tsx`

- [ ] **Step 1: Reemplazar el contenido completo de map-view.tsx**

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { extractCoordinates } from '@/lib/utils';
import { buildPopupHTML } from '@/lib/map-popup';
import type { MuralWithModificaciones } from '@/lib/types';

interface MapViewProps {
  murales: MuralWithModificaciones[];
  onImageClick?: (imageUrl: string) => void;
  highlightId?: string;
}

const RED_ICON = new URL(
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
).href;
const GREEN_ICON = new URL(
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
).href;
const BLUE_ICON = new URL(
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
).href;
const SHADOW = new URL(
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png'
).href;

function makeIcon(iconUrl: string) {
  return new L.Icon({
    iconUrl,
    iconRetinaUrl: iconUrl.replace('.png', '-2x.png'),
    shadowUrl: SHADOW,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

export default function MapView({ murales, onImageClick, highlightId }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      const mapContainer = document.getElementById('map-view');
      if (!mapContainer) return;

      mapRef.current = L.map('map-view').setView(
        [DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng],
        13
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 25,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      const invalidate = () => mapRef.current?.invalidateSize();
      requestAnimationFrame(() => {
        invalidate();
        setTimeout(invalidate, 100);
        setTimeout(invalidate, 300);
      });
    } else {
      const invalidate = () => mapRef.current?.invalidateSize();
      requestAnimationFrame(() => {
        invalidate();
        setTimeout(invalidate, 100);
      });
    }

    // Exponer función global para clicks en imágenes dentro de popups
    if (typeof window !== 'undefined') {
      (window as Record<string, unknown>).openImageModal = (imageUrl: string) => {
        onImageClick?.(imageUrl);
      };
    }

    // Limpiar marcadores existentes
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) mapRef.current!.removeLayer(layer);
    });

    const redIcon = makeIcon(RED_ICON);
    const greenIcon = makeIcon(GREEN_ICON);
    const blueIcon = makeIcon(BLUE_ICON);

    let highlightedMarker: L.Marker | null = null;
    let highlightedCoords: { lat: number; lng: number } | null = null;

    murales.forEach((mural) => {
      const coords = extractCoordinates(mural.url_maps);
      if (!coords || !mapRef.current) return;

      const isHighlighted = highlightId === mural.id;
      const isModifiedAprobado = mural.estado === 'modificado_aprobado';
      const isAprobado = mural.estado === 'aprobado';

      if (isHighlighted) {
        highlightedCoords = coords;
      }

      const modAprobada = mural.mural_modificaciones
        ?.filter((mod) => mod.estado_solicitud === 'aprobada')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const popupContent = buildPopupHTML(mural, isModifiedAprobado ? modAprobada : undefined);

      let icon: L.Icon | undefined;
      if (isHighlighted) icon = blueIcon;
      else if (isModifiedAprobado) icon = greenIcon;
      else if (isAprobado) icon = redIcon;

      const marker = L.marker([coords.lat, coords.lng], icon ? { icon } : {})
        .addTo(mapRef.current!)
        .bindPopup(popupContent, { maxWidth: 280 });

      if (isHighlighted) highlightedMarker = marker;
    });

    if (highlightedMarker && highlightedCoords && mapRef.current) {
      const coords = highlightedCoords;
      setTimeout(() => {
        if (mapRef.current && highlightedMarker) {
          mapRef.current.flyTo([coords.lat, coords.lng], 16, { animate: true, duration: 1.0 });
          setTimeout(() => highlightedMarker?.openPopup(), 1200);
        }
      }, 100);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient, murales, onImageClick, highlightId]);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Cargando mapa...</p>
      </div>
    );
  }

  return <div id="map-view" className="h-full w-full" style={{ minHeight: '500px' }} />;
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
yarn build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 3: Verificar visualmente en el browser**

```bash
yarn dev
```
Abrir `http://localhost:3000`. Resultado esperado:
- Mapa carga correctamente con marcadores
- Click en un marcador muestra el popup con el nuevo diseño (imagen, nombre, botones "Mapa" y "Reportar")
- En murales con `modificado_aprobado`: popup muestra comparativa before/after

- [ ] **Step 4: Commit**

```bash
git add components/map-view.tsx
git commit -m "refactor: use buildPopupHTML in map-view, remove inline HTML strings"
```

---

## Chunk 4: Componentes Core

### Task 3: Rediseñar components/page-shell.tsx

**Files:**
- Modify: `components/page-shell.tsx`

El nuevo page-shell reemplaza el header basado en Card por un header navy fijo, con stats bar horizontal debajo. Para páginas admin (donde se usa `adminActions`), el componente agrega el sidebar.

- [ ] **Step 1: Reemplazar el contenido completo de page-shell.tsx**

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface Stat {
  label: string;
  value: string | number;
  color?: string;
}

interface PageShellProps {
  title: string;
  children: ReactNode;
  rightActions?: ReactNode;
  fullHeight?: boolean;
  scrollableMain?: boolean;
  showMapButton?: boolean;
  subtitle?: string;
  stats?: Stat[];
  adminActions?: {
    onLogout: () => void;
    showAuditoria?: boolean;
    showBackToPanel?: boolean;
    backToPanelHref?: string;
  };
}

// Sidebar de admin integrado en PageShell para mantener compatibilidad con páginas existentes
function AdminSidebar({
  onLogout,
  showAuditoria,
  showBackToPanel,
  backToPanelHref,
}: NonNullable<PageShellProps['adminActions']>) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Murales', icon: '🗺' },
    { href: '/admin/modificaciones', label: 'Modificaciones', icon: '🔄' },
    ...(showAuditoria !== false ? [{ href: '/admin/auditoria', label: 'Auditoría', icon: '📋' }] : []),
  ];

  return (
    <aside
      style={{ width: '180px', minWidth: '180px', background: '#0f172a' }}
      className="hidden lg:flex flex-col h-full"
    >
      <div style={{ borderBottom: '1px solid #1e293b' }} className="px-4 py-4">
        <div className="text-white font-bold text-sm">Mural Admin</div>
        <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Panel de gestión</div>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
              style={{
                color: isActive ? '#60a5fa' : '#64748b',
                background: isActive ? '#1e293b' : 'transparent',
                borderRight: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ borderTop: '1px solid #1e293b' }} className="p-3">
        {showBackToPanel && backToPanelHref && (
          <Link
            href={backToPanelHref}
            className="block text-center text-xs py-2 px-3 rounded-md mb-2 transition-colors"
            style={{ color: '#94a3b8', background: '#1e293b' }}
          >
            ← Volver
          </Link>
        )}
        <button
          onClick={onLogout}
          className="w-full text-xs py-2 px-3 rounded-md transition-colors text-left"
          style={{ color: '#94a3b8', background: '#1e293b' }}
        >
          ⬡ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export function PageShell({
  title,
  children,
  rightActions,
  fullHeight = true,
  scrollableMain = false,
  showMapButton = true,
  subtitle,
  stats,
  adminActions,
}: PageShellProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAdmin = Boolean(adminActions);

  return (
    <div className={`flex flex-col ${fullHeight ? 'h-screen' : 'min-h-screen'} w-full`} style={{ background: '#f8fafc' }}>
      {/* Header navy */}
      <header style={{ background: '#1e3a5f', flexShrink: 0 }} className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center text-lg rounded-md flex-shrink-0"
              style={{ width: '32px', height: '32px', background: '#3b82f6' }}
            >
              🗺
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm sm:text-base truncate">{title}</div>
              {subtitle && (
                <div className="text-xs truncate" style={{ color: '#93c5fd' }}>{subtitle}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isHomePage && showMapButton && (
              <Link
                href="/"
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              >
                🗺️ Ver Mapa
              </Link>
            )}
            {rightActions}
          </div>
        </div>
      </header>

      {/* Stats bar (solo si hay stats) */}
      {stats && stats.length > 0 && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex divide-x" style={{ borderColor: '#e2e8f0' }}>
              {stats.map((stat, i) => (
                <div key={i} className="flex-1 py-2.5 px-3 text-center">
                  <div
                    className="text-xl font-extrabold leading-none"
                    style={{ color: stat.color || '#1e40af' }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs mt-0.5 uppercase tracking-wide"
                    style={{ color: '#94a3b8', fontSize: '9px', letterSpacing: '0.5px' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body: sidebar + main */}
      <div className={`flex flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${isAdmin ? 'gap-0' : 'py-4 gap-0'}`}>
        {isAdmin && adminActions && (
          <AdminSidebar {...adminActions} />
        )}
        <main
          className={`flex-1 min-w-0 ${isAdmin ? 'lg:pl-6 py-4' : ''} ${scrollableMain ? 'overflow-auto' : 'overflow-hidden flex flex-col min-h-0'}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que la app carga sin errores**

```bash
yarn dev
```
Abrir `http://localhost:3000`. Resultado esperado:
- Header azul marino con logo y título
- Stats bar debajo (si hay stats)
- Contenido principal debajo

- [ ] **Step 3: Eliminar el componente AdminActions que queda huérfano**

El nuevo `page-shell.tsx` internaliza el sidebar y ya no usa `AdminActions`. Verificar que ningún otro archivo lo importa:

```bash
grep -r "AdminActions\|admin-actions" --include="*.ts" --include="*.tsx" .
```
Si no hay otros imports, eliminar:
```bash
git rm components/admin/admin-actions.tsx
```

- [ ] **Step 4: Commit**

```bash
git add components/page-shell.tsx
git commit -m "feat: redesign page-shell with navy header and admin sidebar, remove AdminActions"
```

---

### Task 4: Actualizar app/page.tsx — stats y FAB mobile

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Actualizar las estadísticas para incluir Pendientes y usar colores de la paleta**

En `app/page.tsx`, reemplazar el bloque `stats` (líneas 40-50) y también eliminar el import de `StatsGrid` que ya no se usa directamente (las stats se pasan como prop a `PageShell`):

```typescript
const stats = useMemo(() => {
  const total = murales.length;
  const aprobados = murales.filter(m => m.estado === 'aprobado').length;
  const pendientes = murales.filter(m => m.estado === 'pendiente').length;
  const modificados = murales.filter(m => m.estado === 'modificado_aprobado' || m.estado === 'modificado_pendiente').length;

  return [
    { label: 'Total', value: total, color: '#1e40af' },
    { label: 'Aprobados', value: aprobados, color: '#059669' },
    { label: 'Pendientes', value: pendientes, color: '#d97706' },
    { label: 'Modificados', value: modificados, color: '#3b82f6' },
  ];
}, [murales]);
```

- [ ] **Step 2: Actualizar el botón "Agregar Nuevo" para usar la paleta**

Reemplazar el bloque `rightActions` (dentro del JSX):

```typescript
rightActions={
  <Link
    href="/nuevo"
    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-colors"
    style={{ background: '#1e40af' }}
  >
    <span>+</span>
    <span>Agregar mural</span>
  </Link>
}
```

- [ ] **Step 3: Agregar FAB mobile sobre el mapa**

Después del `<MapView ...>` y antes de `</div>`, agregar el FAB:

```typescript
{/* FAB mobile: solo visible en pantallas pequeñas */}
<Link
  href="/nuevo"
  className="sm:hidden absolute bottom-4 right-4 z-[1000] flex items-center justify-center text-white font-bold text-2xl transition-transform active:scale-95"
  style={{
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#1e40af',
    boxShadow: '0 4px 12px rgba(30,64,175,0.4)',
  }}
  aria-label="Agregar nuevo mural"
>
  +
</Link>
```

Asegurarse de que el div contenedor del mapa tenga `position: relative` para que el FAB se posicione correctamente.

- [ ] **Step 4: Actualizar title y subtitle de PageShell**

Reemplazar en el JSX de `PageShell`:
```typescript
title="Mural Decorativo"
subtitle="Registro de propaganda política · Paraguay"
```

- [ ] **Step 5: Verificar en browser**

```bash
yarn dev
```
Resultado esperado:
- Stats bar muestra 4 contadores con colores semánticos
- Botón "+ Agregar mural" azul en desktop
- FAB "+" azul visible en mobile (< 640px) sobre el mapa

- [ ] **Step 6: Eliminar el import de StatsGrid de app/page.tsx**

En `app/page.tsx`, eliminar la línea:
```typescript
import { StatsGrid } from '@/components/stats-grid';
```
(Las stats ahora se pasan como prop a `PageShell` que las renderiza internamente)

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update home page with 4-stat bar and mobile FAB"
```

---

### Task 5: Rediseñar components/stats-grid.tsx y components/stats-card.tsx

**Files:**
- Modify: `components/stats-grid.tsx`

> El nuevo stats-card ya está embebido en page-shell.tsx como stats bar. Este componente se simplifica para mantener compatibilidad con el admin panel que puede usarlo directamente.

- [ ] **Step 1: Simplificar stats-grid.tsx**

Reemplazar el contenido con:

```typescript
'use client';

import { memo } from 'react';

interface Stat {
  label: string;
  value: string | number;
  color?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

function StatsGridComponent({ stats }: StatsGridProps) {
  if (!stats?.length) return null;

  return (
    <div className="flex divide-x" style={{ borderColor: '#e2e8f0' }}>
      {stats.map((stat, i) => (
        <div key={i} className="flex-1 py-2.5 px-3 text-center">
          <div
            className="text-xl font-extrabold leading-none"
            style={{ color: stat.color || '#1e40af' }}
          >
            {stat.value}
          </div>
          <div
            className="uppercase tracking-wide mt-0.5"
            style={{ color: '#94a3b8', fontSize: '9px', letterSpacing: '0.5px' }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export const StatsGrid = memo(StatsGridComponent);
```

- [ ] **Step 2: Commit**

```bash
git add components/stats-grid.tsx
git commit -m "refactor: simplify StatsGrid to match new design system"
```

---

### Task 6: Rediseñar components/image-uploader.tsx

**Files:**
- Modify: `components/image-uploader.tsx`

- [ ] **Step 1: Leer el archivo actual**

Abrir `components/image-uploader.tsx` para ver la implementación actual antes de modificar.

- [ ] **Step 2: Actualizar la zona de upload**

Leer primero el archivo para identificar el nombre real de los refs y handlers. El componente usa `fileInputRef` (no `inputRef`). Reemplazar solo el JSX de presentación manteniendo todos los refs, validaciones y handlers existentes:

```typescript
// Zona de upload — reemplazar el div contenedor del input con:
<div
  className="relative cursor-pointer transition-colors"
  style={{
    border: '2px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center',
    background: preview ? 'transparent' : '#f8fafc',
  }}
  onClick={() => fileInputRef.current?.click()}
>
  {preview ? (
    <img
      src={preview}
      alt="Preview"
      className="mx-auto rounded-lg object-cover"
      style={{ maxHeight: '160px', maxWidth: '100%' }}
    />
  ) : (
    <>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
        Hacer click para seleccionar foto
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
        JPG, PNG, WebP · Máx. 10MB
      </div>
    </>
  )}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileChange}
  />
</div>
```

> **Nota:** Si el archivo usa un nombre de ref diferente a `fileInputRef`, usar el nombre que ya existe en el archivo. No renombrar refs.

- [ ] **Step 3: Verificar en browser**

Abrir `/nuevo`. Resultado esperado: zona de upload con borde discontinuo, ícono de cámara y texto de instrucciones.

- [ ] **Step 4: Commit**

```bash
git add components/image-uploader.tsx
git commit -m "feat: redesign image uploader with dashed upload zone"
```

---

### Task 7: Actualizar components/estado-badge.tsx

**Files:**
- Modify: `components/estado-badge.tsx`

- [ ] **Step 1: Leer el archivo actual para ver los estados manejados**

- [ ] **Step 2: Actualizar los colores para usar la paleta del spec**

Reemplazar los colores de cada estado con los valores de la nueva paleta:

```typescript
// Mural estados
'pendiente':              { bg: '#fef3c7', text: '#92400e', label: '⏳ Pendiente' }
'aprobado':               { bg: '#dcfce7', text: '#166534', label: '✓ Aprobado' }
'rechazado':              { bg: '#fef2f2', text: '#991b1b', label: '✗ Rechazado' }
'modificado_pendiente':   { bg: '#ede9fe', text: '#5b21b6', label: '🔄 Mod. Pendiente' }
'modificado_aprobado':    { bg: '#dbeafe', text: '#1e40af', label: '✓ Modificado' }

// Modificacion estados
'pendiente':   { bg: '#fef3c7', text: '#92400e', label: '⏳ Pendiente' }
'aprobada':    { bg: '#dcfce7', text: '#166534', label: '✓ Aprobada' }
'rechazada':   { bg: '#fef2f2', text: '#991b1b', label: '✗ Rechazada' }
```

El badge debe tener: `padding: '3px 10px'`, `borderRadius: '20px'`, `fontSize: '11px'`, `fontWeight: '600'`.

- [ ] **Step 3: Commit**

```bash
git add components/estado-badge.tsx
git commit -m "feat: update estado-badge colors to match civic tech palette"
```

---

## Chunk 5: Admin

### Task 8: Rediseñar components/admin/filter-buttons.tsx

**Files:**
- Modify: `components/admin/filter-buttons.tsx`

- [ ] **Step 1: Leer el archivo actual**

- [ ] **Step 2: Actualizar los botones de filtro al nuevo estilo pill**

Los botones deben:
- Fondo blanco + borde gris cuando inactivo: `background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b'`
- Fondo azul cuando activo: `background: '#1e40af', border: '1.5px solid #1e40af', color: 'white'`
- Border-radius: `20px`
- Padding: `6px 14px`
- Font-size: `12px`, font-weight: `600`
- Badge de conteo dentro del botón: `background: 'rgba(255,255,255,0.25)'` (activo) o `background: '#f1f5f9'` (inactivo), `borderRadius: '10px'`, `padding: '1px 7px'`, `fontSize: '10px'`

Ejemplo del botón activo:
```typescript
<button
  style={{
    background: isActive ? '#1e40af' : 'white',
    border: isActive ? '1.5px solid #1e40af' : '1.5px solid #e2e8f0',
    color: isActive ? 'white' : '#64748b',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }}
>
  {label}
  {count !== undefined && (
    <span style={{
      background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
      borderRadius: '10px',
      padding: '1px 7px',
      fontSize: '10px',
    }}>
      {count}
    </span>
  )}
</button>
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/filter-buttons.tsx
git commit -m "feat: redesign filter buttons with pill style"
```

---

### Task 9: Actualizar components/admin/mural-row.tsx

**Files:**
- Modify: `components/admin/mural-row.tsx`

- [ ] **Step 1: Leer el archivo actual**

- [ ] **Step 2: Actualizar los botones de acción a colores semánticos**

Los botones Aprobar/Rechazar deben usar:

```typescript
// Botón Aprobar
style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}

// Botón Rechazar
style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
```

- [ ] **Step 3: Actualizar el badge de estado de la fila**

Reemplazar el uso del componente `EstadoBadge` (o los estilos inline existentes) para que use el componente `EstadoBadge` actualizado en Task 7.

- [ ] **Step 4: Commit**

```bash
git add components/admin/mural-row.tsx
git commit -m "feat: update mural-row with semantic action button colors"
```

---

### Task 10: Actualizar páginas admin

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/login/page.tsx`
- Modify: `app/admin/modificaciones/page.tsx`
- Modify: `app/admin/auditoria/page.tsx`

> Los cambios en estas páginas son principalmente de presentación y se apoyan en el nuevo PageShell con sidebar. El sidebar ya está incluido en PageShell cuando se pasa `adminActions`.

- [ ] **Step 1: Leer app/admin/page.tsx y verificar que usa PageShell con adminActions**

Si la página ya pasa `adminActions` a `PageShell`, el sidebar aparecerá automáticamente gracias al Task 3. Verificar que el título y subtitle sean correctos:

```typescript
<PageShell
  title="Mural Decorativo"
  subtitle="Panel de administración"
  adminActions={{ onLogout, showAuditoria: true }}
  scrollableMain={true}
  ...
>
```

- [ ] **Step 2: Actualizar app/admin/login/page.tsx**

Leer el archivo actual. Localizar el div contenedor principal (el que envuelve todo el formulario) y reemplazarlo por este wrapper, manteniendo INTACTO todo el JSX del formulario (inputs, botones, handlers, estados de error/loading):

```typescript
// Nuevo wrapper externo — reemplaza el div contenedor principal:
<div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  }}>
    {/* Nuevo header del card */}
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{
          width: '36px', height: '36px', background: '#1e3a5f', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '16px',
        }}>🗺</div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>Mural Admin</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Panel de administración</div>
        </div>
      </div>
      <p style={{ fontSize: '13px', color: '#64748b' }}>Ingresá con tus credenciales de administrador</p>
    </div>
    {/* --- PEGAR AQUÍ el formulario existente sin cambios (campos email, password, botón submit, mensajes de error) --- */}
  </div>
</div>
```

El formulario interno (campos, lógica, estados) se mantiene exactamente igual que en el archivo original.

- [ ] **Step 3: Verificar que las páginas admin usan el nuevo layout**

```bash
yarn dev
```
Navegar a `/admin`. Resultado esperado:
- Header navy con logo
- Sidebar oscuro visible en desktop (> 1024px) con "Murales", "Modificaciones", "Auditoría"
- Contenido a la derecha del sidebar

- [ ] **Step 4: Commit**

```bash
git add app/admin/
git commit -m "feat: update admin pages with sidebar layout and new styling"
```

---

## Chunk 6: Formularios Públicos

### Task 11: Rediseñar app/nuevo/page.tsx

**Files:**
- Modify: `app/nuevo/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

- [ ] **Step 2: Actualizar el layout del formulario**

El formulario debe:
- Usar `PageShell` con `title="Registrar nuevo mural"` y `subtitle="Los datos serán revisados antes de publicarse"`
- Layout 2 columnas en desktop (lg:grid-cols-2), 1 columna en mobile
- Columna izquierda: campos de texto (nombre, candidato, url_maps, comentario)
- Columna derecha: zona de upload de imagen

Estructura del formulario:
```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  {/* Columna izquierda: campos */}
  <div className="flex flex-col gap-4">
    {/* campos existentes con el mismo layout */}
  </div>
  {/* Columna derecha: upload */}
  <div>
    <ImageUploader ... />
  </div>
</div>
```

Labels de los campos:
```typescript
<label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
  Nombre del lugar <span style={{ color: '#dc2626' }}>*</span>
</label>
```

Botón de submit:
```typescript
<div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
  <Link href="/" className="px-4 py-2 text-sm font-medium rounded-lg" style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
    Cancelar
  </Link>
  <button
    type="submit"
    disabled={isSubmitting}
    className="px-5 py-2 text-sm font-bold rounded-lg text-white transition-colors"
    style={{ background: isSubmitting ? '#93c5fd' : '#1e40af' }}
  >
    {isSubmitting ? 'Enviando...' : 'Enviar mural →'}
  </button>
</div>
```

- [ ] **Step 3: Verificar en browser**

Abrir `/nuevo`. Resultado esperado:
- Header navy
- Formulario 2 columnas en desktop
- Formulario 1 columna en mobile (< 640px)
- Labels uppercase
- Botón submit azul prominente

- [ ] **Step 4: Commit**

```bash
git add app/nuevo/page.tsx
git commit -m "feat: redesign nuevo form with 2-column layout and civic style"
```

---

### Task 12: Rediseñar app/reportar/page.tsx

**Files:**
- Modify: `app/reportar/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

- [ ] **Step 2: Aplicar el mismo diseño de formulario que en Task 11**

El formulario de reporte es similar a `/nuevo`. Aplicar los mismos cambios:
- Layout 2 columnas: izquierda = datos del reporte (comentario), derecha = nueva foto
- Mostrar la imagen actual del mural arriba del formulario para referencia visual
- Header navy con subtitle "Reportar cambio o eliminación"
- Botón submit azul con texto "Enviar reporte →"

- [ ] **Step 3: Verificar en browser**

Abrir `/reportar?id=<id_de_mural>&name=<nombre>` con un ID válido del seed data. Resultado esperado: formulario con imagen actual del mural + zona de nueva foto.

- [ ] **Step 4: Commit**

```bash
git add app/reportar/page.tsx
git commit -m "feat: redesign reportar form with 2-column layout and civic style"
```

---

### Task 13: Verificación final del rediseño

- [ ] **Step 1: Build de producción**

```bash
yarn build
```
Resultado esperado: build exitoso, 0 errores TypeScript.

- [ ] **Step 2: Checklist visual en browser**

```bash
yarn dev
```

Verificar en `http://localhost:3000`:
- [ ] Header azul marino (`#1e3a5f`) visible en todas las páginas
- [ ] Stats bar con 4 contadores (Total, Aprobados, Pendientes, Modificados) en la home
- [ ] Mapa carga con marcadores y nuevos popups
- [ ] En mobile (DevTools → Toggle device toolbar → 375px): FAB "+" visible sobre el mapa
- [ ] Formulario `/nuevo`: 2 columnas en desktop, 1 en mobile
- [ ] Panel `/admin`: sidebar visible en desktop (> 1024px)

- [ ] **Step 3: Eliminar archivos de mockup del root**

```bash
git rm design-options.html design-mockup.html
git commit -m "chore: remove design mockup files from project root"
```

- [ ] **Step 4: Verificar estado limpio del repo**

```bash
git status
```
Resultado esperado: "nothing to commit, working tree clean"
