# Guía de Despliegue a Producción

Esta guía te ayudará a preparar y desplegar tu aplicación Next.js a producción.

## 📋 Checklist Pre-Despliegue

Antes de desplegar, asegúrate de completar estos pasos:

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**Cómo obtener estas credenciales:**
1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a **Settings** → **API**
3. Copia el `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copia la `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Verificar Configuración de Supabase

Asegúrate de que en tu proyecto Supabase:

- ✅ El esquema de base de datos está creado (ejecutar `supabase/schema.sql`)
- ✅ El bucket `murales` existe en Storage
- ✅ Las políticas RLS (Row Level Security) están configuradas correctamente
- ✅ Las políticas de Storage permiten lectura/escritura según corresponda

### 3. Build Local

Ejecuta una build de producción localmente para verificar que no haya errores:

```bash
# Instalar dependencias (si no lo has hecho)
yarn install

# Construir la aplicación
yarn build
```

**¿Qué buscar?**
- ❌ Errores de TypeScript
- ❌ Errores de compilación
- ❌ Warnings críticos

Si hay errores, corrígelos antes de continuar.

### 4. Probar Build Local

Inicia el servidor de producción localmente:

```bash
yarn start
```

Abre [http://localhost:3000](http://localhost:3000) y verifica:
- ✅ La aplicación carga correctamente
- ✅ El mapa se muestra
- ✅ Puedes subir imágenes
- ✅ Las funcionalidades principales trabajan

## 🚀 Despliegue en Vercel (Recomendado)

### Paso 1: Preparar el Código

```bash
# Asegúrate de que todos los cambios están commiteados
git add .
git commit -m "Preparar para producción"
git push origin main
```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub/GitLab/Bitbucket
3. Haz clic en **"Add New Project"** o **"Import Project"**
4. Selecciona tu repositorio `MuralDecorativo`

### Paso 3: Configurar el Proyecto

Vercel debería detectar automáticamente que es un proyecto Next.js. Verifica:

- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Build Command:** `yarn build` (o dejar por defecto)
- **Output Directory:** `.next` (por defecto)
- **Install Command:** `yarn install`

### Paso 4: Agregar Variables de Entorno

En la sección **"Environment Variables"** antes de desplegar:

1. Haz clic en **"Add"** o **"Add Environment Variable"**
2. Agrega cada variable:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://tu-proyecto.supabase.co`
   - Environment: Selecciona `Production`, `Preview`, y `Development`

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `tu-anon-key-aqui`
   - Environment: Selecciona `Production`, `Preview`, y `Development`

3. Haz clic en **"Save"**

### Paso 5: Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que Vercel construya tu aplicación (esto puede tomar 2-5 minutos)
3. Una vez completado, obtendrás una URL como: `tu-proyecto.vercel.app`

### Paso 6: Verificar el Despliegue

1. Visita la URL proporcionada por Vercel
2. Verifica que:
   - ✅ La aplicación carga correctamente
   - ✅ El mapa funciona
   - ✅ Puedes subir imágenes
   - ✅ Las rutas principales funcionan

### Paso 7: Configurar Dominio Personalizado (Opcional)

1. Ve a **Settings** → **Domains**
2. Ingresa tu dominio personalizado (ej: `murales.tudominio.com`)
3. Sigue las instrucciones para configurar los registros DNS:
   - Tipo: `CNAME`
   - Nombre: `@` o el subdominio
   - Valor: `cname.vercel-dns.com`

## 🔧 Despliegue en Otras Plataformas

### Netlify

1. Ve a [netlify.com](https://netlify.com) e inicia sesión
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Conecta tu repositorio
4. Configuración:
   - **Build command:** `yarn build`
   - **Publish directory:** `.next`
5. En **Site settings** → **Environment variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Haz clic en **"Deploy site"**

### Cloudflare Pages

1. Ve a [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecta tu repositorio
3. Configuración:
   - **Framework preset:** Next.js
   - **Build command:** `yarn build`
   - **Build output directory:** `.next`
4. En **Settings** → **Environment variables**, agrega las variables
5. Despliega

### Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio
4. Railway detectará Next.js automáticamente
5. Ve a **Variables** y agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. El despliegue comenzará automáticamente

## 🐛 Solución de Problemas

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solución:**
- Verifica que las variables de entorno estén configuradas en la plataforma de despliegue
- Asegúrate de que los nombres de las variables sean exactos (case-sensitive)
- Reinicia el despliegue después de agregar las variables

### Error: "Failed to fetch" o problemas con CORS

**Solución:**
1. Ve a tu proyecto en Supabase
2. Navega a **Settings** → **API**
3. Verifica que la URL de tu aplicación esté en la lista de URLs permitidas
4. Si usas un dominio personalizado, agrégalo también

### Error al subir imágenes

**Solución:**
1. Verifica que el bucket `murales` existe en Supabase Storage
2. Ve a **Storage** → **Policies** y verifica los permisos:
   - Los usuarios anónimos deben poder **INSERT** (upload)
   - Los usuarios anónimos deben poder **SELECT** (download)
3. Si es necesario, crea políticas RLS para el bucket

### La aplicación funciona en local pero no en producción

**Solución:**
1. Verifica los logs de la plataforma de despliegue
2. Compara las variables de entorno de local vs producción
3. Verifica que todas las dependencias estén en `package.json`
4. Revisa la consola del navegador para errores de JavaScript

### Build falla con errores de TypeScript

**Solución:**
```bash
# Ejecuta localmente para ver errores detallados
yarn build

# Corrige los errores antes de desplegar
```

## 📊 Monitoreo Post-Despliegue

Después de desplegar, es importante monitorear:

1. **Logs de la aplicación:**
   - Vercel: Dashboard → Tu proyecto → Logs
   - Netlify: Site → Functions → Logs

2. **Errores en Supabase:**
   - Ve a tu proyecto Supabase → Logs → API Logs

3. **Rendimiento:**
   - Verifica los tiempos de carga
   - Revisa el uso de recursos en Supabase

## 🔐 Seguridad en Producción

1. **No subas credenciales al repositorio:**
   - El archivo `.env.local` debe estar en `.gitignore`
   - Usa variables de entorno en la plataforma de despliegue

2. **Configura políticas RLS en Supabase:**
   - Limita el acceso a datos sensibles
   - Revisa las políticas de Row Level Security

3. **Revisa permisos de Storage:**
   - Limita quién puede subir archivos
   - Configura límites de tamaño de archivo

4. **Considera agregar autenticación:**
   - El panel admin actualmente no tiene autenticación
   - Implementa Supabase Auth para proteger rutas admin

## 📝 Próximos Pasos

- [ ] Configurar dominio personalizado
- [ ] Implementar autenticación para el panel admin
- [ ] Configurar CI/CD para despliegues automáticos
- [ ] Configurar monitoreo y alertas
- [ ] Optimizar imágenes y rendimiento
- [ ] Configurar backups de la base de datos

## 💡 Tips

- **Usa Preview Deployments:** Vercel y otras plataformas crean deployments de preview para cada PR, úsalos para probar antes de producción
- **Mantén variables sincronizadas:** Si cambias credenciales, actualízalas en todas las plataformas
- **Monitorea el uso:** Revisa el uso de recursos en Supabase para evitar límites
- **Backups:** Configura backups automáticos de tu base de datos en Supabase

