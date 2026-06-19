/**
 * ============================================================================
 *  MOREAL — Conector formularios web -> Google Sheet (pestaña SEPARADA)
 * ============================================================================
 *
 *  ⚠️⚠️  LEER ANTES DE TOCAR NADA  ⚠️⚠️
 *
 *  NO pegues esto en  Extensiones > Apps Script  de tu hoja.
 *  Ese proyecto ya contiene el código que recibe Meta y dispara Twilio.
 *  NO lo borres ni lo modifiques.
 *
 *  Este script va en un proyecto de Apps Script *NUEVO E INDEPENDIENTE*.
 *  Razones:
 *   - En un mismo proyecto solo puede haber UN doPost; el tuyo (Meta/Twilio)
 *     se rompería. Un proyecto separado evita ese choque.
 *   - Los leads de la web caen en una pestaña aparte ("Leads_Web") que tu
 *     automatización de Twilio NO vigila  ->  esos leads NO reciben el
 *     mensaje automático (que es justo lo que pediste).
 *
 *  ----------------------------------------------------------------------------
 *  INSTALACIÓN (una sola vez):
 *  ----------------------------------------------------------------------------
 *  1. Entra a  https://script.google.com  y crea un  PROYECTO NUEVO
 *     (botón "Nuevo proyecto"). NO uses el editor de tu hoja.
 *  2. Borra el código de ejemplo y pega TODO este archivo.
 *  3. Pon abajo tu SPREADSHEET_ID: está en la URL de tu Google Sheet,
 *     entre  /d/  y  /edit :
 *        docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
 *  4. Guarda (disquete).
 *  5. Implementar > Nueva implementación:
 *        - Tipo:  Aplicación web
 *        - Ejecutar como:  Yo (tu cuenta)
 *        - Quién tiene acceso:  Cualquier persona
 *     Implementar  ->  Autoriza con tu cuenta de Google.
 *  6. Copia la "URL de la aplicación web" (termina en /exec).
 *  7. Pásale esa URL a Claude (o pégala en la constante CRM_ENDPOINT de los
 *     3 archivos .html).
 *
 *  ----------------------------------------------------------------------------
 *  En AppSheet: agrega la pestaña "Leads_Web" como tabla nueva
 *  (Data > Add Table) para ver los leads de la web en tu CRM, separados
 *  de los de Meta.
 *
 *  NOTA DE SEGURIDAD: para garantizar que Twilio NO escriba a los leads web,
 *  tu automatización actual debe filtrar por la pestaña de Meta (no actuar
 *  sobre "Leads_Web"). Lo confirmamos con un lead de prueba al terminar.
 * ============================================================================
 */

const SPREADSHEET_ID = 'PEGA_AQUI_EL_ID_DE_TU_HOJA';
const SHEET_NAME = 'Leads_Web';
const HEADERS = ['Fecha', 'Origen', 'Paso1', 'Paso2', 'Paso3', 'Nombre', 'Email', 'Telefono'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
