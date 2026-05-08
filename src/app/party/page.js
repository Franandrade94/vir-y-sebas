"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import ClipLoader from "react-spinners/ClipLoader";

const MAX_FILES = 10;

async function fetchJson(url, options) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  const res = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(t);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Error ${res.status}${res.statusText ? `: ${res.statusText}` : ""}`;
    throw new Error(msg);
  }
  return data;
}

export default function PartyPage() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(() => new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [lbDragging, setLbDragging] = useState(false);
  const [lbStartX, setLbStartX] = useState(0);
  const [lbDeltaX, setLbDeltaX] = useState(0);

  const gridItems = useMemo(() => items.filter((x) => x?.signedUrl), [items]);
  const markLoaded = (id) =>
    setLoaded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const count = gridItems.length;
  const lbPrev = () => setLbIndex((i) => (count ? (i - 1 + count) % count : 0));
  const lbNext = () => setLbIndex((i) => (count ? (i + 1) % count : 0));

  async function load() {
    setError("");
    setLoadingList(true);
    try {
      const data = await fetchJson("/api/party/list", { cache: "no-store" });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setLoaded(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    if (!files.length) return;
    if (files.length > MAX_FILES) {
      setError(`Podés subir hasta ${MAX_FILES} fotos a la vez.`);
      return;
    }

    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setError("Solo se permiten imágenes.");
        return;
      }
    }

    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      await fetchJson("/api/party/upload", { method: "POST", body: form });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="party-page">
      <section className="party-hero">
        <h1 className="party-title">Subi tus fotos de nuestro casamiento</h1>

        <input
          id="party-files"
          className="party-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
        />

        <div className="party-add-wrap">
          <label
            className="party-add-btn"
            aria-label="Subir fotos"
            title="Subir fotos"
            aria-disabled={uploading}
            data-disabled={uploading ? "true" : "false"}
            htmlFor={uploading ? undefined : "party-files"}
          >
            <FiPlus aria-hidden />
          </label>

          <p className="party-max">
            <span className="party-max-long">10 fotos maximo</span>
            <span className="party-max-short">10 max.</span>
          </p>
        </div>

        {error ? <p className="party-error">{error}</p> : null}
        {uploading ? <p className="party-muted">Subiendo…</p> : null}
      </section>

      <section className="party-grid-wrap" aria-busy={loadingList}>
        {loadingList ? (
          <div className="party-loading">
            <ClipLoader color="var(--gold)" size={34} />
          </div>
        ) : error ? (
          <p className="party-empty">{error}</p>
        ) : !gridItems.length ? (
          <p className="party-empty">Sé el primero en subir una foto</p>
        ) : (
          <div className="party-grid">
            {gridItems.map((it, idx) => (
              <div
                className="party-tile"
                key={it.id}
                role="button"
                tabIndex={0}
                aria-label="Abrir foto"
                onClick={() => {
                  setLbIndex(idx);
                  setLightboxOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLbIndex(idx);
                    setLightboxOpen(true);
                  }
                }}
              >
                {!loaded.has(it.id) ? (
                  <div className="party-tile-spinner" aria-hidden>
                    <ClipLoader color="var(--gold)" size={22} />
                  </div>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="party-img"
                  src={it.signedUrl}
                  alt={it.name || "Foto"}
                  loading="lazy"
                  onLoad={() => markLoaded(it.id)}
                  onError={() => markLoaded(it.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        className={`lightbox${lightboxOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Galería de fotos"
      >
        <button
          className="lightbox-backdrop"
          type="button"
          aria-label="Cerrar"
          onClick={() => setLightboxOpen(false)}
        />
        <button className="lightbox-close" type="button" onClick={() => setLightboxOpen(false)}>
          ✕
        </button>

        <button className="lightbox-arrow lightbox-arrow-left" type="button" onClick={lbPrev}>
          ‹
        </button>

        <div
          className="lightbox-viewport"
          onClick={(e) => {
            if (e.target instanceof Element && e.target.closest("img")) return;
            setLightboxOpen(false);
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") return;
            setLbDragging(true);
            setLbStartX(e.clientX);
            setLbDeltaX(0);
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse") return;
            if (!lbDragging) return;
            setLbDeltaX(e.clientX - lbStartX);
          }}
          onPointerUp={() => {
            if (!lbDragging) return;
            const threshold = 40;
            if (lbDeltaX > threshold) lbPrev();
            else if (lbDeltaX < -threshold) lbNext();
            setLbDragging(false);
            setLbDeltaX(0);
          }}
          onPointerCancel={() => {
            setLbDragging(false);
            setLbDeltaX(0);
          }}
        >
          <div
            className="lightbox-track"
            style={{
              transform: `translateX(calc(${-lbIndex * 100}% + ${lbDeltaX}px))`,
              transition: lbDragging ? "none" : undefined,
            }}
          >
            {gridItems.map((it) => (
              <div className="lightbox-slide" key={`lb-${it.id}`}>
                <div className="carousel-img carousel-img-lightbox">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.signedUrl} alt={it.name || "Foto"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="lightbox-arrow lightbox-arrow-right" type="button" onClick={lbNext}>
          ›
        </button>
      </div>
    </main>
  );
}

