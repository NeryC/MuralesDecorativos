/**
 * Tipos mejorados para mayor type safety
 * Extiende y mejora los tipos existentes en types.ts
 */

import type { MuralEstado, Mural, MuralModificacion } from './types';

// Tipos más específicos en lugar de string | null
export type NonEmptyString = string & { readonly __brand: 'NonEmptyString' };
export type UrlString = string & { readonly __brand: 'UrlString' };
export type EmailString = string & { readonly __brand: 'EmailString' };

// Discriminated union para estados de operación
export type OperationStatus = 
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; message?: string }
  | { type: 'error'; message: string };

// Tipos para acciones de admin
export type AdminAction = 
  | { type: 'approve'; entityId: string }
  | { type: 'reject'; entityId: string; reason?: string }
  | { type: 'update_status'; entityId: string; newStatus: MuralEstado };

// Tipo más específico para filtros
export type MuralFilter = 
  | 'all' 
  | 'pendiente' 
  | 'modificado_pendiente';

// Tipo para estadísticas
export interface StatItem {
  label: string;
  value: number | string;
  color?: string;
}

// Tipo para resultados de operaciones
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Helper para crear tipos más seguros
export function createNonEmptyString(value: string): NonEmptyString | null {
  return value.trim().length > 0 ? (value.trim() as NonEmptyString) : null;
}

export function createUrlString(value: string): UrlString | null {
  try {
    new URL(value);
    return value as UrlString;
  } catch {
    return null;
  }
}

// Tipo para props de componentes que reciben callbacks
export interface WithCallbacks<T = void> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

// Tipo para componentes que pueden estar en estado de carga
export interface WithLoading {
  isLoading?: boolean;
  loadingText?: string;
}

// Tipo para componentes con estado de error
export interface WithError {
  error?: string | null;
  onErrorClear?: () => void;
}

