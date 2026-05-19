"use server";

import { createClient } from "@/lib/supabase/server";
import { RESTRICCION_TIPOS } from "@/lib/rsvp-helpers";

const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
const emailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  if (!nombre || !soloLetras.test(nombre)) {
    return { ok: false, error: "Revisá el nombre (solo letras)." };
  }
  if (!apellido || !soloLetras.test(apellido)) {
    return { ok: false, error: "Revisá el apellido (solo letras)." };
  }
  if (!email || !emailOk(email)) {
    return { ok: false, error: "Revisá el correo electrónico." };
  }
  if (!sinInvitados && acompanado !== "si" && acompanado !== "no") {
    return { ok: false, error: "Indicá si vas acompañado." };
  }
  if (acompanado === "si") {
    if (!acompananteNombre || !soloLetras.test(acompananteNombre)) {
      return { ok: false, error: "Revisá el nombre del acompañante (solo letras)." };
    }
    if (!acompananteApellido || !soloLetras.test(acompananteApellido)) {
      return { ok: false, error: "Revisá el apellido del acompañante (solo letras)." };
    }
  }
  if (necesita_transporte !== "si" && necesita_transporte !== "no") {
    return { ok: false, error: "Indicá si necesitás transporte." };
  }
  if (necesita_hospedaje !== "si" && necesita_hospedaje !== "no") {
    return { ok: false, error: "Indicá si necesitás hospedaje." };
  }
  if (restriccionTipo && !RESTRICCION_TIPOS.includes(restriccionTipo)) {
    return { ok: false, error: "Revisá la restricción alimentaria." };
  }
  if (restriccionTipo === "otro" && !restriccionOtro.trim()) {
    return { ok: false, error: "Completá la restricción alimentaria (otro)." };
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
      restriccion_tipo: restriccionTipo || null,
      restriccion_otro: restriccionTipo === "otro" ? restriccionOtro : null,
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
