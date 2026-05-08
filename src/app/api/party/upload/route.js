import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "party";
const MAX_FILES = 10;
const MAX_BYTES_PER_FILE = 12 * 1024 * 1024; // 12MB

function safeExtFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "bin";
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter(Boolean);

    if (!files.length) {
      return NextResponse.json({ error: "No se recibieron archivos." }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} fotos por subida.` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const inserted = [];
    for (const f of files) {
      if (!(f instanceof File)) {
        return NextResponse.json({ error: "Archivo inválido." }, { status: 400 });
      }
      if (!String(f.type || "").startsWith("image/")) {
        return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
      }
      if (f.size > MAX_BYTES_PER_FILE) {
        return NextResponse.json(
          { error: `Una imagen supera el máximo de ${Math.floor(MAX_BYTES_PER_FILE / (1024 * 1024))}MB.` },
          { status: 400 }
        );
      }

      const ext = safeExtFromMime(f.type);
      const fileId = crypto.randomUUID();
      const path = `uploads/${new Date().toISOString().slice(0, 10)}/${fileId}.${ext}`;
      const bytes = new Uint8Array(await f.arrayBuffer());

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: f.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 400 });
      }

      const name = f.name || `${fileId}.${ext}`;
      const { data: row, error: dbErr } = await supabase
        .from("party_photos")
        .insert({
          name,
          bucket: BUCKET,
          path,
          mime: f.type || null,
          size_bytes: f.size ?? null,
        })
        .select("id,name,bucket,path,created_at")
        .single();

      if (dbErr) {
        // si falla DB, intentamos borrar el archivo para no dejar basura
        await supabase.storage.from(BUCKET).remove([path]);
        return NextResponse.json({ error: dbErr.message }, { status: 400 });
      }

      inserted.push(row);
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error inesperado." },
      { status: 500 }
    );
  }
}

