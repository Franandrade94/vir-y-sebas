"use server";

import { createClient } from "@/lib/supabase/server";
import {
  RESTRICCION_APLICA,
  RESTRICCION_TIPOS,
  validateRsvpFields,
} from "@/lib/rsvp-helpers";

export async function submitRsvp(formData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const apellido = String(formData.get("apellido") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const rsvpVariant = String(formData.get("rsvp_variant") || "").trim();
  const sinInvitados = rsvpVariant === "sin_invitados";
  const acompanado = sinInvitados
    ? "no"
    : String(formData.get("acompanado") || "").trim();
  const acompananteNombre = String(formData.get("acompanante_nombre") || "").trim();
  const acompananteApellido = String(formData.get("acompanante_apellido") || "").trim();
  const necesita_transporte = String(formData.get("necesita_transporte") || "").trim();
  const necesita_hospedaje = String(formData.get("necesita_hospedaje") || "").trim();
  const restriccionTipo = String(formData.get("restriccion_tipo") || "").trim();
  const restriccionOtro = String(formData.get("restriccion_otro") || "").trim();
  let restriccionAplica = String(formData.get("restriccion_aplica") || "").trim();

  const errors = validateRsvpFields({
    nombre,
    apellido,
    email,
    sinInvitados,
    acompanado,
    acompananteNombre,
    acompananteApellido,
    necesita_transporte,
    necesita_hospedaje,
    restriccionTipo,
    restriccionOtro,
    restriccionAplica,
  });

  if (Object.keys(errors).length > 0) {
    return { ok: false, error: "Completá todos los campos marcados." };
  }

  if (restriccionTipo === "no" || !restriccionTipo) {
    restriccionAplica = null;
  } else if (sinInvitados || acompanado !== "si") {
    restriccionAplica = "yo";
  }

  if (restriccionAplica && !RESTRICCION_APLICA.includes(restriccionAplica)) {
    return { ok: false, error: "Indicá para quién es la restricción alimentaria." };
  }

  if (restriccionTipo && !RESTRICCION_TIPOS.includes(restriccionTipo)) {
    return { ok: false, error: "Revisá la restricción alimentaria." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rsvp_responses").insert({
      nombre,
      apellido,
      email,
      acompanado,
      acompanante_nombre: acompanado === "si" ? acompananteNombre : null,
      acompanante_apellido: acompanado === "si" ? acompananteApellido : null,
      necesita_transporte,
      necesita_hospedaje,
      restriccion_tipo: restriccionTipo,
      restriccion_otro: restriccionTipo === "otro" ? restriccionOtro : null,
      restriccion_aplica:
        restriccionTipo && restriccionTipo !== "no" ? restriccionAplica : null,
      restricciones: null,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const { sendRsvpConfirmationEmail } = await import("@/lib/email/send-rsvp-email");
    const emailResult = await sendRsvpConfirmationEmail({
      nombre,
      apellido,
      email,
      necesita_transporte,
      necesita_hospedaje,
    });

    return {
      ok: true,
      emailSent: Boolean(emailResult.ok),
      emailError: emailResult.error || null,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar.",
    };
  }
}
