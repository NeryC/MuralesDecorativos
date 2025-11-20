const form = document.getElementById('locationForm');
const status = document.getElementById('status');
const captchaText = document.getElementById('captchaText');
const captchaInput = document.getElementById('captchaInput');
const placeUrl = document.getElementById('placeUrl');
const photoInput = document.getElementById('photoInput');
const canvas = document.getElementById('canvas');

// Inicializar mapa
// Coordenadas por defecto (Asunción, Paraguay)
const map = L.map('map').setView([-25.2637, -57.5759], 13); 

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let marker;

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (marker) {
        marker.setLatLng(e.latlng);
    } else {
        marker = L.marker(e.latlng).addTo(map);
    }

    // Generar link de Google Maps
    placeUrl.value = `https://www.google.com/maps?q=${lat},${lng}`;
});

// Intentar obtener ubicación del usuario
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 15);
    });
}

let captchaA = Math.floor(Math.random() * 9) + 1;
let captchaB = Math.floor(Math.random() * 9) + 1;
captchaText.textContent = `¿Cuánto es ${captchaA} + ${captchaB}?`;

const serverUrl = "https://script.google.com/macros/s/AKfycbxE3_pgY8eIAwQgzFFvtyV4nZo5GTQWkgBqr8TAWvxVGjoJzs4u3nD8trO5NH1qPki74A/exec";

function validarURL(url) {
  return url.includes("google.com/maps") || url.includes("maps.app.goo.gl");
}

// Función para comprimir imagen
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compresión JPEG 70%
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = "";

  if (!validarURL(placeUrl.value)) {
    status.textContent = "Por favor selecciona un punto en el mapa.";
    status.className = "error";
    return;
  }

  if (parseInt(captchaInput.value) !== captchaA + captchaB) {
    status.textContent = "Respuesta incorrecta en la verificación.";
    status.className = "error";
    return;
  }

  if (photoInput.files.length === 0) {
    status.textContent = "Debes subir una foto del mural.";
    status.className = "error";
    return;
  }

  status.textContent = "Procesando imagen...";
  
  let imageBase64 = "";
  try {
    imageBase64 = await compressImage(photoInput.files[0]);
  } catch (err) {
      console.error(err);
      status.textContent = "Error al procesar la imagen.";
      status.className = "error";
      return;
  }

  const data = {
    name: document.getElementById('placeName').value,
    url: placeUrl.value,
    comment: document.getElementById('comment').value,
    image: imageBase64
  };

  try {
    status.textContent = "Enviando... (esto puede tardar unos segundos)";
    const response = await fetch(serverUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      status.textContent = "¡Enviado! Tu mural está pendiente de aprobación.";
      status.className = "success";
      form.reset();
      placeUrl.value = ""; 
      if (marker) map.removeLayer(marker);
      
      captchaA = Math.floor(Math.random() * 9) + 1;
      captchaB = Math.floor(Math.random() * 9) + 1;
      captchaText.textContent = `¿Cuánto es ${captchaA} + ${captchaB}?`;
    } else {
      status.textContent = "Error al enviar. Revisa el servidor.";
      status.className = "error";
    }
  } catch (error) {
    status.textContent = "No se pudo conectar al servidor.";
    status.className = "error";
  }
});
