/**
 * ============================================================================
 *  MOREAL — Conector de formularios web -> Google Sheet (CRM AppSheet)
 * ============================================================================
 *
 *  QUÉ HACE:
 *  Recibe los leads de las landing pages (construcción, remodelación
 *  residencial y comercial) y los agrega como filas en una pestaña del
 *  Google Sheet que tu app de AppSheet usa como fuente de datos.
 *  AppSheet sincroniza esa hoja, así que el lead aparece en tu CRM solo.
 *
 *  (La hoja de Moreal está limpia — Twilio aún no está configurado aquí —,
 *   por eso usamos el camino simple: el Apps Script de la propia hoja.)
 *
 *  ----------------------------------------------------------------------------
 *  INSTALACIÓN (una sola vez):
 *  ----------------------------------------------------------------------------
 *  1. Abre el Google Sheet que respalda tu CRM de AppSheet (el de Moreal).
 *  2. Menú  Extensiones > Apps Script.
 *  3. Borra el código de ejemplo y pega TODO este archivo.
 *  4. Si quieres, cambia SHEET_NAME por la pestaña destino. Si no existe,
 *     el script la crea sola con sus encabezados.
 *  5. Guarda (disquete).
 *  6. Botón  Implementar > Nueva implementación:
 *        - Tipo:  Aplicación web
 *        - Ejecutar como:  Yo
 *        - Quién tiene acceso:  Cualquier persona
 *     Implementar  ->  Autoriza con tu cuenta de Google.
 *  7. Copia la "URL de la aplicación web" (termina en /exec) y pásasela
 *     a Claude (o pégala en la constante CRM_ENDPOINT de los 3 .html).
 *
 *  Cada vez que CAMBIES este código:  Implementar > Administrar
 *  implementaciones > editar (lápiz) > Versión: Nueva, para que la URL
 *  sirva la versión nueva.
 *
 *  En AppSheet: si la pestaña "Leads_Web" es nueva, agrégala como tabla
 *  (Data > Add Table) para verla en tu CRM.
 * ============================================================================
 */

const SHEET_NAME = 'Leads_Web';
const HEADERS = ['Fecha', 'Origen', 'Paso1', 'Paso2', 'Paso3', 'Nombre', 'Email', 'Telefono'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    const row = HEADERS.map(function (h) {
      if (h === 'Fecha') {
        return data.fecha ? new Date(data.fecha) : new Date();
      }
      return data[h.toLowerCase()] || '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* Permite comprobar en el navegador que la implementación está viva. */
function doGet() {
  return ContentService
    .createTextOutput('Moreal CRM endpoint activo.')
    .setMimeType(ContentService.MimeType.TEXT);
}
