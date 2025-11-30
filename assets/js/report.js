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

  const file = photoInput.files[0];
  const reader = new FileReader();

  reader.onloadend = async function() {
    const base64Image = reader.result;

    const payload = {
      action: "report_removed",
      id: id,
      new_comment: comment,
      new_image: base64Image
    };

    try {
      const response = await fetch(CONFIG.SERVER_URL, {
        method: 'POST',
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
  };

  reader.readAsDataURL(file);
});
