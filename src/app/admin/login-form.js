"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin } from "@/app/actions/admin-actions";
import { setAdminAuthInStorage } from "@/lib/admin-storage";
import Link from "next/link";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(loginAdmin, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    setAdminAuthInStorage();
    const next = searchParams.get("next");
    const target =
      next && next.startsWith("/admin/dashboard") ? next : "/admin/dashboard";
    router.replace(target);
  }, [state, router, searchParams]);

  return (
    <>
      <form className="admin-form" action={formAction}>
        <label className="admin-label" htmlFor="password">
          Clave de acceso
        </label>
        <div className="admin-password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="admin-input admin-input-password"
            placeholder="••••••••"
            required
            autoFocus
          />
          <button
            type="button"
            className="admin-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <AiOutlineEyeInvisible size={22} aria-hidden />
            ) : (
              <AiOutlineEye size={22} aria-hidden />
            )}
          </button>
        </div>
        {state?.error ? <p className="admin-error">{state.error}</p> : null}
        <button className="admin-btn" type="submit" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="admin-back">
        <Link href="/">← Volver al sitio</Link>
      </p>
    </>
  );
}
