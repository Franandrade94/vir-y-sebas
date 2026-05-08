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
  const [lbVIndex, setLbVIndex] = useState(1); // índice virtual (loop con clones)
  const [lbTransitionEnabled, setLbTransitionEnabled] = useState(true);
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
  const lbLoopImages = useMemo(() => {
    if (!count) return [];
    const last = gridItems[count - 1];
    const first = gridItems[0];
    return [last, ...gridItems, first];
  }, [count, gridItems]);

  const lbPrevLoop = () =>
    setLbVIndex((v) => {
      const next = v - 1;
      return next < 0 ? 0 : next;
    });
  const lbNextLoop = () =>
    setLbVIndex((v) => {
      const next = v + 1;
      return next > count + 1 ? count + 1 : next;
    });

  const onLbTransitionEnd = () => {
    if (!count) return;
    if (lbVIndex <= 0) {
      setLbTransitionEnabled(false);
      setLbVIndex(count);
      requestAnimationFrame(() => requestAnimationFrame(() => setLbTransitionEnabled(true)));
    } else if (lbVIndex >= count + 1) {
      setLbTransitionEnabled(false);
      setLbVIndex(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setLbTransitionEnabled(true)));
    }
  };

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

  useEffect(() => {
    document.body.classList.toggle("no-scroll", lightboxOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") lbPrevLoop();
      if (e.key === "ArrowRight") lbNextLoop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, count]);

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
                  setLbTransitionEnabled(false);
                  setLbVIndex(idx + 1);
                  requestAnimationFrame(() => requestAnimationFrame(() => setLbTransitionEnabled(true)));
                  setLightboxOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLbTransitionEnabled(false);
                    setLbVIndex(idx + 1);
                    requestAnimationFrame(() => requestAnimationFrame(() => setLbTransitionEnabled(true)));
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
                  ref={(el) => {
                    if (el && el.complete) markLoaded(it.id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        className={`lightbox${lightboxOpen ? " open" : ""}`}
        style={{
          display: lightboxOpen ? "flex" : "none",
          position: "fixed",
          inset: 0,
          zIndex: 99999,
        }}
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

        <button className="lightbox-arrow lightbox-arrow-left party-desktop-only" type="button" onClick={lbPrevLoop}>
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
            if (lbDeltaX > threshold) lbPrevLoop();
            else if (lbDeltaX < -threshold) lbNextLoop();
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
            onTransitionEnd={onLbTransitionEnd}
            style={{
              transform: `translateX(calc(${-lbVIndex * 100}% + ${lbDeltaX}px))`,
              transition: lbTransitionEnabled && !lbDragging ? undefined : "none",
            }}
          >
            {lbLoopImages.map((it, i) => (
              <div className="lightbox-slide" key={`lb-${it.id}-${i}`}>
                <div className="carousel-img carousel-img-lightbox">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.signedUrl} alt={it.name || "Foto"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="lightbox-arrow lightbox-arrow-right party-desktop-only" type="button" onClick={lbNextLoop}>
          ›
        </button>
      </div>
    </main>
  );
}

