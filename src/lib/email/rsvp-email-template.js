import {
  getCalendarIcsUrl,
  HOTEL_DISCOUNT_CODE,
  HOTEL_MAPS_URL,
  HOTEL_WEB_URL,
  MICRO_MAPS_URL,
  VENUE_ADDRESS,
  VENUE_MAPS_URL,
  VENUE_NAME,
} from "@/lib/event-links";

const COLORS = {
  cream: "#f5f0e8",
  warmWhite: "#fdfaf4",
  gold: "#b8975a",
  goldDark: "#8f6e38",
  dark: "#2a2218",
  mid: "#6b5d4f",
  text: "#3d3229",
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function btn(href, label, primary = true) {
  const bg = primary ? COLORS.gold : "transparent";
  const color = primary ? COLORS.warmWhite : COLORS.gold;
  const border = primary ? COLORS.gold : COLORS.gold;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:14px 22px;background:${bg};color:${color};text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid ${border};border-radius:2px;">${escapeHtml(label)}</a>`;
}

function paragraph(html) {
  return `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.65;color:${COLORS.mid};font-style:italic;">${html}</p>`;
}

function heading(text) {
  return `<h2 style="margin:28px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;color:${COLORS.gold};font-weight:600;font-style:normal;">${escapeHtml(text)}</h2>`;
}

function codeBox(code) {
  return `<div style="margin:16px 0 22px;padding:20px 24px;background:${COLORS.cream};border:1px solid ${COLORS.gold};text-align:center;">
    <span style="font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:700;letter-spacing:0.06em;color:${COLORS.dark};">${escapeHtml(code)}</span>
  </div>`;
}

function buildMicroSection() {
  return `
    ${heading("Transporte")}
    ${paragraph(
      "Un micro va a salir desde <strong style=\"color:#2a2218;font-style:normal;\">Plaza Italia</strong>. Te compartimos el punto de encuentro:"
    )}
    <p style="margin:0 0 8px;text-align:center;">${btn(MICRO_MAPS_URL, "Ver ubicación")}</p>
  `;
}

function buildHotelSection() {
  return `
    ${heading("Hospedaje")}
    ${paragraph(
      "Hospedate en el hotel <strong style=\"color:#2a2218;font-style:normal;\">KOS Pilar</strong> y obtené un <strong style=\"color:#2a2218;font-style:normal;\">10% de descuento</strong> con nuestro código reservando por mail o por la página web:"
    )}
    ${codeBox(HOTEL_DISCOUNT_CODE)}
    <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${COLORS.mid};">
      Web del hotel: <a href="${escapeHtml(HOTEL_WEB_URL)}" style="color:${COLORS.goldDark};text-decoration:underline;">kospilarhotel.com</a>
    </p>
    <p style="margin:0 0 8px;text-align:center;">${btn(HOTEL_MAPS_URL, "Ubicación del hotel", false)}</p>
  `;
}

function buildEventSection(siteUrl) {
  const calendarUrl = getCalendarIcsUrl(siteUrl);
  return `
    ${heading("Agendá la fecha")}
    <p style="margin:0 0 14px;text-align:center;">
      ${btn(calendarUrl, "Agendar con Google")}
      ${btn(calendarUrl, "Agendar con iPhone")}
    </p>
    ${heading("Ubicación del salón")}
    ${paragraph(
      `<strong style="color:#2a2218;font-style:normal;">${escapeHtml(VENUE_NAME)}</strong><br>${escapeHtml(VENUE_ADDRESS)}`
    )}
    <p style="margin:0 0 8px;text-align:center;">${btn(VENUE_MAPS_URL, "Cómo llegar al salón")}</p>
  `;
}

function buildClosingSection() {
  return `
    <div style="margin-top:32px;padding-top:28px;border-top:1px solid rgba(184,151,90,0.4);text-align:center;">
      ${paragraph("Nos vemos en nuestro casamiento")}
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.7;color:${COLORS.mid};font-style:italic;">
        Los queremos mucho<br>Un beso
      </p>
    </div>
  `;
}

function buildIntro(nombre, apellido, fullThankYou) {
  const name = escapeHtml(`${nombre} ${apellido}`.trim());
  if (fullThankYou) {
    return `
      ${paragraph(`Hola <strong style="color:#2a2218;font-style:normal;">${name}</strong>,`)}
      ${paragraph("Gracias por completar la confirmación de asistencia.")}
    `;
  }
  return `
    ${paragraph(`Hola <strong style="color:#2a2218;font-style:normal;">${name}</strong>,`)}
    ${paragraph("Gracias por confirmar tu asistencia. Te dejamos la información que nos pediste:")}
  `;
}

export function buildRsvpEmailHtml({
  nombre,
  apellido,
  necesita_transporte,
  necesita_hospedaje,
  siteUrl,
}) {
  const transporte = necesita_transporte === "si";
  const hospedaje = necesita_hospedaje === "si";
  const fullThankYou = !transporte && !hospedaje;

  let body = buildIntro(nombre, apellido, fullThankYou);
  if (transporte) body += buildMicroSection();
  if (hospedaje) body += buildHotelSection();
  body += buildEventSection(siteUrl);
  if (fullThankYou) body += buildClosingSection();
  else if (transporte || hospedaje) {
    body += `
      <div style="margin-top:28px;text-align:center;">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${COLORS.mid};font-style:italic;">¡Te esperamos!</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Casamiento Vir y Seba</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.cream};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${COLORS.cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${COLORS.warmWhite};border:1px solid rgba(184,151,90,0.35);">
          <tr>
            <td style="padding:40px 32px 16px;text-align:center;border-bottom:1px solid rgba(184,151,90,0.35);">
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:${COLORS.dark};">Vir &amp; Seba</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:300;color:${COLORS.goldDark};font-style:italic;">Casamiento</h1>
              <p style="margin:12px 0 0;font-size:14px;color:${COLORS.mid};font-family:Georgia,serif;font-style:italic;">3 de octubre de 2026 · 18:00 hs</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 40px;">
              ${body}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;max-width:480px;font-size:12px;line-height:1.55;color:${COLORS.mid};font-family:sans-serif;text-align:center;">
          Este es un correo automático enviado al confirmar tu asistencia en nuestra web.
          <strong style="color:${COLORS.dark};font-weight:600;"> Por favor, no respondas a este mensaje</strong>; este buzón no está monitoreado.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getRsvpEmailSubject({ necesita_transporte, necesita_hospedaje }) {
  if (necesita_transporte === "si" && necesita_hospedaje === "si") {
    return "Vir y Seba — Transporte y hospedaje";
  }
  if (necesita_transporte === "si") {
    return "Vir y Seba — Info del micro (Plaza Italia)";
  }
  if (necesita_hospedaje === "si") {
    return "Vir y Seba — Hospedaje KOS Pilar";
  }
  return "Vir y Seba — Confirmación de asistencia";
}
