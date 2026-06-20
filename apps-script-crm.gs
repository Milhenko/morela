/**
 * ============================================================================
 *  MOREAL — Conector de formularios web -> Google Sheet (tabla prospectos_leads)
 * ============================================================================
 *
 *  QUÉ HACE:
 *  Recibe los leads de las landing pages (construcción, remodelación
 *  residencial y comercial) y los agrega como filas en la pestaña
 *  "prospectos_leads" de tu CRM. Mapea cada dato a TUS columnas reales,
 *  genera el ID correlativo (PROS-###), deriva el Canal desde el UTM y
 *  marca el lead como "Nuevo". AppSheet lo sincroniza solo.
 *
 *  ----------------------------------------------------------------------------
 *  ANTES DE USAR — prepara la pestaña prospectos_leads con estas columnas:
 *  ID_Prospecto | Fecha_Captación | Canal | ID_WhatsApp | Segmento |
 *  Calificación_Lead | Estatus_Lead | Nombre | Email | Servicio |
 *  Detalle_1 | Detalle_2 | Detalle_3 | utm_campaign | utm_content
 *  (el orden no importa: el script mapea por el NOMBRE del encabezado).
 *
 *  INSTALACIÓN / ACTUALIZACIÓN:
 *  1. Google Sheet de Moreal > Extensiones > Apps Script.
 *  2. Reemplaza el código por este y Guarda.
 *  3. Implementar > Administrar implementaciones > (lápiz) > Versión: NUEVA
 *     > Implementar.  (La URL /exec NO cambia.)
 * ============================================================================
 */

const SHEET_NAME = 'prospectos_leads';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (ignore) {}
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return json({ ok: false, error: 'No existe la pestaña ' + SHEET_NAME });
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var newId = nextProspectoId(sheet, headers);

    var row = headers.map(function (h) {
      return valueForHeader(String(h).trim(), data, newId);
    });

    sheet.appendRow(row);
    return json({ ok: true, id: newId });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* Mapea cada columna (por su nombre) al dato que llega del formulario. */
function valueForHeader(header, data, newId) {
  switch (header) {
    case 'ID_Prospecto':      return newId;
    case 'Fecha_Captación':
    case 'Fecha_Captacion':   return data.fecha ? new Date(data.fecha) : new Date();
    case 'Canal':             return derivarCanal(data);
    case 'ID_WhatsApp':       return data.telefono || '';
    case 'Estatus_Lead':      return 'Nuevo';
    case 'Nombre':            return data.nombre || '';
    case 'Email':             return data.email || '';
    case 'Servicio':          return data.servicio || data.origen || '';
    case 'Detalle_1':         return data.detalle1 || data.paso1 || '';
    case 'Detalle_2':         return data.detalle2 || data.paso2 || '';
    case 'Detalle_3':         return data.detalle3 || data.paso3 || '';
    case 'utm_campaign':      return data.utm_campaign || '';
    case 'utm_content':       return data.utm_content || '';
    /* Segmento y Calificación_Lead los completa el asesor -> quedan vacíos */
    default:                  return '';
  }
}

/* Canal a partir del origen de la pauta (utm_source). */
function derivarCanal(data) {
  var s = (data.utm_source || '').toLowerCase();
  if (/facebook|instagram|\bfb\b|\big\b|meta/.test(s)) return 'Meta Ads';
  if (/google|adwords|gclid/.test(s)) return 'Google Ads';
  if (!s) return 'Orgánico';
  return data.utm_source;
}

/* Genera el siguiente ID correlativo: PROS-001, PROS-002, ... */
function nextProspectoId(sheet, headers) {
  var idCol = headers.indexOf('ID_Prospecto') + 1;
  if (idCol < 1) idCol = 1;
  var last = sheet.getLastRow();
  if (last < 2) return 'PROS-001';
  var vals = sheet.getRange(2, idCol, last - 1, 1).getValues();
  var max = 0;
  vals.forEach(function (r) {
    var m = String(r[0]).match(/(\d+)/);
    if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
  });
  return 'PROS-' + String(max + 1).padStart(3, '0');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Moreal CRM endpoint activo.')
    .setMimeType(ContentService.MimeType.TEXT);
}
