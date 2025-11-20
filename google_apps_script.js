// 1. Ve a https://script.google.com/
// 2. Pega este código reemplazando todo lo que haya.
// 3. Guarda (Ctrl + S).
// 4. Haz clic en "Implementar" > "Nueva implementación".
// 5. Selecciona tipo: "Aplicación web".
// 6. Descripción: "Versión 1".
// 7. Ejecutar como: "Yo" (tu email).
// 8. Quién tiene acceso: "Cualquier persona" (IMPORTANTE).
// 9. Copia la "URL de la aplicación web" y pégala en tu index.html donde dice `serverUrl`.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Parsear los datos que vienen como string JSON
  var data = JSON.parse(e.postData.contents);
  
  // Agregar la fila con fecha, nombre, url, comentario
  sheet.appendRow([new Date(), data.name, data.url, data.comment]);
  
  // Retornar respuesta exitosa
  return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("El servidor está funcionando.");
}
