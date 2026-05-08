import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: solo en servidor (Server Actions / Route Handlers).
 * Nunca importes esto en código que llegue al browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim()) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local (Project Settings → API → Project URL)."
    );
  }
  if (!key?.trim()) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local. En Supabase: Project Settings → API → sección “Project API keys” → clave service_role (Reveal). No es la misma que anon public: la service_role solo se usa en el servidor para /admin."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
