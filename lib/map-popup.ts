import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types'
import { escapeHtml } from '@/lib/formatting'

/**
 * Construye el HTML del popup de Leaflet para un mural.
 * Usa escapeHtml() en todos los valores interpolados para prevenir XSS.
 *
 * @param mural - El mural con sus modificaciones
 * @param modAprobada - La última modificación aprobada (si existe), para mostrar before/after
 */

const SVG_MAP = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`

const SVG_FLAG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`

const SVG_REFRESH = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px;"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`

export function buildPopupHTML(
  mural: MuralWithModificaciones,
  modAprobada?: MuralModificacion
): string {
  const nombre = escapeHtml(mural.nombre)
  const comentario = escapeHtml(mural.comentario || '')
  const urlMaps = escapeHtml(mural.url_maps)
  const muralId = escapeHtml(mural.id)
  const muralNombreEncoded = encodeURIComponent(mural.nombre)

  const fontStack = `var(--font-plex), system-ui, sans-serif`

  if (modAprobada) {
    // Popup before/after para murales con modificación aprobada
    const imgOriginal = escapeHtml(
      modAprobada.imagen_original_thumbnail_url ||
      modAprobada.imagen_original_url ||
      mural.imagen_thumbnail_url ||
      mural.imagen_url || ''
    )
    const imgOriginalFull = escapeHtml(
      modAprobada.imagen_original_url || mural.imagen_url || ''
    )
    const imgNueva = escapeHtml(
      modAprobada.nueva_imagen_thumbnail_url ||
      modAprobada.nueva_imagen_url || ''
    )
    const imgNuevaFull = escapeHtml(modAprobada.nueva_imagen_url || '')
    const comentarioNuevo = escapeHtml(modAprobada.nuevo_comentario || comentario)

    return `
      <div style="min-width:220px;font-family:${fontStack};">
        <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:4px;">${nombre}</div>
        <div style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;margin-bottom:8px;">
          ${SVG_REFRESH} Modificado
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Antes</div>
            ${imgOriginal ? `<img src="${imgOriginal}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e2e8f0;" onclick="window.openImageModal('${imgOriginalFull}')">` : '<div style="width:100%;height:70px;background:#f1f5f9;border-radius:6px;"></div>'}
            ${comentario ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">${comentario}</div>` : ''}
          </div>
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:#64748b;margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ahora</div>
            ${imgNueva ? `<img src="${imgNueva}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e2e8f0;" onclick="window.openImageModal('${imgNuevaFull}')">` : '<div style="width:100%;height:70px;background:#f1f5f9;border-radius:6px;"></div>'}
            ${comentarioNuevo ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">${comentarioNuevo}</div>` : ''}
          </div>
        </div>
        <a href="${urlMaps}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:4px;background:#eff6ff;color:#1e40af;font-size:11px;font-weight:600;padding:5px 10px;border-radius:6px;text-decoration:none;margin-bottom:0;">
          ${SVG_MAP} Ver en Google Maps
        </a>
      </div>
    `
  }

  // Popup estándar
  const candidato = mural.candidato ? escapeHtml(mural.candidato) : null
  const imgThumb = escapeHtml(mural.imagen_thumbnail_url || mural.imagen_url || '')
  const imgFull = escapeHtml(mural.imagen_url || '')

  return `
    <div style="min-width:180px;font-family:${fontStack};">
      ${imgThumb ? `<img src="${imgThumb}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #e2e8f0;margin-bottom:8px;" onclick="window.openImageModal('${imgFull}')">` : ''}
      <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:2px;">${nombre}</div>
      ${candidato ? `<div style="font-size:11px;color:#64748b;margin-bottom:2px;">${candidato}</div>` : ''}
      ${comentario ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${comentario}</div>` : '<div style="margin-bottom:6px;"></div>'}
      <div style="display:flex;gap:6px;">
        <a href="${urlMaps}" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;background:#eff6ff;color:#1e40af;font-size:11px;font-weight:600;padding:5px 8px;border-radius:6px;text-decoration:none;">
          ${SVG_MAP} Mapa
        </a>
        <a href="/reportar?id=${muralId}&name=${muralNombreEncoded}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:600;padding:5px 8px;border-radius:6px;text-decoration:none;">
          ${SVG_FLAG} Reportar
        </a>
      </div>
    </div>
  `
}
