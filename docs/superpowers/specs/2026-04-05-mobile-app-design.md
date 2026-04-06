# Diseño: App Móvil Android + Web Mobile-First

**Fecha:** 2026-04-05  
**Proyecto:** MuralDecorativo  
**Stack web actual:** Next.js 15 + React 19 + TypeScript + Supabase + Tailwind CSS v4 + Leaflet.js

---

## Resumen

Dos tracks paralelos:

1. **App Android (Expo)** — APK distribuido directamente (sin Google Play), con acceso nativo a cámara, GPS y mapa. Cubre usuarios Android.
2. **Web mobile-first (Next.js)** — Mejoras de responsividad en las páginas existentes. Cubre usuarios iPhone y cualquier navegador móvil.

No se paga ninguna tienda en la fase inicial. Cuando el proyecto valide su uso real, se puede publicar en Google Play ($25 único) y App Store ($99/año).

---

## Track 1: App Android (Expo)

### Stack

| Paquete | Propósito |
|---|---|
| `expo` + `expo-router` | Base + navegación file-based (igual a App Router de Next.js) |
| `react-native-maps` | Mapa nativo (Google Maps en Android) |
| `expo-location` | GPS para autocompletar coordenadas en el formulario |
| `expo-camera` + `expo-image-picker` | Tomar foto o seleccionar desde galería |
| `expo-image-manipulator` | Compresión de imágenes (reemplaza `compressImage()` del web) |
| `expo-updates` | OTA updates para cambios JS sin nuevo APK |
| `expo-network` | Detectar estado de conectividad |
| `nativewind` v3 + `tailwindcss` v3 | Estilos con sintaxis Tailwind (v3 para compatibilidad con NativeWind) |
| `@supabase/supabase-js` | Cliente Supabase (mismo SDK que el web) |
| `@react-native-async-storage/async-storage` | Persistencia de sesión Supabase y caché de murales |

> **Nota Tailwind:** El proyecto web usa Tailwind v4 y la app móvil usa Tailwind v3. Los archivos en `/shared/` contienen solo TypeScript puro (tipos, constantes, mensajes) — sin clases CSS. Esta divergencia de versiones no afecta el código compartido.

### Dependencias externas requeridas

**Google Maps API Key (bloqueante para Fase 3):**  
`react-native-maps` en Android requiere una API key de Google Maps Platform. Se obtiene desde Google Cloud Console (tiene capa gratuita generosa). Debe configurarse en `app.json` antes del primer build:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

**Cuenta Expo (EAS):**  
El plan free permite 30 builds/mes — suficiente para desarrollo y distribución inicial.

### Estructura del repositorio

El proyecto web existente no se mueve. Se agregan dos carpetas nuevas:

```
/                          ← Next.js (sin cambios estructurales)
  lib/                     ← Actualizar imports a ../../shared donde corresponda
  app/
  components/
  ...

/shared/                   ← TypeScript puro compartido (sin CSS)
  types.ts                 ← Movido desde lib/types.ts
  constants.ts             ← Movido desde lib/constants.ts
  messages.ts              ← Movido desde lib/messages.ts

/mobile/                   ← Expo app
  app/
    (tabs)/
      index.tsx            ← MapScreen
      nuevo.tsx            ← NuevoMuralScreen
    mural/
      [id].tsx             ← MuralDetailScreen (público)
    reportar.tsx           ← ReportarScreen
    admin/
      index.tsx            ← LoginScreen / redirect a dashboard
      dashboard.tsx        ← DashboardScreen
      mural/[id].tsx       ← MuralDetailAdminScreen
      modificaciones.tsx   ← ModificacionesScreen
      auditoria.tsx        ← AuditoriaScreen
    _layout.tsx            ← Root layout con tab navigator
  components/
    MuralDetailSheet.tsx   ← Bottom sheet de detalle (usado por MapScreen)
  hooks/                   ← Hooks adaptados para RN
  lib/
    supabase.ts            ← Cliente con AsyncStorage
  tailwind.config.js       ← Tailwind v3 (solo para /mobile)
  app.json                 ← Config Expo
  package.json             ← Dependencias independientes
```

### Pantallas y navegación

```
Tab 1: Mapa
  └─ MapScreen — react-native-maps con pins de murales aprobados
       └─ tap en pin → MuralDetailSheet (componente bottom sheet en /components/)

Tab 2: Nuevo mural
  └─ NuevoMuralScreen — cámara + GPS + formulario

Tab 3: Admin (requiere auth)
  └─ LoginScreen (si no autenticado)
  └─ DashboardScreen — lista de murales con filtros
       ├─ MuralDetailAdminScreen — aprobar / rechazar
       ├─ ModificacionesScreen — gestionar solicitudes
       └─ AuditoriaScreen — log de acciones
```

> **Nota:** "Reportar modificación" (`ReportarScreen`) es una pantalla separada accesible desde `MuralDetailSheet`, no un tab. El Tab 2 es exclusivamente para registrar murales nuevos.

La navegación usa Expo Router (file-based), equivalente al App Router de Next.js.

### Flujo de nuevo mural

```
1. Usuario abre cámara (expo-camera) o galería (expo-image-picker)
   → si imagen > 10MB antes de comprimir: mostrar error "Imagen demasiado grande"
2. Foto tomada → comprimir con expo-image-manipulator
   (mismo config que IMAGE_COMPRESSION en /shared/constants.ts)
3. GPS automático con expo-location → coordenadas precargadas en form
   → si permiso denegado: mapa manual para elegir pin
   → si GPS desactivado (permiso aceptado pero servicio off): solicitar activar GPS con deep link a settings
   → si GPS impreciso: indicador de precisión + opción de ajuste manual
4. Usuario completa nombre / candidato / comentario
5. Upload a Supabase Storage (bucket: murales)
   → si falla el upload: mostrar error, NO continuar al paso 6 (evitar imagen huérfana)
6. POST /api/murales (mismo endpoint que usa la web)
   → si falla el POST: eliminar imagen subida en paso 5 (rollback), mostrar error reintentable
7. Confirmación con feedback visual
```

### Supabase en móvil

```typescript
// mobile/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)
```

Las variables de entorno usan el prefijo `EXPO_PUBLIC_` en lugar de `NEXT_PUBLIC_`.

### Reutilización de hooks

| Hook web | En móvil | Estrategia |
|---|---|---|
| `use-mural-data` | Reutilizable | Misma lógica, mismo Supabase SDK |
| `use-mural-filters` | Reutilizable | Solo estado, sin DOM |
| `use-form-submit` | Reutilizable | Lógica pura |
| `use-image-upload` | Adaptado | Reemplaza compressImage() con expo-image-manipulator |

> Los hooks reutilizables deben verificarse antes de copiar para confirmar que no tienen dependencias de APIs web (`window`, `document`, `Canvas`, `Blob`). Si las tienen, se adaptan igual que `use-image-upload`.

### Caché offline

- Al abrir la app con conexión: se cargan murales aprobados y se guardan en AsyncStorage (TTL: 1 hora)
- Sin conexión: se muestran los murales cacheados con banner "Sin conexión — mostrando datos guardados"
- Pull-to-refresh fuerza recarga si hay conexión
- Solo se cachean metadatos y URLs de imágenes (no las imágenes en sí) para respetar el límite de ~6MB de AsyncStorage

### Sesión admin expirada

Si la sesión expira mientras el admin usa la app (ej. vuelve al primer plano tras horas en background sin conexión): `autoRefreshToken: true` reintenta el refresh automáticamente. Si falla (sin conexión), la app muestra un error y redirige a LoginScreen en el próximo intento de acción autenticada.

### Manejo de errores

**Conectividad:**
- Sin conexión al abrir → banner + datos cacheados visibles
- Formulario de nuevo mural bloquea envío sin conexión

**Permisos nativos:**

| Caso | Comportamiento |
|---|---|
| Permiso de cámara denegado | Mostrar opción de seleccionar desde galería |
| Permiso de ubicación denegado | Mapa manual para elegir pin |
| GPS desactivado (permiso ok pero servicio off) | Solicitar activar GPS con deep link a configuración del dispositivo |
| GPS impreciso | Indicador de precisión + opción de ajuste manual |

**Mensajes de error:** Se reutilizan desde `/shared/messages.ts` — sin duplicación de texto.

### Actualizaciones de la app

- **Cambios JS** (pantallas, lógica, estilos): se entregan via OTA con `expo-updates` sin nuevo APK
- **Cambios nativos** (nuevas dependencias nativas, config de app.json): requieren nuevo APK distribuido por el mismo link/QR
- Los usuarios con APK antiguo recibirán la actualización JS automáticamente al abrir la app

---

## Track 2: Web mobile-first

Las páginas existentes necesitan revisión de layout para pantallas pequeñas. No se cambia la lógica, solo el CSS/layout.

### Páginas a revisar

| Ruta | Mejora necesaria |
|---|---|
| `/` | Mapa a pantalla completa, bottom sheet para lista de murales |
| `/nuevo` | Formulario optimizado para pulgar (botones grandes, inputs espaciados) |
| `/reportar` | Igual que `/nuevo` |
| `/admin` | Tabla colapsada en cards apiladas en móvil |
| `/admin/auditoria` | Vista de lista compacta en móvil |
| `/admin/modificaciones` | Cards en lugar de tabla en móvil |

---

## Fases de implementación

### Fase 1 — Preparación del monorepo
1. Crear `/shared/` y mover `types.ts`, `constants.ts`, `messages.ts`
2. Actualizar imports en el proyecto web (cambio transversal — verificar con build completo post-migración)
3. Inicializar proyecto Expo en `/mobile/`

**Criterio de aceptación:** `yarn build` del proyecto web pasa sin errores.

### Fase 2 — Web mobile-first
1. Revisar y mejorar layout de `/nuevo` y `/reportar`
2. Mejorar mapa principal en móvil
3. Mejorar vistas admin en móvil

**Criterio de aceptación:** Las 6 páginas se ven y usan correctamente en viewport de 390px (iPhone 14) sin scroll horizontal ni elementos cortados.

### Fase 3 — App Android core (público)
> **Prerrequisito:** Obtener Google Maps API Key antes de comenzar.

1. MapScreen con react-native-maps
2. MuralDetailSheet (bottom sheet)
3. NuevoMuralScreen (cámara + GPS + form + upload)
4. ReportarScreen

**Criterio de aceptación:** Se puede ver el mapa con murales, agregar un mural nuevo desde la app y verlo aparecer en la web.

### Fase 4 — App Android admin
1. LoginScreen + auth con Supabase
2. DashboardScreen con filtros
3. MuralDetailAdminScreen (aprobar/rechazar)
4. ModificacionesScreen
5. AuditoriaScreen

**Criterio de aceptación:** Un admin puede aprobar/rechazar murales y ver el log de auditoría desde la app.

### Fase 5 — Distribución
1. Build APK con EAS (plan free)
2. Distribución por link / QR con instrucciones para habilitar "fuentes desconocidas" (Android 12 y anteriores requieren habilitarlo manualmente; Android 13+ es por-app)
3. (Futuro) Publicar en Google Play ($25) y App Store ($99/año)

---

## Decisiones fuera de scope

- **No se usa Flutter** — el proyecto ya está en TypeScript, React Native permite reutilizar tipos, lógica y hooks.
- **No se paga ninguna tienda** en la fase inicial — APK directo para Android, web mobile-first para iPhone.
- **No se implementa soporte offline completo** — solo caché de lectura con TTL de 1 hora. El envío requiere conexión.
- **No se usa Turborepo ni herramientas de monorepo complejas** — estructura de carpetas simple es suficiente.
- **No se versiona el API** en esta fase — la app y la web comparten el mismo deploy, minimizando el riesgo de incompatibilidad. Si en el futuro se separan los ciclos de deploy, se agrega versionado de API.
