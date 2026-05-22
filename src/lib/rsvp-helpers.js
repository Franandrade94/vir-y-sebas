/** Válido en HTML pattern (guión al final de la clase, sin escapes). */
export const INPUT_LETRAS_PATTERN = "[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]+";

export const RESTRICCION_TIPOS = ["no", "vegano", "vegetariano", "celiaco", "otro"];

export const RESTRICCION_APLICA = ["ambos", "yo", "invitado"];

export const RESTRICCION_LABELS = {
  no: "No",
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  celiaco: "Celiaco",
  otro: "Otro",
};

export const RESTRICCION_APLICA_LABELS = {
  ambos: "Los dos",
  yo: "Yo",
  invitado: "Invitado",
};

const soloLetrasRe = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

function emailOk(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Devuelve claves de campo con error (para bordes rojos en el formulario). */
export function validateRsvpFields({
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
}) {
  const errors = {};

  const nom = String(nombre || "").trim();
  const ape = String(apellido || "").trim();
  const mail = String(email || "").trim();

  if (!nom || !soloLetrasRe.test(nom)) errors.nombre = true;
  if (!ape || !soloLetrasRe.test(ape)) errors.apellido = true;
  if (!mail || !emailOk(mail)) errors.email = true;

  if (!sinInvitados) {
    if (acompanado !== "si" && acompanado !== "no") errors.acompanado = true;
    if (acompanado === "si") {
      const aNom = String(acompananteNombre || "").trim();
      const aApe = String(acompananteApellido || "").trim();
      if (!aNom || !soloLetrasRe.test(aNom)) errors.acompanante_nombre = true;
      if (!aApe || !soloLetrasRe.test(aApe)) errors.acompanante_apellido = true;
    }
  }

  if (necesita_transporte !== "si" && necesita_transporte !== "no") {
    errors.necesita_transporte = true;
  }
  if (necesita_hospedaje !== "si" && necesita_hospedaje !== "no") {
    errors.necesita_hospedaje = true;
  }

  const tipo = String(restriccionTipo || "").trim();
  if (!tipo || !RESTRICCION_TIPOS.includes(tipo)) {
    errors.restriccion_tipo = true;
  } else if (tipo !== "no") {
    if (tipo === "otro") {
      if (!String(restriccionOtro || "").trim()) errors.restriccion_otro = true;
    }
    const conAcompanante = !sinInvitados && acompanado === "si";
    if (conAcompanante) {
      const aplica = String(restriccionAplica || "").trim();
      if (!RESTRICCION_APLICA.includes(aplica)) errors.restriccion_aplica = true;
    }
  }

  return errors;
}

export function formatRestriccionDisplay(tipo, otro, legacyRestricciones) {
  if (tipo && RESTRICCION_LABELS[tipo]) {
    if (tipo === "otro") {
      return otro?.trim() ? `Otro: ${otro.trim()}` : "Otro";
    }
    return RESTRICCION_LABELS[tipo];
  }
  const legacy = legacyRestricciones?.trim();
  return legacy || "—";
}

export function formatRestriccionAplicaDisplay(tipo, aplica) {
  if (!tipo || tipo === "no") return "—";
  if (aplica && RESTRICCION_APLICA_LABELS[aplica]) {
    return RESTRICCION_APLICA_LABELS[aplica];
  }
  return "—";
}

export function formatAcompananteDisplay(acompanado, nombre, apellido) {
  if (acompanado !== "si") return "—";
  const n = nombre?.trim();
  const a = apellido?.trim();
  if (!n && !a) return "—";
  return [n, a].filter(Boolean).join(" ");
}
