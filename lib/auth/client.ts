'use client';

import { createClient } from '@/lib/supabase/client';
import type { AuthUser } from './types';

/**
 * Obtiene información del usuario desde el cliente (browser)
 */
export async function getClientUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClient();
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
    console.error('Error getting client user:', error);
    return null;
  }
}

