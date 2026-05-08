"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/service";
import { setAdminSession, clearAdminSession } from "@/lib/admin-session";

export async function loginAdmin(_prevState, formData) {
  const password = String(formData.get("password") || "");
  if (!password) {
    return { ok: false, error: "Ingresá la clave." };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admin_secret")
      .select("passphrase_hash")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data?.passphrase_hash) {
      return { ok: false, error: "No se pudo verificar la clave. Revisá la tabla admin_secret." };
    }

    const ok = bcrypt.compareSync(password, data.passphrase_hash);
    if (!ok) {
      return { ok: false, error: "Clave incorrecta." };
    }

    await setAdminSession();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al iniciar sesión.",
    };
  }

  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}
