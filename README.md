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

## 🚀 Despliegue en Producción

### Preparación Local para Producción

Antes de desplegar, asegúrate de:

1. **Verificar las variables de entorno**
   
   Crea un archivo `.env.local` con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

2. **Construir la aplicación localmente**
   ```bash
   yarn build
   ```
   
   Esto generará la carpeta `.next` con la versión optimizada de producción.

3. **Probar la build de producción localmente**
   ```bash
   yarn start
   ```
   
   Esto iniciará el servidor de producción en `http://localhost:3000`. Verifica que todo funcione correctamente.

4. **Verificar errores de build**
   
   Si hay errores durante el build, revísalos y corrígelos antes de desplegar.

### Vercel (Recomendado para Next.js)

1. **Preparar el repositorio**
   - Sube tu código a GitHub, GitLab o Bitbucket
   - Asegúrate de que el archivo `.env.local` esté en `.gitignore` (no subas credenciales)

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
   - Haz clic en "Add New Project"
   - Importa tu repositorio

3. **Configurar el proyecto**
   - Framework Preset: Next.js (detectado automáticamente)
   - Root Directory: `./` (o la carpeta raíz de tu proyecto)
   - Build Command: `yarn build` (o `npm run build`)
   - Output Directory: `.next` (default para Next.js)

4. **Agregar variables de entorno**
   
   En la sección "Environment Variables" de Vercel, agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-anon-key
   ```
   
   ⚠️ **Importante:** Las variables que empiezan con `NEXT_PUBLIC_` son accesibles desde el cliente.

5. **Desplegar**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente
   - Obtendrás una URL como `tu-proyecto.vercel.app`

6. **Configurar dominio personalizado (opcional)**
   - Ve a Settings → Domains
   - Agrega tu dominio personalizado
   - Configura los registros DNS según las instrucciones

### Otras plataformas de despliegue

#### Netlify

1. Conecta tu repositorio en [Netlify](https://netlify.com)
2. Configuración de build:
   - Build command: `yarn build`
   - Publish directory: `.next`
3. Agrega las variables de entorno en Site settings → Environment variables
4. Despliega

#### Cloudflare Pages

1. Conecta tu repositorio en [Cloudflare Pages](https://pages.cloudflare.com)
2. Configuración:
   - Framework preset: Next.js
   - Build command: `yarn build`
   - Build output directory: `.next`
3. Agrega variables de entorno en Settings → Environment variables
4. Despliega

#### Railway

1. Conecta tu repositorio en [Railway](https://railway.app)
2. Railway detectará automáticamente Next.js
3. Agrega variables de entorno en Variables
4. Despliega

#### VPS/Server propio

1. **Instalar Node.js y yarn** en tu servidor
2. **Clonar el repositorio**
   ```bash
   git clone tu-repositorio
   cd MuralDecorativo
   ```
3. **Instalar dependencias**
   ```bash
   yarn install
   ```
4. **Crear archivo de entorno**
   ```bash
   nano .env.local
   ```
   Agrega las variables de entorno necesarias.
5. **Construir la aplicación**
   ```bash
   yarn build
   ```
6. **Iniciar con PM2 (recomendado)**
   ```bash
   npm install -g pm2
   pm2 start yarn --name "murales" -- start
   pm2 save
   pm2 startup
   ```
7. **Configurar Nginx como reverse proxy** (opcional pero recomendado)
   ```nginx
   server {
     listen 80;
     server_name tu-dominio.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

### Checklist Pre-Producción

- [ ] Variables de entorno configuradas correctamente
- [ ] Build de producción ejecuta sin errores (`yarn build`)
- [ ] La aplicación funciona localmente con `yarn start`
- [ ] Verificar que todas las funcionalidades trabajen en producción
- [ ] Revisar configuración de CORS en Supabase si es necesario
- [ ] Verificar permisos del bucket de Storage en Supabase
- [ ] Configurar políticas RLS (Row Level Security) en Supabase si aplica
- [ ] Revisar logs de errores después del despliegue

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
