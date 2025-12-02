# Sistema de Diseño - Murales Decorativos

## Paleta de Colores

### Colores Primarios (Azul Vibrante)
- **Principal**: `#3B82F6` (primary-500)
- **Variantes**: Desde primary-50 (más claro) hasta primary-900 (más oscuro)
- **Uso**: Botones principales, enlaces, elementos destacados

### Colores Secundarios (Naranja/Coral)
- **Principal**: `#F97316` (secondary-500)
- **Variantes**: Desde secondary-50 hasta secondary-900
- **Uso**: Botones de acción secundaria, acentos, llamadas a la acción

### Colores de Acento (Púrpura)
- **Principal**: `#8B5CF6` (accent-500)
- **Variantes**: Desde accent-50 hasta accent-900
- **Uso**: Elementos especiales, estados pendientes, decoración

### Colores de Estado
- **Éxito**: `#10B981` (success-500) - Para elementos aprobados, confirmaciones
- **Advertencia**: `#F59E0B` (warning-500) - Para elementos modificados, alertas
- **Error**: `#EF4444` (error-500) - Para errores, elementos eliminados

## Espaciado

El sistema utiliza un espaciado consistente basado en múltiplos de 4px/8px:
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)
- **4xl**: 6rem (96px)

## Bordes Redondeados

- **sm**: 0.5rem (8px)
- **md**: 0.75rem (12px)
- **lg**: 1rem (16px)
- **xl**: 1.5rem (24px)
- **2xl**: 2rem (32px)
- **full**: 9999px (completamente redondeado)

## Sombras

- **sm**: Sombra pequeña para elementos elevados ligeramente
- **md**: Sombra media para tarjetas y contenedores
- **lg**: Sombra grande para modales y elementos destacados
- **xl**: Sombra extra grande para overlays
- **2xl**: Sombra máxima para elementos flotantes

## Gradientes

### Gradiente Primario
```css
background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
```

### Gradiente Secundario
```css
background: linear-gradient(135deg, #F093FB 0%, #F5576C 100%);
```

### Gradiente de Acento
```css
background: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%);
```

## Efectos Especiales

### Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
```

### Sombras con Glow
- `.shadow-glow`: Sombra azul con efecto de brillo
- `.shadow-glow-secondary`: Sombra naranja con efecto de brillo

## Tipografía

- **Fuente principal**: Inter, sistema de fuentes sans-serif
- **Títulos**: Gradientes de texto (from-blue-600 via-purple-600 to-orange-500)
- **Tamaños**:
  - Títulos principales: text-2xl md:text-3xl lg:text-4xl
  - Subtítulos: text-sm md:text-base
  - Texto normal: text-base

## Sistema de Cards

El diseño utiliza un sistema visual de cards (tarjetas) para crear jerarquía y organización:

### Tipos de Cards

#### `.card` - Card básica
- Fondo blanco (#FFFFFF)
- Borde sutil (#E2E8F0)
- Sombra ligera
- Border radius: 1rem
- Efecto hover con sombra aumentada

#### `.card-elevated` - Card elevada
- Mismo estilo que `.card` pero con sombra más pronunciada
- Usada para elementos principales (header, main content)

#### `.card-header`, `.card-body`, `.card-footer`
- Componentes modulares para estructurar cards complejas
- Cada uno con su propio padding y bordes apropiados

### Uso de Cards

```tsx
// Card básica
<div className="card p-6">
  Contenido de la card
</div>

// Card elevada (para elementos principales)
<div className="card-elevated p-6">
  Contenido principal
</div>

// Card con borde de acento
<div className="card" style={{ borderLeftColor: '#3B82F6', borderLeftWidth: '4px' }}>
  Contenido con acento
</div>
```

## Componentes Base

### PageShell
Componente contenedor principal que incluye:
- Header con título, subtítulo y estadísticas (usando `.card-elevated`)
- Botones de acción en el header
- Contenido principal con sistema de cards (`.card-elevated`)
- Estadísticas como cards individuales con bordes de acento

### Botones
- **Primario**: Gradiente azul con hover y transform scale
- **Secundario**: Gradiente naranja con hover y transform scale
- **Estados**: hover:shadow-lg, transform hover:scale-105

## Animaciones

### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Pulse (para elementos decorativos)
Usado en los círculos de fondo con diferentes delays para crear movimiento suave.

## Guía de Uso

1. **Fondos**: Usar gradientes suaves en los contenedores principales
2. **Tarjetas**: Usar glassmorphism (.glass) con bordes redondeados xl o 2xl
3. **Botones**: Usar gradientes con efectos hover y transform
4. **Espaciado**: Mantener márgenes y paddings consistentes usando las clases de espaciado
5. **Colores**: Priorizar los colores primarios y secundarios, usar acentos para elementos especiales
6. **Estados**: Usar los colores de estado apropiados (success, warning, error)

## Ejemplo de Implementación

```tsx
<div className="glass rounded-3xl shadow-xl p-8">
  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
    Título
  </h1>
  <button 
    className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    style={{
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: 'white',
    }}
  >
    Acción
  </button>
</div>
```

