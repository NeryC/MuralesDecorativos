import { CONFIG } from './config.js';

// Default coordinates (Asunción, Paraguay)
const map = L.map('map').setView([-25.2637, -57.5759], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Modal Logic
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const closeBtn = document.getElementById("closeModal");

// Expose openModal to global scope because it's called from HTML string
window.openModal = function(imageSrc) {
  modal.style.display = "flex";
  modalImg.src = imageSrc;
}

closeBtn.onclick = function() {
  modal.style.display = "none";
}

modal.onclick = function(e) {
  if (e.target === modal) {
    modal.style.display = "none";
  }
}

function extractCoords(url) {
  // Try to extract lat,lng from URLs like https://www.google.com/maps?q=-25.282,-57.635
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const q = params.get('q');
    if (q) {
      const parts = q.split(',');
      if (parts.length === 2) {
        return [parseFloat(parts[0]), parseFloat(parts[1])];
      }
    }
  } catch (e) {
    console.error("Error parsing URL:", url, e);
  }
  return null;
}

// Red X Icon for removed/modified
const redXIcon = L.divIcon({
  html: '<div style="font-size: 24px; color: red; font-weight: bold; text-shadow: 1px 1px 2px white;">❌</div>',
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

async function loadPoints() {
  try {
    const response = await fetch(CONFIG.SERVER_URL);
    const data = await response.json();
    
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    data.forEach(point => {
      const coords = extractCoords(point.url);
      if (coords) {
        let popupContent = `<div style="text-align:center;"><b>${point.name}</b>`;
        
        const isModified = point.status === 'modificado_aprobado';
        
        if (isModified) {
            popupContent += `<br><span style="color:red; font-weight:bold;">⚠️ REPORTE DE CAMBIO</span>`;
            popupContent += `<div style="display:flex; gap:5px; margin-top:5px;">`;
            
            // Before
            popupContent += `<div style="flex:1;"><u>Antes:</u><br>`;
            if (point.image) {
                popupContent += `<img src="${point.image}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="openModal('${point.image}')">`;
            }
            popupContent += `<br><small>${point.comment || ''}</small></div>`;

            // After
            popupContent += `<div style="flex:1;"><u>Ahora:</u><br>`;
             if (point.new_image) {
                popupContent += `<img src="${point.new_image}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="openModal('${point.new_image}')">`;
            }
            popupContent += `<br><small>${point.new_comment || ''}</small></div>`;
            
            popupContent += `</div>`;

        } else {
            // Normal
            popupContent += `<br>${point.comment || ''}`;
            if (point.image) {
              popupContent += `<br><img src="${point.image}" style="width:100%; max-width:200px; height:auto; margin-top:5px; border-radius:4px; cursor:pointer;" onclick="openModal('${point.image}')">`;
            }
        }

        popupContent += `<br><a href="${point.url}" target="_blank" style="display:inline-block; margin-top:5px;">Ver en Google Maps</a>`;
        
        // Button to report removed (only if not already modified)
        if (!isModified) {
            popupContent += `<br><br><a href="reportar_eliminado.html?id=${point.id}&name=${encodeURIComponent(point.name)}" style="color: #d32f2f; font-size: 0.9em;">🚩 Reportar Eliminado/Modificado</a>`;
        }
        
        popupContent += `</div>`;

        const markerOptions = isModified ? { icon: redXIcon } : {};
        L.marker(coords, markerOptions).addTo(map)
          .bindPopup(popupContent);
      }
    });
  } catch (error) {
    console.error("Error loading points:", error);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.textContent = "Error al cargar los datos.";
  }
}

loadPoints();
