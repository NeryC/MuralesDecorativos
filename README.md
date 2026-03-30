# Murales Políticos

Mapa colaborativo para registrar y documentar murales de propaganda política en Paraguay. Los usuarios pueden reportar nuevos murales y cambios, y un panel de administración permite aprobar o rechazar los reportes.

**Live:** [murales-politicos.vercel.app](https://murales-politicos.vercel.app)

## Stack

- **Framework:** Next.js 16 (App Router)
- **Base de datos:** Supabase (PostgreSQL + Storage + Auth)
- **Mapas:** Leaflet.js
- **Estilos:** Tailwind CSS v4
- **Lenguaje:** TypeScript
- **Deploy:** Vercel (Analytics + Speed Insights)

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Mapa público con murales aprobados |
| `/nuevo` | Formulario para reportar un nuevo mural |
| `/reportar?id=&name=` | Reportar eliminación o modificación de un mural |
| `/admin` | Panel de administración (requiere login) |
| `/admin/login` | Login de administradores |
| `/admin/modificaciones` | Gestionar solicitudes de modificación |
| `/admin/auditoria` | Log de acciones administrativas |

## Setup local

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar en desarrollo

```bash
yarn dev
```

## Base de datos

El esquema está en `supabase/migrations/`. Tres tablas principales:

- **`murales`** — Registros de murales con estado (`pendiente | aprobado | rechazado | modificado_pendiente | modificado_aprobado`)
- **`mural_modificaciones`** — Solicitudes de modificación/eliminación vinculadas a murales
- **`auditoria`** — Log inmutable de acciones administrativas

RLS habilitado. Los usuarios públicos pueden leer murales aprobados e insertar nuevos. Solo usuarios autenticados acceden a auditoría y panel admin.

## Administración

Los usuarios admin se crean manualmente en el dashboard de Supabase (no hay registro público). El middleware refresca sesiones en cada request.

## Deploy

El proyecto está configurado para deploy automático en Vercel. Cada push a `main` dispara un nuevo deploy.

Variables de entorno requeridas en Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
