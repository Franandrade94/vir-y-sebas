"use server";

import { createClient } from "@/lib/supabase/server";

const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
const emailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function submitRsvp(formData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const apellido = String(formData.get("apellido") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const acompanado = String(formData.get("acompanado") || "").trim();
  const restricciones = String(formData.get("restricciones") || "").trim();

  if (!nombre || !soloLetras.test(nombre)) {
    return { ok: false, error: "Revisá el nombre (solo letras)." };
  }
  if (!apellido || !soloLetras.test(apellido)) {
    return { ok: false, error: "Revisá el apellido (solo letras)." };
  }
  if (!email || !emailOk(email)) {
    return { ok: false, error: "Revisá el correo electrónico." };
  }
  if (acompanado !== "si" && acompanado !== "no") {
    return { ok: false, error: "Indicá si vas acompañado." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rsvp_responses").insert({
      nombre,
      apellido,
      email,
      acompanado,
      restricciones: restricciones || null,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar.",
    };
  }
}
