import { Resend } from "resend";
import {
  buildRsvpEmailHtml,
  getRsvpEmailSubject,
} from "@/lib/email/rsvp-email-template";

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

/**
 * Envía el correo de confirmación según transporte / hospedaje.
 * No lanza si falta config (solo loguea); el RSVP ya quedó guardado.
 */
export async function sendRsvpConfirmationEmail({
  nombre,
  apellido,
  email,
  necesita_transporte,
  necesita_hospedaje,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("[rsvp-email] RESEND_API_KEY o RESEND_FROM_EMAIL no configurados; correo omitido.");
    return { ok: false, skipped: true };
  }

  const siteUrl = getSiteUrl();
  const html = buildRsvpEmailHtml({
    nombre,
    apellido,
    necesita_transporte,
    necesita_hospedaje,
    siteUrl,
  });
  const subject = getRsvpEmailSubject({ necesita_transporte, necesita_hospedaje });

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("[rsvp-email] Resend error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (e) {
    console.error("[rsvp-email]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al enviar el correo",
    };
  }
}
