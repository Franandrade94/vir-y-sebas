"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminAuthInStorage,
  hasAdminAuthInStorage,
  setAdminAuthInStorage,
} from "@/lib/admin-storage";

/** Si la cookie de sesión sigue válida, va al dashboard (y sincroniza localStorage). */
export function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;

        if (data.ok) {
          if (!hasAdminAuthInStorage()) setAdminAuthInStorage();
          router.replace("/admin/dashboard");
          return;
        }

        clearAdminAuthInStorage();
      } catch {
        clearAdminAuthInStorage();
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
