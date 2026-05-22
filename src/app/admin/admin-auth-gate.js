"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminAuthInStorage,
  hasAdminAuthInStorage,
  setAdminAuthInStorage,
} from "@/lib/admin-storage";

export function AdminAuthGate({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!hasAdminAuthInStorage()) {
        router.replace("/admin");
        return;
      }

      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;

        if (data.ok) {
          setAdminAuthInStorage();
          setAllowed(true);
          return;
        }
      } catch {
        /* fall through */
      }

      clearAdminAuthInStorage();
      router.replace("/admin");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="admin-page admin-login">
        <div className="admin-card">
          <p className="admin-hint">Verificando acceso…</p>
        </div>
      </div>
    );
  }

  return children;
}
