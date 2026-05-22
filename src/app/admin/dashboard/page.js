import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/service";
import { logoutAdmin } from "@/app/actions/admin-actions";
import {
  formatAcompananteDisplay,
  formatRestriccionDisplay,
} from "@/lib/rsvp-helpers";

export const metadata = {
  title: "Confirmaciones · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  if (!(await verifyAdminSession())) {
    redirect("/admin");
  }

  const supabase = createAdminClient();
  const selectFull =
    "id,nombre,apellido,email,acompanado,acompanante_nombre,acompanante_apellido,necesita_transporte,necesita_hospedaje,restriccion_tipo,restriccion_otro,restriccion_aplica,restricciones,created_at";
  const selectLegacy =
    "id,nombre,apellido,email,acompanado,acompanante_nombre,acompanante_apellido,necesita_transporte,necesita_hospedaje,restriccion_tipo,restriccion_otro,restricciones,created_at";

  let rows = null;
  let error = null;
  let needsMigration = false;

  const full = await supabase
    .from("rsvp_responses")
    .select(selectFull)
    .order("created_at", { ascending: false });

  if (!full.error) {
    rows = full.data;
  } else if (full.error.message?.includes("restriccion_aplica")) {
    needsMigration = true;
    const legacy = await supabase
      .from("rsvp_responses")
      .select(selectLegacy)
      .order("created_at", { ascending: false });
    rows = legacy.data;
    error = legacy.error;
  } else {
    error = full.error;
  }

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-dash-header">
        <h1 className="admin-title">Confirmaciones de asistencia</h1>
        <div className="admin-dash-actions">
          <Link className="admin-link" href="/">
            Ver sitio
          </Link>
          <form action={logoutAdmin}>
            <button className="admin-btn admin-btn-outline" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>

      {needsMigration ? (
        <p className="admin-error" role="status">
          Falta la columna <code>restriccion_aplica</code> en Supabase. Ejecutá el script{" "}
          <code>sql/rsvp_add_restriccion_aplica.sql</code> en SQL Editor para ver “Los
          dos / Yo / Invitado” y que el formulario guarde bien.
        </p>
      ) : null}

      {error ? (
        <p className="admin-error">Error al cargar: {error.message}</p>
      ) : !rows?.length ? (
        <p className="admin-empty">Todavía no hay respuestas.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invitado</th>
                <th>Email</th>
                <th>¿Acompañado?</th>
                <th>Acompañante</th>
                <th>Transporte</th>
                <th>Hospedaje</th>
                <th>Restricciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.nombre} {r.apellido}
                  </td>
                  <td>{r.email}</td>
                  <td>{r.acompanado === "si" ? "Sí" : "No"}</td>
                  <td>
                    {formatAcompananteDisplay(
                      r.acompanado,
                      r.acompanante_nombre,
                      r.acompanante_apellido
                    )}
                  </td>
                  <td>{r.necesita_transporte === "si" ? "Sí" : "No"}</td>
                  <td>{r.necesita_hospedaje === "si" ? "Sí" : "No"}</td>
                  <td className="admin-td-wrap">
                    {formatRestriccionDisplay(
                      r.restriccion_tipo,
                      r.restriccion_otro,
                      r.restricciones,
                      r.restriccion_aplica
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

