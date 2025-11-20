// 1. Ve a https://script.google.com/
// 2. Pega este código reemplazando todo lo que haya.
// 3. Guarda (Ctrl + S).
// 4. Haz clic en "Implementar" > "Nueva implementación".
// 5. Selecciona tipo: "Aplicación web".
// 6. Descripción: "Versión 2 (con lectura)".
// 7. Ejecutar como: "Yo" (tu email).
// 8. Quién tiene acceso: "Cualquier persona" (IMPORTANTE).
// 9. Copia la "URL de la aplicación web" y pégala en tus archivos html (index.html y mapa.html).

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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var data = [];
  
  // Asumimos que la fila 0 son encabezados, empezamos de 1
  // Columnas: 0=Fecha, 1=Nombre, 2=Url, 3=Comentario
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[2] && row[2].toString().includes("google.com/maps")) {
      data.push({
        name: row[1],
        url: row[2],
        comment: row[3]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
