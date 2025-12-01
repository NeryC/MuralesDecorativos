# Murales Decorativos - Next.js 15

Aplicación web para reportar y visualizar murales decorativos en un mapa colaborativo.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **Base de Datos:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Mapas:** Leaflet.js
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript

## 📋 Requisitos Previos

- Node.js 18+ o superior
- Yarn
- Cuenta en Supabase (gratis)

## 🛠️ Configuración Inicial

### 1. Clonar el repositorio

```bash
cd murales-next
```

### 2. Instalar dependencias

```bash
yarn install
```

### 3. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta el script `supabase/schema.sql`
4. Ve a **Storage** y verifica que el bucket `murales` se haya creado
5. Copia las credenciales de tu proyecto:
   - Ve a **Settings** → **API**
   - Copia `Project URL` y `anon public key`

### 4. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 5. Ejecutar en desarrollo

```bash
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
murales-next/
├── app/
│   ├── api/              # API Routes
│   │   ├── murales/      # CRUD de murales
│   │   ├── admin/        # Endpoints admin
│   │   └── upload/       # Upload de imágenes
│   ├── admin/            # Panel de administración
│   ├── mapa/             # Mapa público
│   ├── reportar/         # Reportar murales eliminados
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Página de inicio (formulario)
│   └── globals.css       # Estilos globales
├── components/
│   ├── ui/               # Componentes UI básicos
│   ├── map-picker.tsx    # Selector de ubicación
│   ├── map-view.tsx      # Visualizador de mapa
│   ├── image-uploader.tsx # Subidor de imágenes
│   └── image-modal.tsx   # Modal de imágenes
├── lib/
│   ├── supabase/         # Clientes de Supabase
│   ├── types.ts          # TypeScript types
│   ├── constants.ts      # Constantes
│   └── utils.ts          # Utilidades
└── supabase/
    └── schema.sql        # Esquema de base de datos
```

## 🎯 Funcionalidades

### Público

- ✅ **Reportar murales:** Formulario con mapa interactivo, foto obligatoria y captcha
- ✅ **Ver mapa:** Visualización de murales aprobados
- ✅ **Reportar eliminados:** Reportar murales que fueron eliminados o modificados

### Administración (sin autenticación)

- ✅ **Panel admin:** Ver todos los murales
- ✅ **Aprobar/Rechazar:** Gestionar murales pendientes
- ✅ **Gestionar modificaciones:** Aprobar reportes de eliminación

## 🗺️ Rutas

- `/` - Mapa público con murales aprobados
- `/nuevo` - Formulario para reportar nuevos murales
- `/reportar?id=xxx&name=xxx` - Reportar mural eliminado/modificado
- `/admin` - Panel de administración (⚠️ sin autenticación)

## 🔐 Seguridad

> **⚠️ IMPORTANTE:** El panel de administración (`/admin`) NO tiene autenticación en esta versión. Cualquiera con la URL puede aprobar/rechazar murales. La autenticación se agregará en una fase posterior.

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Agrega las variables de entorno en Vercel
4. Despliega

### Otras opciones

- Netlify
- Cloudflare Pages
- Railway

## 📝 Próximos Pasos

- [ ] Implementar autenticación (Supabase Auth)
- [ ] Agregar roles (super admin, admin)
- [ ] Implementar búsqueda y filtros
- [ ] Agregar estadísticas
- [ ] Optimizar SEO
- [ ] Agregar tests

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

MIT
