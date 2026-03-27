import { NextResponse } from 'next/server'

/**
 * Helper para respuestas de error estandarizadas en API routes.
 * Siempre retorna { error: string } con el status HTTP correcto.
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Helper para respuestas exitosas estandarizadas en API routes.
 * Retorna los datos directamente (sin wrapper).
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}
