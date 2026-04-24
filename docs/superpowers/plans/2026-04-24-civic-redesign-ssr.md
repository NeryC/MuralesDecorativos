# Civic Redesign + SSR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar Murales Políticos a una UI accesible y consistente (paleta navy + IBM Plex Sans + Lucide + shadcn/ui) con todas las páginas en Server Components por default y mutaciones admin vía Server Actions.

**Architecture:** Se reemplaza `globals.css` legacy por tokens shadcn en CSS variables. Se introduce `lib/queries/*` para lectura server-side directa a Supabase y `app/admin/_actions/*` para mutaciones. Cada página pública hace fetch server-side con `searchParams`, hidrata el mapa (Leaflet se mantiene Client). El admin reemplaza `fetch` client→`/api/admin/*` por Server Actions que llaman `revalidateTag`. Se borran componentes legacy (`page-shell`, `status-alert`, `stats-grid`) reemplazados por equivalentes nuevos (`site-header`, `sonner`, `stats-bar`).

**Tech Stack:** Next.js 16.2 · React 19.2 · Tailwind v4 · shadcn/ui (base-nova, slate) · IBM Plex Sans vía `next/font` · Lucide · react-hook-form + zod · Supabase SSR · Leaflet

**Spec:** `docs/superpowers/specs/2026-04-24-civic-redesign-ssr-design.md`

**Verificación:** El proyecto no tiene tests automatizados. Verificación en cada task vía `yarn build` + chequeo manual en browser. Al final de cada chunk: commit.

---

## Convenciones del plan

- **Archivos:** rutas absolutas relativas al repo root
- **Commits:** conventional commits (`feat:`, `refactor:`, `chore:`)
- **Co-author:** nunca agregar `Co-Authored-By: Claude` (preferencia del usuario)
- **Cuando un step diga "verificar en browser":** arrancar `yarn dev` si no está corriendo, abrir la ruta indicada, confirmar lo especificado
- **Todos los emoji como íconos** deben ser reemplazados por `lucide-react` SVGs. No quedarse ninguno

---

## Chunk 1: Setup de dependencias y tokens

### Task 1: Instalar dependencias nuevas

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Agregar lucide-react**

```bash
yarn add lucide-react@^0.454.0
```

- [ ] **Step 2: Agregar react-hook-form + zod + resolvers**

```bash
yarn add react-hook-form@^7.54.2 zod@^3.24.2 @hookform/resolvers@^3.10.0
```

- [ ] **Step 3: Agregar sonner + class-variance-authority**

```bash
yarn add sonner@^1.7.4 class-variance-authority@^0.7.1
```

- [ ] **Step 4: Verificar `yarn build`**

Run: `yarn build`
Expected: build pasa (aún no se usan las deps, solo están instaladas)

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: install lucide, shadcn helpers, rhf + zod, sonner"
```

---

### Task 2: Inicializar shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `app/globals.css`
- Modify: `tsconfig.json` (si shadcn lo pide)

- [ ] **Step 1: Correr init**

```bash
npx shadcn@latest init
```

Responder en el prompt:
- Style: `base-nova`
- Base color: `slate`
- CSS variables: `yes`
- React Server Components: `yes`
- Components alias: `@/components`
- Utils alias: `@/lib/utils`
- Import alias for ui: `@/components/ui`
- Tailwind CSS file: `app/globals.css`
- Tailwind config file: (dejar vacío — Tailwind v4 no usa config JS)
- Icon library: `lucide`

Esto crea `components.json` y modifica `app/globals.css` añadiendo tokens shadcn.

- [ ] **Step 2: Verificar components.json**

Abrir `components.json` y confirmar:
```json
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

Si alguno difiere, editarlo manualmente.

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`
Expected: build pasa, no errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add components.json app/globals.css
git commit -m "chore: initialize shadcn/ui with slate base color"
```

---

### Task 3: Reemplazar globals.css legacy por tokens + base

**Files:**
- Modify: `app/globals.css` (reemplazo completo)

Esta task reemplaza el CSS legacy (paletas azul/naranja/púrpura, gradientes, `.card`, `.glass`, modal styles) por el set shadcn + tokens propios + reduced-motion. shadcn ya puso sus tokens en el Task 2 — ahora consolidamos.

- [ ] **Step 1: Sobreescribir `app/globals.css` con el contenido consolidado**

Contenido completo:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  --font-sans: var(--font-plex), ui-sans-serif, system-ui, sans-serif;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Colors — mapeados a shadcn tokens que están en :root abajo */
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
}

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 4%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 4%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 4%;
  --primary: 222 47% 11%;
  --primary-foreground: 0 0% 100%;
  --secondary: 215 25% 27%;
  --secondary-foreground: 0 0% 100%;
  --muted: 210 20% 93%;
  --muted-foreground: 215 16% 47%;
  --accent: 201 96% 32%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 72% 41%;
  --destructive-foreground: 0 0% 100%;
  --success: 160 84% 30%;
  --success-foreground: 0 0% 100%;
  --warning: 32 91% 36%;
  --warning-foreground: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 201 96% 32%;
  --radius: 0.5rem;
}

.dark {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;
  --card: 222 47% 10%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 10%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
  --secondary: 215 25% 27%;
  --secondary-foreground: 210 40% 98%;
  --muted: 215 25% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 201 90% 55%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 70% 50%;
  --destructive-foreground: 210 40% 98%;
  --success: 160 70% 45%;
  --success-foreground: 222 47% 11%;
  --warning: 32 85% 55%;
  --warning-foreground: 222 47% 11%;
  --border: 215 25% 20%;
  --input: 215 25% 20%;
  --ring: 201 90% 55%;
}

* {
  border-color: hsl(var(--border));
  box-sizing: border-box;
}

html, body {
  width: 100%;
  max-width: 100vw;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

body {
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "tnum" 0;
}

.tabular-nums {
  font-feature-settings: "tnum" 1;
}

*:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Leaflet custom styles — conservado */
.leaflet-container {
  font-family: var(--font-sans);
}

.custom-div-icon {
  background: transparent;
  border: none;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -100px;
  left: 8px;
  padding: 12px 16px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius-md);
  z-index: 10000;
  font-weight: 600;
  transition: top 150ms ease-out;
}

.skip-link:focus-visible {
  top: 8px;
}
```

- [ ] **Step 2: Instalar tw-animate-css (dep usada en el import)**

```bash
yarn add -D tw-animate-css@^1.2.0
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`
Expected: build pasa. Si falla por clases de color legacy (`primary-600`, etc.) que otros componentes usan, no importa ahora — se corrigen al reescribir cada componente.

- [ ] **Step 4: Verificar en browser**

```bash
yarn dev
```

Abrir `http://localhost:3000`. Es normal que la página se vea rota (estilos legacy que todavía referencian `--primary-600` quedaron colgados). Confirmar que al menos no hay errores rojos en consola de browser.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css package.json yarn.lock
git commit -m "refactor: replace legacy CSS with shadcn tokens + reduced-motion"
```

---

### Task 4: Configurar IBM Plex Sans via next/font

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Reemplazar `app/layout.tsx` completo**

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink } from "@/components/skip-link";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://murales-politicos.vercel.app"),
  title: {
    default: "Murales Políticos — Registro de propaganda política en Paraguay",
    template: "%s · Murales Políticos",
  },
  description:
    "Mapa colaborativo para registrar y documentar murales de propaganda política en Paraguay.",
  openGraph: {
    title: "Murales Políticos",
    description:
      "Mapa colaborativo de murales de propaganda política en Paraguay",
    locale: "es_PY",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={plex.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <SkipLink />
        {children}
        <Toaster position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Nota: `<SkipLink>` y `<Toaster>` se crean en tasks posteriores; TypeScript fallará hasta entonces. Esto es intencional — se arreglan en Tasks 5 y 10.

- [ ] **Step 2: No hacer build todavía (fallará por imports no resueltos)**

Saltar hasta que las próximas tasks agreguen los componentes. Si querés validar TS ahora, `yarn tsc --noEmit` mostrará solo esos dos imports fallando — esperado.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: configure IBM Plex Sans via next/font in root layout"
```

---

### Task 5: Crear SkipLink component

**Files:**
- Create: `components/skip-link.tsx`

- [ ] **Step 1: Crear `components/skip-link.tsx`**

```tsx
export function SkipLink() {
  return (
    <a href="#main" className="skip-link">
      Saltar al contenido principal
    </a>
  );
}
```

La clase `.skip-link` ya está en `globals.css` (Task 3).

- [ ] **Step 2: Verificar con `yarn tsc --noEmit`**

Run: `yarn tsc --noEmit`
Expected: solo falla el import de `@/components/ui/sonner` en `app/layout.tsx`; el de skip-link ya resuelve.

- [ ] **Step 3: Commit**

```bash
git add components/skip-link.tsx
git commit -m "feat: add SkipLink component for keyboard navigation"
```

---

## Chunk 2: Componentes shadcn/ui

### Task 6: Instalar componentes shadcn base

**Files:**
- Create: `components/ui/button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `card.tsx`, `badge.tsx`, `alert.tsx`, `skeleton.tsx`

- [ ] **Step 1: Instalar componentes de formulario base**

```bash
npx shadcn@latest add button input label textarea card badge alert skeleton
```

Esto crea `components/ui/button.tsx`, etc. Si los archivos ya existen (del proyecto viejo), la CLI pregunta — responder `y` para sobrescribir.

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`
Expected: los nuevos componentes compilan; sigue fallando el import de `sonner` en layout.

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add shadcn base components (button, input, card, badge, alert, skeleton)"
```

---

### Task 7: Instalar componentes de interacción

**Files:**
- Create: `components/ui/tooltip.tsx`, `dropdown-menu.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`

- [ ] **Step 1: Instalar**

```bash
npx shadcn@latest add tooltip dropdown-menu select dialog sheet
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add shadcn interaction components (tooltip, dropdown, select, dialog, sheet)"
```

---

### Task 8: Instalar componentes de formulario avanzados

**Files:**
- Create: `components/ui/form.tsx`, `tabs.tsx`, `toggle-group.tsx`, `toggle.tsx`

- [ ] **Step 1: Instalar**

```bash
npx shadcn@latest add form tabs toggle-group
```

`toggle-group` arrastra `toggle` automáticamente.

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add shadcn form/tabs/toggle-group components"
```

---

### Task 9: Instalar sonner (toasts)

**Files:**
- Create: `components/ui/sonner.tsx`

- [ ] **Step 1: Instalar**

```bash
npx shadcn@latest add sonner
```

- [ ] **Step 2: Verificar que `components/ui/sonner.tsx` existe y exporta `Toaster`**

Esperado: el archivo exporta `<Toaster>` que es el que importa `app/layout.tsx`.

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`
Expected: los imports del layout.tsx ahora resuelven. Puede quedar algún error por `page-shell` etc. que se corrigen en chunks posteriores — está bien por ahora.

- [ ] **Step 4: Commit**

```bash
git add components/ui/sonner.tsx
git commit -m "feat: add shadcn sonner (toasts)"
```

---

## Chunk 3: Data layer (queries + server actions)

### Task 10: Crear lib/queries/murales.ts (queries públicas)

**Files:**
- Create: `lib/queries/murales.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MuralWithModificaciones } from "@/lib/types";

export type EstadoFilter = "todos" | "aprobado" | "modificado";

export interface MuralesFilters {
  q?: string;
  estado?: EstadoFilter;
}

export async function getMuralesAprobados(
  filters: MuralesFilters = {},
): Promise<MuralWithModificaciones[]> {
  const supabase = await createClient();

  let query = supabase
    .from("murales")
    .select(`
      *,
      mural_modificaciones (*)
    `)
    .order("fecha_creacion", { ascending: false });

  if (filters.estado === "aprobado") {
    query = query.eq("estado", "aprobado");
  } else if (filters.estado === "modificado") {
    query = query.in("estado", ["modificado_aprobado", "modificado_pendiente"]);
  } else {
    // 'todos' o undefined: solo los visibles públicamente
    query = query.in("estado", [
      "aprobado",
      "modificado_aprobado",
      "modificado_pendiente",
    ]);
  }

  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `nombre.ilike.${term},candidato.ilike.${term},comentario.ilike.${term}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getMuralesAprobados]", error);
    return [];
  }

  return (data ?? []) as MuralWithModificaciones[];
}

export async function getMuralById(
  id: string,
): Promise<MuralWithModificaciones | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("murales")
    .select(`*, mural_modificaciones (*)`)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getMuralById]", error);
    return null;
  }

  return data as MuralWithModificaciones;
}

export interface MuralesStats {
  total: number;
  aprobados: number;
  pendientes: number;
  modificados: number;
}

export async function getMuralesStats(): Promise<MuralesStats> {
  const supabase = await createClient();

  const [totalRes, aprobadosRes, pendientesRes, modificadosRes] =
    await Promise.all([
      supabase.from("murales").select("id", { count: "exact", head: true }),
      supabase
        .from("murales")
        .select("id", { count: "exact", head: true })
        .eq("estado", "aprobado"),
      supabase
        .from("murales")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendiente"),
      supabase
        .from("murales")
        .select("id", { count: "exact", head: true })
        .in("estado", ["modificado_aprobado", "modificado_pendiente"]),
    ]);

  return {
    total: totalRes.count ?? 0,
    aprobados: aprobadosRes.count ?? 0,
    pendientes: pendientesRes.count ?? 0,
    modificados: modificadosRes.count ?? 0,
  };
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`
Expected: sin errores en este archivo.

- [ ] **Step 3: Commit**

```bash
git add lib/queries/murales.ts
git commit -m "feat: add server-side queries for public murales"
```

---

### Task 11: Crear lib/queries/admin-murales.ts

**Files:**
- Create: `lib/queries/admin-murales.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MuralWithModificaciones } from "@/lib/types";

export interface AdminMuralesFilters {
  page?: number;
  pageSize?: number;
  estado?: "pendiente" | "aprobado" | "rechazado" | "modificado_pendiente" | "todos";
  q?: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getAllMurales(
  filters: AdminMuralesFilters = {},
): Promise<PagedResult<MuralWithModificaciones>> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("murales")
    .select(`*, mural_modificaciones (*)`, { count: "exact" })
    .order("fecha_creacion", { ascending: false })
    .range(from, to);

  if (filters.estado && filters.estado !== "todos") {
    query = query.eq("estado", filters.estado);
  }

  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`nombre.ilike.${term},candidato.ilike.${term}`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[getAllMurales]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as MuralWithModificaciones[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function countMuralesPendientes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("murales")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");
  return count ?? 0;
}

export async function countModificacionesPendientes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("mural_modificaciones")
    .select("id", { count: "exact", head: true })
    .eq("estado_solicitud", "pendiente");
  return count ?? 0;
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add lib/queries/admin-murales.ts
git commit -m "feat: add paginated admin queries with filter and counts"
```

---

### Task 12: Crear lib/queries/modificaciones.ts y auditoria.ts

**Files:**
- Create: `lib/queries/modificaciones.ts`
- Create: `lib/queries/auditoria.ts`

- [ ] **Step 1: Crear `lib/queries/modificaciones.ts`**

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MuralModificacion, Mural } from "@/lib/types";
import type { PagedResult } from "./admin-murales";

export interface ModificacionConMural extends MuralModificacion {
  mural: Mural;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getModificacionesPendientes(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<PagedResult<ModificacionConMural>> {
  const supabase = await createClient();
  const p = Math.max(1, page);
  const size = Math.max(1, Math.min(100, pageSize));
  const from = (p - 1) * size;
  const to = from + size - 1;

  const { data, count, error } = await supabase
    .from("mural_modificaciones")
    .select(`*, mural:murales(*)`, { count: "exact" })
    .eq("estado_solicitud", "pendiente")
    .order("fecha_creacion", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getModificacionesPendientes]", error);
    return { data: [], total: 0, page: p, pageSize: size, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as ModificacionConMural[],
    total,
    page: p,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  };
}
```

- [ ] **Step 2: Crear `lib/queries/auditoria.ts`**

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Auditoria, AccionAuditoria } from "@/lib/types";
import type { PagedResult } from "./admin-murales";

export interface AuditoriaFilters {
  page?: number;
  pageSize?: number;
  accion?: AccionAuditoria;
  desde?: string;
  hasta?: string;
}

const DEFAULT_PAGE_SIZE = 30;

export async function getAuditoria(
  filters: AuditoriaFilters = {},
): Promise<PagedResult<Auditoria>> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("auditoria")
    .select("*", { count: "exact" })
    .order("fecha_creacion", { ascending: false })
    .range(from, to);

  if (filters.accion) query = query.eq("accion", filters.accion);
  if (filters.desde) query = query.gte("fecha_creacion", filters.desde);
  if (filters.hasta) query = query.lte("fecha_creacion", filters.hasta);

  const { data, count, error } = await query;

  if (error) {
    console.error("[getAuditoria]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as Auditoria[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

Nota: si el tipo `AccionAuditoria` no existe en `lib/types.ts`, agregarlo como:

```ts
// en lib/types.ts, si falta
export type AccionAuditoria =
  | 'aprobar_mural'
  | 'rechazar_mural'
  | 'aprobar_modificacion'
  | 'rechazar_modificacion'
  | 'actualizar_estado';
```

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`
Si falla por `Auditoria` o `AccionAuditoria`, agregarlos a `lib/types.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/modificaciones.ts lib/queries/auditoria.ts lib/types.ts
git commit -m "feat: add queries for modificaciones and auditoria with filters"
```

---

### Task 13: Crear zod schemas

**Files:**
- Create: `lib/schemas/mural.ts`
- Create: `lib/schemas/reporte.ts`

- [ ] **Step 1: Crear `lib/schemas/mural.ts`**

```ts
import { z } from "zod";

export const muralSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  candidato: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .or(z.literal("")),
  url_maps: z
    .string()
    .trim()
    .url("URL inválida")
    .refine(
      (v) => v.includes("google.com/maps") || v.includes("maps.app.goo.gl"),
      "Debe ser un enlace de Google Maps",
    ),
  comentario: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type MuralFormValues = z.infer<typeof muralSchema>;
```

- [ ] **Step 2: Crear `lib/schemas/reporte.ts`**

```ts
import { z } from "zod";

export const reporteSchema = z.object({
  tipo: z.enum(["eliminacion", "modificacion"], {
    required_error: "Seleccioná el tipo de reporte",
  }),
  motivo: z
    .string()
    .trim()
    .min(5, "Al menos 5 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
});

export type ReporteFormValues = z.infer<typeof reporteSchema>;
```

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add lib/schemas/
git commit -m "feat: add zod schemas for mural and reporte forms"
```

---

### Task 14: Crear Server Actions para murales

**Files:**
- Create: `app/admin/_actions/murales.ts`

- [ ] **Step 1: Crear el archivo**

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { MESSAGES } from "@/lib/messages";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireAdmin(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string; userEmail: string | null }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false, error: "No autenticado" };
  }
  return { ok: true, supabase, userId: user.id, userEmail: user.email ?? null };
}

export async function aprobarMuralAction(muralId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("murales")
    .update({ estado: "aprobado" })
    .eq("id", muralId);

  if (error) {
    console.error("[aprobarMuralAction]", error);
    return { success: false, error: MESSAGES.ERROR.ACTUALIZAR_ESTADO };
  }

  await registrarAuditoria({
    accion: "aprobar_mural",
    mural_id: muralId,
    admin_id: auth.userId,
    admin_email: auth.userEmail,
  });

  revalidateTag("murales");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function rechazarMuralAction(
  muralId: string,
  motivo: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("murales")
    .update({ estado: "rechazado" })
    .eq("id", muralId);

  if (error) {
    console.error("[rechazarMuralAction]", error);
    return { success: false, error: MESSAGES.ERROR.ACTUALIZAR_ESTADO };
  }

  await registrarAuditoria({
    accion: "rechazar_mural",
    mural_id: muralId,
    admin_id: auth.userId,
    admin_email: auth.userEmail,
    detalles: motivo ? { motivo } : undefined,
  });

  revalidateTag("murales");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function actualizarEstadoMuralAction(
  muralId: string,
  estado: "pendiente" | "aprobado" | "rechazado",
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("murales")
    .update({ estado })
    .eq("id", muralId);

  if (error) {
    console.error("[actualizarEstadoMuralAction]", error);
    return { success: false, error: MESSAGES.ERROR.ACTUALIZAR_ESTADO };
  }

  await registrarAuditoria({
    accion: "actualizar_estado",
    mural_id: muralId,
    admin_id: auth.userId,
    admin_email: auth.userEmail,
    detalles: { nuevo_estado: estado },
  });

  revalidateTag("murales");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
```

Nota: la firma exacta de `registrarAuditoria` depende de `lib/auditoria.ts`. Abrir ese archivo y ajustar los nombres de campos si es necesario (`admin_id`, `admin_email`, `detalles` son tentativos).

- [ ] **Step 2: Verificar firma de `registrarAuditoria`**

Abrir `lib/auditoria.ts`. Ajustar los nombres de campos en las 3 llamadas de arriba para que coincidan con los parámetros reales de la función.

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/admin/_actions/murales.ts
git commit -m "feat: add server actions for mural approval/rejection"
```

---

### Task 15: Crear Server Actions para modificaciones

**Files:**
- Create: `app/admin/_actions/modificaciones.ts`

- [ ] **Step 1: Crear el archivo**

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { MESSAGES } from "@/lib/messages";
import type { ActionResult } from "./murales";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, userId: user.id, userEmail: user.email ?? null };
}

export async function aprobarModificacionAction(
  muralId: string,
  modificacionId: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth) return { success: false, error: "No autenticado" };

  const { data: mod, error: modError } = await auth.supabase
    .from("mural_modificaciones")
    .select("*")
    .eq("id", modificacionId)
    .eq("mural_id", muralId)
    .single();

  if (modError || !mod) {
    return { success: false, error: "Modificación no encontrada" };
  }

  const { error: updateModError } = await auth.supabase
    .from("mural_modificaciones")
    .update({ estado_solicitud: "aprobada" })
    .eq("id", modificacionId);

  if (updateModError) {
    return { success: false, error: MESSAGES.ERROR.PROCESAR_MODIFICACION };
  }

  const { error: updateMuralError } = await auth.supabase
    .from("murales")
    .update({
      estado: "modificado_aprobado",
      imagen_url: mod.imagen_nueva_url,
      imagen_thumbnail_url: mod.imagen_nueva_thumbnail_url,
    })
    .eq("id", muralId);

  if (updateMuralError) {
    return { success: false, error: MESSAGES.ERROR.PROCESAR_MODIFICACION };
  }

  await registrarAuditoria({
    accion: "aprobar_modificacion",
    mural_id: muralId,
    modificacion_id: modificacionId,
    admin_id: auth.userId,
    admin_email: auth.userEmail,
  });

  revalidateTag("murales");
  revalidatePath("/admin");
  revalidatePath("/admin/modificaciones");
  revalidatePath("/");
  return { success: true };
}

export async function rechazarModificacionAction(
  muralId: string,
  modificacionId: string,
  motivo: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth) return { success: false, error: "No autenticado" };

  const { error } = await auth.supabase
    .from("mural_modificaciones")
    .update({ estado_solicitud: "rechazada" })
    .eq("id", modificacionId)
    .eq("mural_id", muralId);

  if (error) {
    return { success: false, error: MESSAGES.ERROR.PROCESAR_MODIFICACION };
  }

  await registrarAuditoria({
    accion: "rechazar_modificacion",
    mural_id: muralId,
    modificacion_id: modificacionId,
    admin_id: auth.userId,
    admin_email: auth.userEmail,
    detalles: motivo ? { motivo } : undefined,
  });

  revalidateTag("murales");
  revalidatePath("/admin");
  revalidatePath("/admin/modificaciones");
  return { success: true };
}
```

- [ ] **Step 2: Ajustar firma de `registrarAuditoria` según `lib/auditoria.ts`**

Ver Task 14 Step 2.

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/admin/_actions/modificaciones.ts
git commit -m "feat: add server actions for modificaciones approval/rejection"
```

---

## Chunk 4: Proxy (middleware) con admin guard

### Task 16: Agregar admin guard al proxy

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Reemplazar la función `proxy` completa**

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMITED_PATHS = ['/api/upload'];

function isRateLimited(ip: string, pathname: string): boolean {
  const isMuralesPost = pathname === '/api/murales' || pathname.startsWith('/api/murales/');
  const isUploadPost = RATE_LIMITED_PATHS.some(path => pathname.startsWith(path));
  if (!isMuralesPost && !isUploadPost) return false;

  const now = Date.now();
  const routeFamily = isMuralesPost ? 'murales' : 'upload';
  const key = `${ip}:${routeFamily}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > RATE_LIMIT_MAX;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate limiting (POSTs)
  if (request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' },
        { status: 429 }
      );
    }
  }

  // 2. Supabase session refresh
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 3. Admin guard — proteger /admin/* excepto /admin/login
  const isAdminPath =
    pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  if (isAdminPath && !user) {
    const redirectUrl = new URL('/admin/login', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: Verificar `yarn build`**

Run: `yarn build`
Expected: sin errores.

- [ ] **Step 3: Verificar manualmente el guard**

```bash
yarn dev
```

Abrir en navegación privada `http://localhost:3000/admin`. Debe redirigir a `/admin/login?next=%2Fadmin`.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat: add admin route guard to proxy middleware"
```

---

## Chunk 5: Componentes base custom

### Task 17: Crear error-view y empty-state

**Files:**
- Create: `components/error-view.tsx`
- Create: `components/empty-state.tsx`

- [ ] **Step 1: Crear `components/error-view.tsx`**

```tsx
"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorViewProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorView({
  title = "Algo salió mal",
  description = "Ocurrió un error al cargar esta página. Podés reintentar o volver al inicio.",
  onRetry,
}: ErrorViewProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="size-4 mr-2" aria-hidden="true" />
              Reintentar
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Crear `components/empty-state.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-3">
          <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}
```

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/error-view.tsx components/empty-state.tsx
git commit -m "feat: add ErrorView and EmptyState components"
```

---

### Task 18: Crear error.tsx y loading.tsx globales

**Files:**
- Create: `app/error.tsx`
- Create: `app/loading.tsx`
- Create: `app/not-found.tsx`

- [ ] **Step 1: Crear `app/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/error-view";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error.tsx]", error);
  }, [error]);

  return <ErrorView onRetry={reset} />;
}
```

- [ ] **Step 2: Crear `app/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Skeleton className="h-14 w-full" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `app/not-found.tsx`**

```tsx
import Link from "next/link";
import { MapPinX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="rounded-full bg-muted p-3">
        <MapPinX className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground max-w-md">
        La página que buscás no existe o fue movida.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add app/error.tsx app/loading.tsx app/not-found.tsx
git commit -m "feat: add global error, loading, and not-found segments"
```

---

### Task 19: Crear site-header

**Files:**
- Create: `components/site-header.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
import Link from "next/link";
import { MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          aria-label="Ir al inicio"
        >
          <MapPinned className="size-5" aria-hidden="true" />
          <span className="text-sm md:text-base">Murales Políticos</span>
          <span className="hidden md:inline text-xs font-normal text-primary-foreground/70">
            · Paraguay
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/nuevo">
              <Plus className="size-4" aria-hidden="true" />
              Agregar mural
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/site-header.tsx
git commit -m "feat: add SiteHeader with navy bg and Lucide icons"
```

---

### Task 20: Crear stats-bar

**Files:**
- Create: `components/stats-bar.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
import type { MuralesStats } from "@/lib/queries/murales";

interface StatsBarProps {
  stats: MuralesStats;
}

const items = [
  { key: "total", label: "Total", color: "text-foreground" },
  { key: "aprobados", label: "Aprobados", color: "text-success" },
  { key: "pendientes", label: "Pendientes", color: "text-warning" },
  { key: "modificados", label: "Modificados", color: "text-accent" },
] as const;

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="w-full border-b bg-card">
      <div className="mx-auto grid grid-cols-4 gap-0 px-4 md:px-6">
        {items.map((item, idx) => (
          <div
            key={item.key}
            className={`flex flex-col items-center justify-center py-3 md:py-4 ${
              idx > 0 ? "border-l" : ""
            }`}
          >
            <span className={`text-xl md:text-2xl font-semibold tabular-nums ${item.color}`}>
              {stats[item.key]}
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/stats-bar.tsx
git commit -m "feat: add StatsBar with tabular numerics and semantic colors"
```

---

### Task 21: Crear filter-chips

**Files:**
- Create: `components/filter-chips.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Estado = "todos" | "aprobado" | "modificado";

const items: { value: Estado; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aprobado", label: "Aprobados" },
  { value: "modificado", label: "Modificados" },
];

export function FilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (searchParams.get("estado") ?? "todos") as Estado;

  const handleChange = useCallback(
    (value: string) => {
      if (!value) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value === "todos") params.delete("estado");
      else params.set("estado", value);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={handleChange}
      disabled={isPending}
      variant="outline"
      size="sm"
      aria-label="Filtrar por estado"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} aria-label={item.label}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/filter-chips.tsx
git commit -m "feat: add FilterChips controlled by searchParams"
```

---

### Task 22: Crear search-bar

**Files:**
- Create: `components/search-bar.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const commit = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const onChange = (next: string) => {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(next), 300);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nombre, candidato o ubicación..."
        aria-label="Buscar murales"
        className="pl-9"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/search-bar.tsx
git commit -m "feat: add debounced SearchBar updating searchParams"
```

---

### Task 23: Refactor estado-badge con shadcn Badge

**Files:**
- Modify: `components/estado-badge.tsx`

- [ ] **Step 1: Reemplazar contenido completo**

```tsx
import { Badge } from "@/components/ui/badge";
import type { EstadoMural } from "@/lib/types";

interface EstadoBadgeProps {
  estado: EstadoMural;
}

const config: Record<
  EstadoMural,
  { label: string; className: string }
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-success/10 text-success border-success/30",
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  modificado_pendiente: {
    label: "Modif. pendiente",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  modificado_aprobado: {
    label: "Modificado",
    className: "bg-accent/10 text-accent border-accent/30",
  },
};

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const cfg = config[estado];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
```

Si el archivo actual hace export default, mantenerlo o ajustar los imports. Esta versión hace export nombrado.

- [ ] **Step 2: Buscar usos y actualizar imports**

```bash
grep -rn "estado-badge" app/ components/
```

Para cada uso que haga `import EstadoBadge from '@/components/estado-badge'` cambiarlo a `import { EstadoBadge } from '@/components/estado-badge'` (named import).

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/estado-badge.tsx
git commit -m "refactor: rebuild EstadoBadge on shadcn Badge with semantic colors"
```

---

## Chunk 6: Home + mapa público

### Task 24: Refactor mural-map (ex map-view)

**Files:**
- Create: `components/mural-map.tsx`
- Modify: `lib/map-popup.ts`

- [ ] **Step 1: Copiar contenido de `components/map-view.tsx` a `components/mural-map.tsx`**

```bash
cp components/map-view.tsx components/mural-map.tsx
```

Editar `components/mural-map.tsx` para que exporte como `MuralMap` (named export) y acepte props:

```tsx
// Al inicio del archivo, después de los imports:
interface MuralMapProps {
  murales: MuralWithModificaciones[];
  onImageClick?: (url: string) => void;
  highlightId?: string;
}

export function MuralMap({ murales, onImageClick, highlightId }: MuralMapProps) {
  // ... cuerpo existente de MapView renombrado y adaptado
}
```

Eliminar el uso interno de `useMuralData` si lo tiene — ahora los murales vienen por props. El componente solo renderiza el mapa y popups.

- [ ] **Step 2: Actualizar `lib/map-popup.ts`**

Abrir el archivo. Reemplazar cualquier uso de emoji como ícono en el HTML generado por SVG inline de Lucide (usar strings — no JSX, porque el popup es HTML crudo). Ejemplo de reemplazo de emoji por SVG:

```ts
// Reemplazo de 📍:
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Reemplazo de 🔗 / → etc: usar SVG equivalentes de Lucide (buscar en https://lucide.dev)
```

Y actualizar la tipografía:

```ts
// Dentro de los estilos inline del popup, reemplazar cualquier `font-family: Inter` por:
font-family: var(--font-plex), system-ui, sans-serif;
```

Mantener intacto el uso de `escapeHtml()`.

- [ ] **Step 3: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/mural-map.tsx lib/map-popup.ts
git commit -m "refactor: rename MapView -> MuralMap with props, update popup typography and SVGs"
```

---

### Task 25: Refactor home page a Server Component

**Files:**
- Modify: `app/page.tsx`
- Create: `components/home-map-client.tsx` (wrapper client del mapa)

- [ ] **Step 1: Crear `components/home-map-client.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ImageModal from "@/components/image-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { MuralWithModificaciones } from "@/lib/types";

const MuralMap = dynamic(
  () => import("@/components/mural-map").then((m) => m.MuralMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

interface HomeMapClientProps {
  murales: MuralWithModificaciones[];
  highlightId?: string;
}

export function HomeMapClient({ murales, highlightId }: HomeMapClientProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <>
      <MuralMap
        murales={murales}
        onImageClick={handleImageClick}
        highlightId={highlightId}
      />
      <ImageModal imageUrl={selectedImage} onClose={handleCloseImage} />
    </>
  );
}
```

- [ ] **Step 2: Reemplazar `app/page.tsx` completo**

```tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StatsBar } from "@/components/stats-bar";
import { SearchBar } from "@/components/search-bar";
import { FilterChips } from "@/components/filter-chips";
import { HomeMapClient } from "@/components/home-map-client";
import {
  getMuralesAprobados,
  getMuralesStats,
  type EstadoFilter,
} from "@/lib/queries/murales";
import type { Metadata } from "next";

export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    highlight?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getMuralesStats();
  return {
    title: `${stats.aprobados} murales registrados`,
    description: `Mapa colaborativo con ${stats.aprobados} murales de propaganda política documentados en Paraguay.`,
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const estado = (params.estado ?? "todos") as EstadoFilter;

  const [murales, stats] = await Promise.all([
    getMuralesAprobados({ q: params.q, estado }),
    getMuralesStats(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <StatsBar stats={stats} />

      <main id="main" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between px-4 md:px-6 py-3 border-b bg-card">
          <SearchBar />
          <FilterChips />
        </div>

        <div className="flex-1 relative">
          <HomeMapClient murales={murales} highlightId={params.highlight} />
        </div>
      </main>

      <Link
        href="/nuevo"
        className="sm:hidden fixed bottom-6 right-4 z-[1000] flex items-center justify-center bg-primary text-primary-foreground shadow-lg size-14 rounded-xl"
        aria-label="Agregar nuevo mural"
      >
        <Plus className="size-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`
Expected: build pasa. Si falla, resolver errores de imports puntuales.

- [ ] **Step 4: Verificar en browser**

```bash
yarn dev
```

Abrir `http://localhost:3000/`:
- Header navy visible con logo Lucide `MapPinned`
- StatsBar con 4 counters
- Buscador + filter chips encima del mapa
- Mapa carga con los murales
- FAB "+" visible en mobile (usar DevTools responsive a 375px)
- "View Source" (Ctrl+U) muestra los datos de stats en el HTML inicial

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/home-map-client.tsx
git commit -m "feat: migrate home page to Server Component with SSR data"
```

---

## Chunk 7: Formularios públicos

### Task 26: Actualizar compressImage a WebP + EXIF

**Files:**
- Modify: `lib/utils.ts`

- [ ] **Step 1: Reemplazar función `compressImage` completa**

```ts
/**
 * Comprime una imagen a WebP respetando la orientación EXIF.
 */
export async function compressImage(
  file: File,
  maxWidth: number = IMAGE_COMPRESSION.maxWidth,
  maxHeight: number = IMAGE_COMPRESSION.maxHeight,
  quality: number = IMAGE_COMPRESSION.quality,
): Promise<Blob> {
  // createImageBitmap respeta EXIF orientation con imageOrientation: 'from-image'
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  let width = bitmap.width;
  let height = bitmap.height;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo obtener el contexto del canvas");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Error al comprimir la imagen"));
      },
      "image/webp",
      quality,
    );
  });
}
```

- [ ] **Step 2: Ajustar `use-image-upload` si hardcodea extensión**

```bash
grep -rn "\.jpg\|image/jpeg" hooks/ components/image-uploader.tsx
```

Revisar los matches. Si alguno hardcodea `.jpg`, cambiar a derivar la extensión del `blob.type` (o simplemente usar `.webp`). Ejemplo: cuando se crea un File desde Blob para upload:

```ts
const webpFile = new File([blob], `mural-${Date.now()}.webp`, { type: blob.type });
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`
Expected: sin errores.

- [ ] **Step 4: Verificar en browser**

```bash
yarn dev
```

Abrir `/nuevo` (aún con UI vieja), seleccionar una imagen. En DevTools Network ver el POST a `/api/upload` — `file.type` debe ser `image/webp`.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts hooks/use-image-upload.ts components/image-uploader.tsx
git commit -m "refactor: compressImage outputs WebP and respects EXIF orientation"
```

---

### Task 27: Rebuild image-uploader con shadcn primitives

**Files:**
- Modify: `components/image-uploader.tsx`

- [ ] **Step 1: Reemplazar contenido completo**

```tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  resetKey?: number;
}

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function ImageUploader({
  onFileSelect,
  onError,
  disabled,
  resetKey,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [resetKey]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
        setFileName(null);
        onFileSelect(null);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        onError?.("La imagen supera el tamaño máximo de 10 MB.");
        return;
      }
      if (!ACCEPTED.split(",").includes(file.type)) {
        onError?.("Solo se permiten imágenes JPG, PNG o WebP.");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect, onError],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const clear = () => {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Imagen <span className="text-destructive">*</span>
      </label>

      {preview ? (
        <div className="relative rounded-md border overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={fileName ?? "Vista previa"}
            className="w-full h-auto max-h-72 object-contain"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clear}
            disabled={disabled}
            className="absolute top-2 right-2"
          >
            <X className="size-4" aria-hidden="true" />
            Cambiar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 transition-colors",
            "text-muted-foreground hover:border-accent hover:text-accent",
            dragOver && "border-accent text-accent bg-accent/5",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <ImagePlus className="size-8" aria-hidden="true" />
          <span className="text-sm font-medium">
            Tocá o arrastrá una imagen
          </span>
          <span className="text-xs">JPG, PNG o WebP · máx 10 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onInputChange}
        disabled={disabled}
        className="sr-only"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/image-uploader.tsx
git commit -m "refactor: redesign ImageUploader with dashed border, preview, shadcn primitives"
```

---

### Task 28: Crear mural-form.tsx (Client Component con rhf + zod)

**Files:**
- Create: `components/mural-form.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ImageUploader from "@/components/image-uploader";
import { MapField } from "@/components/map-field";
import { muralSchema, type MuralFormValues } from "@/lib/schemas/mural";
import { useImageUpload } from "@/hooks/use-image-upload";
import { MESSAGES } from "@/lib/messages";

export function MuralForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);

  const form = useForm<MuralFormValues>({
    resolver: zodResolver(muralSchema),
    defaultValues: { nombre: "", candidato: "", url_maps: "", comentario: "" },
  });

  const { uploadImage, isUploading } = useImageUpload({
    onError: (msg) => toast.error(msg),
  });

  const onSubmit = async (values: MuralFormValues) => {
    if (!file) {
      toast.error(MESSAGES.VALIDATION.SELECCIONAR_FOTO);
      return;
    }
    setSubmitting(true);
    try {
      const urls = await uploadImage(file);
      if (!urls) return;

      const res = await fetch("/api/murales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          imagen_url: urls.originalUrl,
          imagen_thumbnail_url: urls.thumbnailUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? MESSAGES.ERROR.ENVIAR_MURAL);
      }

      toast.success(MESSAGES.SUCCESS.MURAL_ENVIADO);
      form.reset();
      setFile(null);
      setResetKey((k) => k + 1);
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : MESSAGES.ERROR.ENVIAR_MURAL);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isSubmitting || isUploading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">
              Nombre del lugar <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              {...form.register("nombre")}
              aria-invalid={!!form.formState.errors.nombre}
              aria-describedby={form.formState.errors.nombre ? "nombre-err" : undefined}
            />
            {form.formState.errors.nombre && (
              <p id="nombre-err" role="alert" className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="candidato">Candidato (opcional)</Label>
            <Input
              id="candidato"
              placeholder="Ej: Juan Pérez"
              {...form.register("candidato")}
            />
            {form.formState.errors.candidato && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.candidato.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url_maps">
              Ubicación <span className="text-destructive">*</span>
            </Label>
            <MapField
              key={resetKey}
              value={form.watch("url_maps")}
              onLocationSelect={(url) =>
                form.setValue("url_maps", url, { shouldValidate: true })
              }
              initialZoom={13}
            />
            {form.formState.errors.url_maps && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.url_maps.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentario (opcional)</Label>
            <Textarea
              id="comentario"
              rows={4}
              {...form.register("comentario")}
            />
            {form.formState.errors.comentario && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.comentario.message}
              </p>
            )}
          </div>
        </div>

        <ImageUploader
          onFileSelect={setFile}
          onError={(msg) => toast.error(msg)}
          disabled={busy}
          resetKey={resetKey}
        />
      </div>

      <div className="sticky bottom-0 sm:static flex justify-end gap-3 pt-4 border-t bg-background">
        <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>Enviando...</>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Enviar mural
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/mural-form.tsx
git commit -m "feat: add MuralForm with react-hook-form + zod validation"
```

---

### Task 29: Refactor /nuevo page a Server shell

**Files:**
- Modify: `app/nuevo/page.tsx`
- Create: `app/nuevo/error.tsx`

- [ ] **Step 1: Reemplazar `app/nuevo/page.tsx` completo**

```tsx
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { MuralForm } from "@/components/mural-form";

export const metadata: Metadata = {
  title: "Registrar mural",
  description: "Registrá un mural de propaganda política en Paraguay. Será revisado antes de publicarse.",
  robots: { index: true, follow: true },
};

export default function NuevoMuralPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Registrar nuevo mural</h1>
            <p className="text-muted-foreground mt-1">
              Los datos serán revisados antes de publicarse.
            </p>
          </div>
          <MuralForm />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Crear `app/nuevo/error.tsx`**

```tsx
"use client";
import { ErrorView } from "@/components/error-view";

export default function NuevoError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView onRetry={reset} />;
}
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`
Expected: sin errores.

- [ ] **Step 4: Verificar en browser**

```bash
yarn dev
```

Abrir `/nuevo`:
- Header navy visible
- Form 2 columnas en desktop, 1 en mobile
- Labels con asterisco rojo
- Al enviar mural con campos vacíos: errores inline debajo de cada input con `role="alert"`
- Al seleccionar imagen: preview con botón "Cambiar"
- Al enviar con éxito: toast verde de sonner

- [ ] **Step 5: Commit**

```bash
git add app/nuevo/page.tsx app/nuevo/error.tsx
git commit -m "feat: migrate /nuevo to server shell + client form"
```

---

### Task 30: Rebuild /reportar

**Files:**
- Modify: `app/reportar/page.tsx`
- Create: `components/reporte-form.tsx`
- Create: `app/reportar/error.tsx`

- [ ] **Step 1: Crear `components/reporte-form.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ImageUploader from "@/components/image-uploader";
import { reporteSchema, type ReporteFormValues } from "@/lib/schemas/reporte";
import { useImageUpload } from "@/hooks/use-image-upload";
import { MESSAGES } from "@/lib/messages";

interface ReporteFormProps {
  muralId: string;
  muralName: string;
}

export function ReporteForm({ muralId, muralName }: ReporteFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const form = useForm<ReporteFormValues>({
    resolver: zodResolver(reporteSchema),
    defaultValues: { tipo: "eliminacion", motivo: "" },
  });

  const { uploadImage, isUploading } = useImageUpload({
    onError: (msg) => toast.error(msg),
  });

  const tipo = form.watch("tipo");

  const onSubmit = async (values: ReporteFormValues) => {
    setBusy(true);
    try {
      let imagen_url: string | undefined;
      let imagen_thumbnail_url: string | undefined;

      if (values.tipo === "modificacion" && file) {
        const urls = await uploadImage(file);
        if (!urls) return;
        imagen_url = urls.originalUrl;
        imagen_thumbnail_url = urls.thumbnailUrl;
      }

      const res = await fetch(`/api/murales/${muralId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, imagen_url, imagen_thumbnail_url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al enviar el reporte");
      }

      toast.success(MESSAGES.SUCCESS.REPORTE_ENVIADO ?? "Reporte enviado");
      form.reset();
      setFile(null);
      setResetKey((k) => k + 1);
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar el reporte");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Reportando mural:</p>
        <p className="font-medium">{muralName}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo de reporte</Label>
        <RadioGroup
          value={tipo}
          onValueChange={(v) =>
            form.setValue("tipo", v as "eliminacion" | "modificacion", { shouldValidate: true })
          }
          className="flex flex-col gap-2"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="eliminacion" id="eliminacion" />
            <span>Fue eliminado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="modificacion" id="modificacion" />
            <span>Fue modificado</span>
          </label>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivo">
          Motivo <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="motivo"
          rows={4}
          {...form.register("motivo")}
          aria-invalid={!!form.formState.errors.motivo}
        />
        {form.formState.errors.motivo && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.motivo.message}
          </p>
        )}
      </div>

      {tipo === "modificacion" && (
        <ImageUploader
          onFileSelect={setFile}
          onError={(msg) => toast.error(msg)}
          disabled={busy || isUploading}
          resetKey={resetKey}
        />
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy || isUploading}>
          <Send className="size-4" aria-hidden="true" />
          {busy ? "Enviando..." : "Enviar reporte"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Instalar `radio-group` shadcn si no está**

```bash
npx shadcn@latest add radio-group
```

- [ ] **Step 3: Reemplazar `app/reportar/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ReporteForm } from "@/components/reporte-form";
import { getMuralById } from "@/lib/queries/murales";

interface ReportarPageProps {
  searchParams: Promise<{ id?: string; name?: string }>;
}

export async function generateMetadata({ searchParams }: ReportarPageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: params.name ? `Reportar ${params.name}` : "Reportar mural",
    description: "Reportá la eliminación o modificación de un mural.",
    robots: { index: false, follow: false },
  };
}

export default async function ReportarPage({ searchParams }: ReportarPageProps) {
  const params = await searchParams;
  if (!params.id) notFound();

  const mural = await getMuralById(params.id);
  if (!mural) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-6 md:py-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Reportar mural</h1>
            <p className="text-muted-foreground mt-1">
              Informá si el mural fue eliminado o modificado.
            </p>
          </div>
          <ReporteForm muralId={mural.id} muralName={mural.nombre} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Crear `app/reportar/error.tsx`**

```tsx
"use client";
import { ErrorView } from "@/components/error-view";
export default function ReportarError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView onRetry={reset} />;
}
```

- [ ] **Step 5: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 6: Verificar en browser**

```bash
yarn dev
```

Abrir un mural aprobado en el mapa, clickear "Reportar". Debe abrir `/reportar?id=...&name=...`. Ver la card con el nombre del mural, seleccionar "Fue modificado", debe aparecer el image uploader.

- [ ] **Step 7: Commit**

```bash
git add app/reportar/page.tsx app/reportar/error.tsx components/reporte-form.tsx components/ui/radio-group.tsx
git commit -m "feat: migrate /reportar to server shell + client form"
```

---

## Chunk 8: Admin

### Task 31: Refactor admin-sidebar sin emojis

**Files:**
- Create: `components/admin/admin-sidebar.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, GitCompare, ClipboardList, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarProps {
  pendingMuralesCount?: number;
  pendingModificacionesCount?: number;
}

export function AdminSidebar({
  pendingMuralesCount = 0,
  pendingModificacionesCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const navItems = [
    { href: "/admin", label: "Murales", icon: Map, badge: pendingMuralesCount },
    {
      href: "/admin/modificaciones",
      label: "Modificaciones",
      icon: GitCompare,
      badge: pendingModificacionesCount,
    },
    { href: "/admin/auditoria", label: "Auditoría", icon: ClipboardList },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-48 bg-[hsl(222_47%_7%)] text-white border-r border-[hsl(215_25%_20%)]">
      <div className="px-4 py-4 border-b border-[hsl(215_25%_20%)]">
        <div className="font-semibold text-sm">Murales Políticos</div>
        <div className="text-xs text-white/60 mt-0.5">Panel de gestión</div>
      </div>

      <nav className="flex-1 py-2" aria-label="Navegación admin">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors",
                "hover:bg-white/5",
                active && "bg-white/10 text-white border-l-2 border-accent",
                !active && "text-white/80",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </span>
              {item.badge && item.badge > 0 ? (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[hsl(215_25%_20%)] p-2 flex flex-col gap-1">
        <Button asChild variant="ghost" size="sm" className="justify-start text-white/80 hover:text-white hover:bg-white/5">
          <Link href="/">
            <Home className="size-4" aria-hidden="true" />
            Ver mapa público
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="justify-start text-white/80 hover:text-white hover:bg-white/5"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add components/admin/admin-sidebar.tsx
git commit -m "feat: rebuild AdminSidebar with Lucide icons and badges (no emojis)"
```

---

### Task 32: Refactor /admin/login

**Files:**
- Modify: `app/admin/login/page.tsx`
- Create: `components/admin-login-form.tsx`

- [ ] **Step 1: Crear `components/admin-login-form.tsx`**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Values = z.infer<typeof schema>;

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [busy, setBusy] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: Values) => {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        toast.error(error.message ?? "Error al iniciar sesión");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
        {form.formState.errors.email && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={busy} className="w-full">
        <LogIn className="size-4" aria-hidden="true" />
        {busy ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Reemplazar `app/admin/login/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Panel de administración</CardTitle>
          <CardDescription>Ingresá con tu cuenta de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verificar en browser**

```bash
yarn dev
```

Abrir `/admin/login` (sin auth). Debe verse la card centrada con form.

- [ ] **Step 4: Commit**

```bash
git add app/admin/login/page.tsx components/admin-login-form.tsx
git commit -m "feat: redesign admin login with centered card and rhf + zod"
```

---

### Task 33: Crear componentes de tabla admin

**Files:**
- Create: `components/admin/filters-bar.tsx`
- Create: `components/admin/pagination.tsx`
- Create: `components/admin/mural-row-actions.tsx`

- [ ] **Step 1: Crear `components/admin/filters-bar.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/search-bar";

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "modificado_pendiente", label: "Modif. pendientes" },
];

export function AdminFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const estado = searchParams.get("estado") ?? "todos";

  const setEstado = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "todos") params.delete("estado");
      else params.set("estado", next);
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <SearchBar />
      <Select value={estado} onValueChange={setEstado}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          {ESTADOS.map((e) => (
            <SelectItem key={e.value} value={e.value}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Crear `components/admin/pagination.tsx`**

```tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  baseSearchParams: Record<string, string | undefined>;
  basePath: string;
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  baseSearchParams,
  basePath,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        Página {page} de {totalPages} · {total} registros
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <Link href={buildHref(basePath, baseSearchParams, prevPage)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Anterior
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <Link href={buildHref(basePath, baseSearchParams, nextPage)}>
            Siguiente
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `components/admin/mural-row-actions.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  aprobarMuralAction,
  rechazarMuralAction,
} from "@/app/admin/_actions/murales";

interface MuralRowActionsProps {
  muralId: string;
}

export function MuralRowActions({ muralId }: MuralRowActionsProps) {
  const [pending, startTransition] = useTransition();
  const [openReject, setOpenReject] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const res = await aprobarMuralAction(muralId);
      if (res.success) toast.success("Mural aprobado");
      else toast.error(res.error);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rechazarMuralAction(muralId, motivo);
      if (res.success) {
        toast.success("Mural rechazado");
        setOpenReject(false);
        setMotivo("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={pending}
        className="bg-success hover:bg-success/90 text-success-foreground"
      >
        <Check className="size-4" aria-hidden="true" />
        Aprobar
      </Button>

      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            <X className="size-4" aria-hidden="true" />
            Rechazar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar mural</DialogTitle>
            <DialogDescription>
              Indicá un motivo (opcional). Se registrará en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: imagen fuera de foco, información incorrecta..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReject(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={pending}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Verificar tsc**

Run: `yarn tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add components/admin/filters-bar.tsx components/admin/pagination.tsx components/admin/mural-row-actions.tsx
git commit -m "feat: add admin filters, pagination and mural row actions"
```

---

### Task 34: Refactor /admin page a Server Component

**Files:**
- Modify: `app/admin/page.tsx`
- Create: `app/admin/loading.tsx`
- Create: `app/admin/error.tsx`

- [ ] **Step 1: Reemplazar `app/admin/page.tsx` completo**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminFiltersBar } from "@/components/admin/filters-bar";
import { AdminPagination } from "@/components/admin/pagination";
import { MuralRowActions } from "@/components/admin/mural-row-actions";
import { EstadoBadge } from "@/components/estado-badge";
import { EmptyState } from "@/components/empty-state";
import { Map as MapIcon } from "lucide-react";
import {
  getAllMurales,
  countMuralesPendientes,
  countModificacionesPendientes,
} from "@/lib/queries/admin-murales";

export const metadata: Metadata = {
  title: "Panel admin · Murales",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{
    page?: string;
    estado?: string;
    q?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [pagedMurales, pendingMurales, pendingMods] = await Promise.all([
    getAllMurales({
      page,
      estado: (params.estado as "pendiente" | "aprobado" | "rechazado" | "modificado_pendiente" | "todos" | undefined) ?? "pendiente",
      q: params.q,
    }),
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        pendingMuralesCount={pendingMurales}
        pendingModificacionesCount={pendingMods}
      />
      <div className="flex-1 flex flex-col lg:ml-0">
        <SiteHeader />
        <main id="main" className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Murales</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestión de murales registrados.
            </p>
          </div>

          <div className="mb-4">
            <AdminFiltersBar />
          </div>

          {pagedMurales.data.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title="Sin resultados"
              description="No hay murales que coincidan con los filtros."
            />
          ) : (
            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium">Candidato</th>
                    <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedMurales.data.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{m.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.candidato ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={m.url_maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          Ver en Maps
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={m.estado} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(m.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        {m.estado === "pendiente" && <MuralRowActions muralId={m.id} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination
            page={pagedMurales.page}
            totalPages={pagedMurales.totalPages}
            total={pagedMurales.total}
            baseSearchParams={{ estado: params.estado, q: params.q }}
            basePath="/admin"
          />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `app/admin/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex min-h-dvh">
      <Skeleton className="hidden lg:block w-48 h-dvh" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `app/admin/error.tsx`**

```tsx
"use client";
import { ErrorView } from "@/components/error-view";
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView onRetry={reset} />;
}
```

- [ ] **Step 4: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 5: Verificar en browser con admin logueado**

```bash
yarn dev
```

Loguearse en `/admin/login`. Ir a `/admin`:
- Sidebar navy oscuro con Lucide icons (sin emojis)
- Badge rojo en "Murales" si hay pendientes
- Header navy arriba
- Tabla con murales pendientes
- Botones Aprobar (verde) / Rechazar (rojo) por fila
- Clickear Aprobar → toast verde, fila desaparece (revalidate)
- Paginación funcional si hay >20 pendientes

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx app/admin/loading.tsx app/admin/error.tsx
git commit -m "feat: migrate /admin to Server Component with pagination and server actions"
```

---

### Task 35: Refactor /admin/modificaciones

**Files:**
- Modify: `app/admin/modificaciones/page.tsx`
- Create: `components/admin/modificacion-card.tsx`
- Create: `components/admin/modificacion-actions.tsx`

- [ ] **Step 1: Crear `components/admin/modificacion-actions.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  aprobarModificacionAction,
  rechazarModificacionAction,
} from "@/app/admin/_actions/modificaciones";

interface ModificacionActionsProps {
  muralId: string;
  modificacionId: string;
}

export function ModificacionActions({ muralId, modificacionId }: ModificacionActionsProps) {
  const [pending, startTransition] = useTransition();
  const [openReject, setOpenReject] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const res = await aprobarModificacionAction(muralId, modificacionId);
      if (res.success) toast.success("Modificación aprobada");
      else toast.error(res.error);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rechazarModificacionAction(muralId, modificacionId, motivo);
      if (res.success) {
        toast.success("Modificación rechazada");
        setOpenReject(false);
        setMotivo("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={pending}
        className="bg-success hover:bg-success/90 text-success-foreground"
      >
        <Check className="size-4" aria-hidden="true" />
        Aprobar
      </Button>
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            <X className="size-4" aria-hidden="true" />
            Rechazar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar modificación</DialogTitle>
            <DialogDescription>Indicá un motivo (opcional).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReject(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={pending}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Crear `components/admin/modificacion-card.tsx`**

```tsx
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModificacionActions } from "./modificacion-actions";
import type { ModificacionConMural } from "@/lib/queries/modificaciones";

interface ModificacionCardProps {
  modificacion: ModificacionConMural;
}

export function ModificacionCard({ modificacion: m }: ModificacionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{m.mural.nombre}</CardTitle>
            <CardDescription>
              {m.mural.candidato ?? "Sin candidato"} · {formatDate(m.fecha_creacion)}
            </CardDescription>
          </div>
          <ModificacionActions muralId={m.mural_id} modificacionId={m.id} />
        </div>
      </CardHeader>
      <CardContent>
        {m.motivo && (
          <p className="text-sm mb-3">
            <span className="font-medium">Motivo:</span> {m.motivo}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <figure>
            <figcaption className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Actual
            </figcaption>
            {m.mural.imagen_thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.mural.imagen_thumbnail_url}
                alt={`Imagen actual de ${m.mural.nombre}`}
                className="w-full h-40 object-cover rounded-md border"
              />
            ) : (
              <div className="h-40 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Sin imagen
              </div>
            )}
          </figure>
          <figure>
            <figcaption className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Propuesta
            </figcaption>
            {m.imagen_nueva_thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.imagen_nueva_thumbnail_url}
                alt={`Imagen propuesta para ${m.mural.nombre}`}
                className="w-full h-40 object-cover rounded-md border"
              />
            ) : (
              <div className="h-40 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Sin imagen
              </div>
            )}
          </figure>
        </div>
      </CardContent>
    </Card>
  );
}
```

Nota: si el tipo `Mural` no tiene `motivo` en `mural_modificaciones` o nombres distintos, ajustar según `lib/types.ts`.

- [ ] **Step 3: Reemplazar `app/admin/modificaciones/page.tsx`**

```tsx
import type { Metadata } from "next";
import { GitCompare } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ModificacionCard } from "@/components/admin/modificacion-card";
import { AdminPagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/empty-state";
import { getModificacionesPendientes } from "@/lib/queries/modificaciones";
import { countMuralesPendientes, countModificacionesPendientes } from "@/lib/queries/admin-murales";

export const metadata: Metadata = {
  title: "Modificaciones pendientes · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ModificacionesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [paged, pendingMurales, pendingMods] = await Promise.all([
    getModificacionesPendientes(page),
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        pendingMuralesCount={pendingMurales}
        pendingModificacionesCount={pendingMods}
      />
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <main id="main" className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Modificaciones pendientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Aprobá o rechazá las propuestas de cambio en murales existentes.
            </p>
          </div>

          {paged.data.length === 0 ? (
            <EmptyState
              icon={GitCompare}
              title="Sin modificaciones pendientes"
              description="Volvé más tarde para revisar nuevas propuestas."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paged.data.map((m) => (
                <ModificacionCard key={m.id} modificacion={m} />
              ))}
            </div>
          )}

          <AdminPagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            baseSearchParams={{}}
            basePath="/admin/modificaciones"
          />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 5: Verificar en browser**

Ir a `/admin/modificaciones`. Si hay modificaciones pendientes, ver cards con before/after. Si no, empty state.

- [ ] **Step 6: Commit**

```bash
git add app/admin/modificaciones/page.tsx components/admin/modificacion-card.tsx components/admin/modificacion-actions.tsx
git commit -m "feat: migrate /admin/modificaciones to Server Component with cards"
```

---

### Task 36: Refactor /admin/auditoria

**Files:**
- Modify: `app/admin/auditoria/page.tsx`
- Create: `components/admin/auditoria-table.tsx`

- [ ] **Step 1: Crear `components/admin/auditoria-table.tsx`**

```tsx
import { formatDate } from "@/lib/utils";
import type { Auditoria } from "@/lib/types";

const accionLabels: Record<string, string> = {
  aprobar_mural: "Aprobó mural",
  rechazar_mural: "Rechazó mural",
  aprobar_modificacion: "Aprobó modificación",
  rechazar_modificacion: "Rechazó modificación",
  actualizar_estado: "Actualizó estado",
};

interface AuditoriaTableProps {
  registros: Auditoria[];
}

export function AuditoriaTable({ registros }: AuditoriaTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Admin</th>
            <th className="px-4 py-3 text-left font-medium">Acción</th>
            <th className="px-4 py-3 text-left font-medium">Mural</th>
            <th className="px-4 py-3 text-left font-medium">Detalles</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {registros.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                {formatDate(r.fecha_creacion)}
              </td>
              <td className="px-4 py-3">{r.admin_email ?? r.admin_id}</td>
              <td className="px-4 py-3 font-medium">{accionLabels[r.accion] ?? r.accion}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.mural_id ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                {r.detalles ? JSON.stringify(r.detalles) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Ajustar los nombres de campos (`admin_email`, `admin_id`, `detalles`) según `lib/types.ts`.

- [ ] **Step 2: Reemplazar `app/admin/auditoria/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AuditoriaTable } from "@/components/admin/auditoria-table";
import { AdminPagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/empty-state";
import { getAuditoria } from "@/lib/queries/auditoria";
import { countMuralesPendientes, countModificacionesPendientes } from "@/lib/queries/admin-murales";

export const metadata: Metadata = {
  title: "Auditoría · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; accion?: string }>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [paged, pendingMurales, pendingMods] = await Promise.all([
    getAuditoria({ page, accion: params.accion as "aprobar_mural" | "rechazar_mural" | "aprobar_modificacion" | "rechazar_modificacion" | "actualizar_estado" | undefined }),
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        pendingMuralesCount={pendingMurales}
        pendingModificacionesCount={pendingMods}
      />
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <main id="main" className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Auditoría</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registro inmutable de las acciones administrativas.
            </p>
          </div>

          {paged.data.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin registros"
              description="Todavía no hay acciones registradas."
            />
          ) : (
            <AuditoriaTable registros={paged.data} />
          )}

          <AdminPagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            baseSearchParams={{ accion: params.accion }}
            basePath="/admin/auditoria"
          />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 4: Verificar en browser**

Ir a `/admin/auditoria`. Ver tabla con registros. Aprobar un mural en `/admin` y volver acá — debe aparecer el nuevo registro.

- [ ] **Step 5: Commit**

```bash
git add app/admin/auditoria/page.tsx components/admin/auditoria-table.tsx
git commit -m "feat: migrate /admin/auditoria to Server Component with pagination"
```

---

## Chunk 9: SEO

### Task 37: Crear robots.ts y sitemap.ts

**Files:**
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`

- [ ] **Step 1: Crear `app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: "https://murales-politicos.vercel.app/sitemap.xml",
  };
}
```

(Si el dominio final es distinto, actualizar. `metadataBase` en layout ya es el mismo valor).

- [ ] **Step 2: Crear `app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = "https://murales-politicos.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: `${BASE}/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE}/nuevo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 4: Verificar URLs generadas**

```bash
yarn dev
```

Abrir:
- `http://localhost:3000/robots.txt`
- `http://localhost:3000/sitemap.xml`

Ambos deben devolver contenido válido.

- [ ] **Step 5: Commit**

```bash
git add app/robots.ts app/sitemap.ts
git commit -m "feat: add robots.txt and sitemap.xml"
```

---

### Task 38: Crear opengraph-image y icon

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `app/icon.tsx`

- [ ] **Step 1: Crear `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { getMuralesStats } from "@/lib/queries/murales";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Murales Políticos — Registro de propaganda política en Paraguay";

export default async function Image() {
  const stats = await getMuralesStats();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "#0F172A",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.7, display: "flex" }}>
          Murales Políticos · Paraguay
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16, display: "flex" }}>
          {stats.aprobados} murales registrados
        </div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.85, display: "flex" }}>
          Mapa colaborativo de propaganda política
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Crear `app/icon.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          color: "#FFFFFF",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 3: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 4: Verificar en browser**

```bash
yarn dev
```

Abrir `http://localhost:3000/opengraph-image` — debe devolver un PNG 1200×630 con los stats.

- [ ] **Step 5: Commit**

```bash
git add app/opengraph-image.tsx app/icon.tsx
git commit -m "feat: add dynamic OG image and app icon"
```

---

## Chunk 10: Cleanup

### Task 39: Eliminar componentes y hooks obsoletos

**Files:**
- Delete: `components/page-shell.tsx`
- Delete: `components/stats-grid.tsx`
- Delete: `components/status-alert.tsx`
- Delete: `components/map-view.tsx`
- Delete: `components/captcha-field.tsx` (si no se usa)
- Delete: `hooks/use-mural-data.ts` (si no se usa más)

- [ ] **Step 1: Confirmar que no hay referencias a los archivos**

```bash
grep -rn "components/page-shell\|components/stats-grid\|components/status-alert\|components/map-view\|components/captcha-field\|hooks/use-mural-data" app/ components/ hooks/ lib/
```

Expected: 0 resultados (excepto quizás imports dentro de los mismos archivos a eliminar).

Si hay referencias, abrir el archivo que las tiene y migrarlas a las versiones nuevas (`site-header`, `stats-bar`, `sonner`, `mural-map`, etc.) antes de borrar.

- [ ] **Step 2: Eliminar los archivos**

```bash
rm components/page-shell.tsx
rm components/stats-grid.tsx
rm components/status-alert.tsx
rm components/map-view.tsx
rm components/captcha-field.tsx 2>/dev/null || true
rm hooks/use-mural-data.ts 2>/dev/null || true
```

- [ ] **Step 3: Eliminar imports huérfanos**

```bash
grep -rn "captcha-field\|use-captcha\|status-alert\|StatusAlert\|PageShell\|MapView\|stats-grid\|StatsGrid\|useMuralData" app/ components/ hooks/ lib/
```

Para cualquier match, remover el import + el uso en ese archivo.

- [ ] **Step 4: Eliminar `react-modal` del package.json**

```bash
yarn remove react-modal @types/react-modal
```

- [ ] **Step 5: Verificar `yarn build`**

Run: `yarn build`
Expected: build pasa completo.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove legacy components and unused deps"
```

---

### Task 40: Limpieza final del globals.css residual

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Confirmar que globals.css solo tiene los bloques del Task 3**

Abrir `app/globals.css`. Debe contener solo: `@import`, `@theme`, `:root`, `.dark`, selectores globales (`*`, `html`, `body`, `.tabular-nums`, `*:focus-visible`), `@media (prefers-reduced-motion)`, `.leaflet-container`, `.custom-div-icon`, `.skip-link`.

Si hay bloques legacy (paletas `--primary-50` a `--primary-900`, `--gradient-*`, `.card`, `.glass`, modal styles), eliminarlos todos.

- [ ] **Step 2: Verificar `yarn build`**

Run: `yarn build`

- [ ] **Step 3: Commit (si hubo cambios)**

```bash
git add app/globals.css
git commit -m "chore: remove legacy CSS blocks from globals.css"
```

---

## Chunk 11: Verificación final

### Task 41: Verificación end-to-end

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Build limpio**

```bash
yarn build
```

Expected: 0 errores, 0 warnings.

- [ ] **Step 2: No hay emojis como ícono**

```bash
grep -rnE "[🗺🔄📋➕✕→×✓📍🔗⚠️]" app/ components/ lib/
```

Expected: 0 resultados.

- [ ] **Step 3: dev server sin errores de consola**

```bash
yarn dev
```

Abrir las siguientes rutas con DevTools abierto y verificar que no haya errores en la pestaña "Console":
- `/`
- `/nuevo`
- `/reportar?id=<mural-id-real>&name=test`
- `/admin/login`
- `/admin` (logueado)
- `/admin/modificaciones` (logueado)
- `/admin/auditoria` (logueado)

- [ ] **Step 4: Keyboard navigation**

En `/`:
1. Presionar `Tab` desde el inicio de la página — primer foco debe ser el skip link ("Saltar al contenido principal")
2. Enter en el skip link → foco va al `<main>`
3. Continuar tabulando — foco visible (3px ring accent) en todos los elementos interactivos

En `/nuevo`:
1. Tab por cada input — foco visible, orden = visual
2. Intentar enviar form vacío con Enter — errores aparecen debajo de cada campo con `role="alert"`

- [ ] **Step 5: Responsive breakpoints**

En Chrome DevTools responsive mode, verificar en 375px / 768px / 1024px / 1440px:
- `/`: sin scroll horizontal, FAB visible solo <640px
- `/nuevo`: 1 columna en mobile, 2 columnas en ≥1024px
- `/admin`: sidebar oculto en <1024px

- [ ] **Step 6: Prefers-reduced-motion**

En DevTools → Rendering tab → Emulate CSS media feature `prefers-reduced-motion: reduce`. Recargar `/`. Confirmar que animaciones del popup del mapa, transitions de hover en botones, y filter chips ocurren instantáneamente.

- [ ] **Step 7: Lighthouse en `/`**

En DevTools → Lighthouse → Desktop → Analyze. Target:
- Performance ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO = 100

Si Performance < 95, revisar: tamaño de imágenes precargadas, chunks de Leaflet, font-display. Si Accessibility < 95, axe DevTools dará detalle.

- [ ] **Step 8: Contraste de texto**

Instalar extensión "axe DevTools" si no está. Correr axe en `/` y `/admin`. Expected: 0 Critical, 0 Serious.

- [ ] **Step 9: Commit de verificación (si hubo ajustes)**

Si durante la verificación se hicieron correcciones menores:

```bash
git add -A
git commit -m "fix: address verification findings (a11y / perf)"
```

---

## Self-review del plan

**Spec coverage check:**

| Requisito del spec | Task(s) |
|---|---|
| Paleta "Accessible & Ethical" en HSL CSS vars | Task 3 |
| IBM Plex Sans via next/font | Task 4 |
| Skip link | Task 5 |
| shadcn/ui init + componentes base | Tasks 2, 6-9 |
| Focus ring 3-4px | Task 3 (CSS global) |
| Reduced motion respetado | Task 3 (@media) + Task 41 verificación |
| Queries server-side para murales públicos | Task 10 |
| Queries server-side paginadas para admin | Tasks 11-12 |
| Zod schemas | Task 13 |
| Server Actions para admin | Tasks 14-15 |
| Proxy con admin guard | Task 16 |
| ErrorView, EmptyState | Task 17 |
| loading.tsx / error.tsx / not-found.tsx por segmento | Tasks 18, 29, 30, 34 |
| SiteHeader sin emojis | Task 19 |
| StatsBar tabular nums | Task 20 |
| FilterChips en searchParams | Task 21 |
| SearchBar con debounce | Task 22 |
| EstadoBadge sobre shadcn Badge | Task 23 |
| MuralMap refactor | Task 24 |
| Home como Server Component con búsqueda + filtro | Task 25 |
| generateMetadata dinámico | Task 25 |
| compressImage WebP + EXIF | Task 26 |
| ImageUploader rediseñado | Task 27 |
| MuralForm rhf + zod | Task 28 |
| /nuevo server shell | Task 29 |
| /reportar server shell con radio-group | Task 30 |
| AdminSidebar Lucide icons | Task 31 |
| /admin/login rediseño | Task 32 |
| Tabla admin + filtros + paginación + row actions | Tasks 33-34 |
| /admin/modificaciones con cards before/after | Task 35 |
| /admin/auditoria con tabla paginada | Task 36 |
| robots.ts + sitemap.ts | Task 37 |
| opengraph-image + icon dinámicos | Task 38 |
| Eliminar legacy + react-modal | Tasks 39-40 |
| Verificación final | Task 41 |

**Placeholder scan:** plan libre de TBD/TODO. Las frases "si no se usa" en cleanup están acompañadas de un grep concreto para decidir.

**Type consistency:**
- `ActionResult` definido en Task 14 y reusado en Task 15 vía `import type`
- `PagedResult<T>` definido en Task 11 y reusado en Tasks 12, 35, 36
- `MuralesStats` definido en Task 10, consumido en Task 20 y 38
- `EstadoFilter` definido en Task 10, consumido en Task 25
- `ModificacionConMural` definido en Task 12, consumido en Task 35

**Ajustes identificados durante self-review:**
- Task 14 menciona que hay que ajustar nombres de campos de `registrarAuditoria` según `lib/auditoria.ts` — explícitamente señalado como step 2 de esa tarea.
- Task 12 menciona agregar `AccionAuditoria` a `lib/types.ts` si falta — explícito.
- Task 36 asume que `Auditoria` tiene `admin_email`, `admin_id`, `detalles`, `mural_id`, `accion`, `fecha_creacion` — si difiere, ajustar en ese task.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-civic-redesign-ssr.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. Ideal for a plan this size (41 tasks).

**2. Inline Execution** — execute tasks in this session, batch execution with checkpoints.

**Which approach?**
