import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AuthUser } from './types';

/**
 * Verifica si el usuario está autenticado y devuelve el usuario
 * @returns Usuario autenticado o null
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.user_metadata?.full_name || undefined,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Middleware para proteger rutas de API que requieren autenticación
 * @returns Usuario autenticado o respuesta de error
 */
export async function requireAuth(): Promise<
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

