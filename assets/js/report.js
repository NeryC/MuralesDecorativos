import { CONFIG } from './config.js';

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const muralId = urlParams.get('id');
const muralName = urlParams.get('name');

if (muralId) {
    document.getElementById('muralId').value = muralId;
    document.getElementById('muralNameDisplay').value = muralName || "Mural #" + muralId;
} else {
    document.getElementById('status').innerHTML = '<span class="status-message error">Error: No se especificó ningún mural. Vuelve al mapa e intenta de nuevo.</span>';
    document.getElementById('submitBtn').disabled = true;
}

// Image preview
document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

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

        const canvas = document.createElement('canvas');
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

document.getElementById('reportForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('status');
  const photoInput = document.getElementById('photoInput');
  const comment = document.getElementById('comment').value;
  const id = document.getElementById('muralId').value;

  if (!photoInput.files.length) {
    status.innerHTML = '<span class="status-message error">Por favor selecciona una foto.</span>';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";
  status.textContent = "";

  try {
    const base64Image = await compressImage(photoInput.files[0]);

    const payload = {
      action: "report_removed",
      id: id,
      new_comment: comment,
      new_image: base64Image
    };

    const response = await fetch(CONFIG.SERVER_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();

    if (result.result === "success") {
      status.innerHTML = '<span class="status-message success">¡Reporte enviado con éxito! Gracias por tu colaboración.</span>';
      document.getElementById('reportForm').reset();
      document.getElementById('preview').style.display = 'none';
      setTimeout(() => {
          window.location.href = 'mapa.html';
      }, 3000);
    } else {
      throw new Error(result.error || "Error desconocido");
    }

  } catch (error) {
    console.error(error);
    status.innerHTML = '<span class="status-message error">Error al enviar: ' + error.message + '</span>';
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar Reporte";
  }
});
