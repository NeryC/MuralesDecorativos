// 1. Ve a https://script.google.com/
// 2. Pega este código reemplazando todo lo que haya.
// 3. Guarda (Ctrl + S).
// 4. Haz clic en "Implementar" > "Nueva implementación".
// 5. Selecciona tipo: "Aplicación web".
// 6. Descripción: "Versión 4 (Visor de Fotos)".
// 7. Ejecutar como: "Yo" (tu email).
// 8. Quién tiene acceso: "Cualquier persona" (IMPORTANTE).
// 9. Copia la "URL de la aplicación web" y pégala en tus archivos html si cambió (usualmente no cambia si actualizas sobre la misma).

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action === "report_removed") {
    // Usar el ID (número de fila) directamente
    var rowId = parseInt(data.id);
    
    if (rowId && rowId > 1) { // Asegurar que es un ID válido y no es el encabezado
        try {
            // Actualizar estado a "modificado_pendiente" (Columna F -> índice 5)
            sheet.getRange(rowId, 6).setValue("modificado_pendiente");
            
            // Guardar nuevo comentario en Columna G (índice 6)
            sheet.getRange(rowId, 7).setValue(data.new_comment || "");
            
            // Guardar nueva imagen en Columna H (índice 7)
            sheet.getRange(rowId, 8).setValue(data.new_image || "");
            
            return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                .setMimeType(ContentService.MimeType.JSON);
        } catch (err) {
             return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.message }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    } else {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "ID inválido" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } else {
    // Flujo normal de agregar nuevo
    sheet.appendRow([
      new Date(), 
      data.name, 
      data.url, 
      data.comment, 
      data.image || "", 
      "pendiente"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var status = row[5]; // Columna F
    
    if (status) {
        var statusStr = status.toString().toLowerCase();
        
        if (statusStr === "aprobado" || statusStr === "modificado_aprobado") {
          if (row[2] && row[2].toString().includes("google.com/maps")) {
            var item = {
              id: i + 1, // El ID es el número de fila (1-based)
              name: row[1],
              url: row[2],
              comment: row[3],
              image: row[4],
              status: statusStr
            };
            
            if (statusStr === "modificado_aprobado") {
                item.new_comment = row[6]; // Columna G
                item.new_image = row[7];   // Columna H
            }
            
            data.push(item);
          }
        }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- NUEVO: Menú para ver fotos ---

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('🖼️ Murales')
      .addItem('Ver Foto', 'showSidebar')
      .addToUi();
}

function showSidebar() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  
  // Leer la imagen de la columna E (índice 4, porque empieza en 0)
  // A=0, B=1, C=2, D=3, E=4
  var imageBase64 = sheet.getRange(row, 5).getValue();
  
  var html = '<html><body>';
  if (imageBase64 && imageBase64.startsWith('data:image')) {
    html += '<h3>Foto del Mural</h3>';
    html += '<img src="' + imageBase64 + '" style="width:100%;">';
  } else {
    html += '<h3>No hay foto en esta fila</h3>';
    html += '<p>Selecciona una fila que tenga datos en la columna E.</p>';
  }
  html += '<br><button onclick="google.script.host.close()">Cerrar</button>';
  html += '</body></html>';
  
  var ui = HtmlService.createHtmlOutput(html)
      .setTitle('Visor de Murales');
      
  SpreadsheetApp.getUi().showSidebar(ui);
}
