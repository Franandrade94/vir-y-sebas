/** Válido en HTML pattern (guión al final de la clase, sin escapes). */
export const INPUT_LETRAS_PATTERN = "[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]+";

export const RESTRICCION_TIPOS = ["no", "vegano", "vegetariano", "celiaco", "otro"];

export const RESTRICCION_LABELS = {
  no: "No",
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  celiaco: "Celiaco",
  otro: "Otro",
};

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

export function formatAcompananteDisplay(acompanado, nombre, apellido) {
  if (acompanado !== "si") return "—";
  const n = nombre?.trim();
  const a = apellido?.trim();
  if (!n && !a) return "—";
  return [n, a].filter(Boolean).join(" ");
}
