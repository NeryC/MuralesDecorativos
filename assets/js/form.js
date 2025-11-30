import { CONFIG } from './config.js';

const form = document.getElementById('locationForm');
const status = document.getElementById('status');
const captchaText = document.getElementById('captchaText');
const captchaInput = document.getElementById('captchaInput');
const placeUrl = document.getElementById('placeUrl');
const photoInput = document.getElementById('photoInput');
const canvas = document.getElementById('canvas');

// Initialize map
// Default coordinates (Asunción, Paraguay)
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

    // Generate Google Maps link
    placeUrl.value = `https://www.google.com/maps?q=${lat},${lng}`;
});

// Try to get user location
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

function validarURL(url) {
  return url.includes("google.com/maps") || url.includes("maps.app.goo.gl");
}

// Function to compress image
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
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // JPEG compression 70%
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = "";
  status.className = "status-message"; // Reset class

  if (!validarURL(placeUrl.value)) {
    status.textContent = "Por favor selecciona un punto en el mapa.";
    status.classList.add("error");
    return;
  }

  if (parseInt(captchaInput.value) !== captchaA + captchaB) {
    status.textContent = "Respuesta incorrecta en la verificación.";
    status.classList.add("error");
    return;
  }

  if (photoInput.files.length === 0) {
    status.textContent = "Debes subir una foto del mural.";
    status.classList.add("error");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Procesando...";
  
  let imageBase64 = "";
  try {
    imageBase64 = await compressImage(photoInput.files[0]);
  } catch (err) {
      console.error(err);
      status.textContent = "Error al procesar la imagen.";
      status.classList.add("error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar";
      return;
  }

  const data = {
    name: document.getElementById('placeName').value,
    candidate: document.getElementById('candidateName').value,
    url: placeUrl.value,
    comment: document.getElementById('comment').value,
    image: imageBase64
  };

  try {
    status.textContent = "Enviando... (esto puede tardar unos segundos)";
    const response = await fetch(CONFIG.SERVER_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      status.textContent = "¡Enviado! Tu mural está pendiente de aprobación.";
      status.classList.add("success");
      form.reset();
      placeUrl.value = ""; 
      if (marker) map.removeLayer(marker);
      
      captchaA = Math.floor(Math.random() * 9) + 1;
      captchaB = Math.floor(Math.random() * 9) + 1;
      captchaText.textContent = `¿Cuánto es ${captchaA} + ${captchaB}?`;
    } else {
      status.textContent = "Error al enviar. Revisa el servidor.";
      status.classList.add("error");
    }
  } catch (error) {
    status.textContent = "No se pudo conectar al servidor.";
    status.classList.add("error");
  } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar";
  }
});
