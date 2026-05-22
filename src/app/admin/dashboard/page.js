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
  const { data: rows, error } = await supabase
    .from("rsvp_responses")
    .select(
      "id,nombre,apellido,email,acompanado,acompanante_nombre,acompanante_apellido,necesita_transporte,necesita_hospedaje,restriccion_tipo,restriccion_otro,restriccion_aplica,restricciones,created_at"
    )
    .order("created_at", { ascending: false });

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

