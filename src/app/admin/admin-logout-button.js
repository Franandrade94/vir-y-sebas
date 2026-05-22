"use client";

import { useTransition } from "react";
import { logoutAdmin } from "@/app/actions/admin-actions";
import { clearAdminAuthInStorage } from "@/lib/admin-storage";

export function AdminLogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="admin-btn admin-btn-outline"
      type="button"
      disabled={pending}
      onClick={() => {
        clearAdminAuthInStorage();
        startTransition(() => logoutAdmin());
      }}
    >
      {pending ? "Saliendo…" : "Salir"}
    </button>
  );
}
