import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/murales
 * Obtiene TODOS los murales para el panel de administración,
 * incluyendo sus solicitudes de modificación (mural_modificaciones).
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('murales')
      .select('*, mural_modificaciones(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all murales:', error);
      // Devolver array vacío en lugar de objeto de error para mantener consistencia
      return NextResponse.json([]);
    }

    // Asegurar que siempre devolvemos un array
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Unexpected error:', error);
    // Devolver array vacío en caso de error inesperado
    return NextResponse.json([]);
  }
}
