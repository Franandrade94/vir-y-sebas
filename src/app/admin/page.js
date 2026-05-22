import { Suspense } from "react";
import { AdminLoginRedirect } from "./admin-login-redirect";
import { AdminLoginForm } from "./login-form";

function LoginFormFallback() {
  return (
    <div className="admin-form" aria-busy="true" aria-label="Cargando formulario">
      <div className="admin-password-field">
        <div
          className="admin-input admin-input-password"
          style={{ height: 50, opacity: 0.35 }}
        />
      </div>
      <div className="admin-btn" style={{ opacity: 0.35, pointerEvents: "none" }}>
        Entrar
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="admin-page admin-login">
      <div className="admin-card">
        <h1 className="admin-title">Panel admin</h1>
        <p className="admin-hint">Ingresá la clave de Administrador</p>
        <AdminLoginRedirect />
        <Suspense fallback={<LoginFormFallback />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
