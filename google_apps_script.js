// 1. Ve a https://script.google.com/
// 2. Pega este código reemplazando todo lo que haya.
// 3. Guarda (Ctrl + S).
// 4. Haz clic en "Implementar" > "Nueva implementación".
// 5. Selecciona tipo: "Aplicación web".
// 6. Descripción: "Versión 3 (Moderación)".
// 7. Ejecutar como: "Yo" (tu email).
// 8. Quién tiene acceso: "Cualquier persona" (IMPORTANTE).
// 9. Copia la "URL de la aplicación web" y pégala en tus archivos html.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Parsear los datos que vienen como string JSON
  var data = JSON.parse(e.postData.contents);
  
  // Columnas: Fecha, Nombre, Url, Comentario, Imagen, Estado
  // Estado por defecto: "Pendiente"
  sheet.appendRow([
    new Date(), 
    data.name, 
    data.url, 
    data.comment, 
    data.image || "", // Imagen en Base64
    "Pendiente"       // Estado inicial
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var data = [];
  
  // Asumimos que la fila 0 son encabezados, empezamos de 1
  // Columnas: 0=Fecha, 1=Nombre, 2=Url, 3=Comentario, 4=Imagen, 5=Estado
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var status = row[5]; // Columna F (Estado)
    
    // SOLO devolver si el estado es "Aprobado" (o si no hay estado, para compatibilidad vieja si quieres, pero mejor ser estricto)
    if (status && status.toString().toLowerCase() === "aprobado") {
      if (row[2] && row[2].toString().includes("google.com/maps")) {
        data.push({
          name: row[1],
          url: row[2],
          comment: row[3],
          image: row[4] // Incluir imagen si existe
        });
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
