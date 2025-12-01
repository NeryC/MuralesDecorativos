import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/upload
 * Sube una imagen a Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'original' | 'thumbnail'

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const supabase = await createClient();

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = type === 'thumbnail' ? `thumbnails/${fileName}` : `originals/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('murales')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('murales')
      .getPublicUrl(data.path);

    return NextResponse.json({ success: true, url: publicUrl, path: data.path });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
