import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_TTL_SECONDS = 60 * 60; // 1 hora

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("party_photos")
      .select("id,name,bucket,path,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const items = [];
    for (const r of rows || []) {
      const { data: signed, error: sErr } = await supabase.storage
        .from(r.bucket)
        .createSignedUrl(r.path, SIGNED_TTL_SECONDS);

      if (sErr || !signed?.signedUrl) continue;
      items.push({
        id: r.id,
        name: r.name,
        created_at: r.created_at,
        signedUrl: signed.signedUrl,
      });
    }

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error inesperado." },
      { status: 500 }
    );
  }
}

