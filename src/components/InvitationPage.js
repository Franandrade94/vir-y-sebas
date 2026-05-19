"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { submitRsvp } from "@/app/actions/rsvp-actions";
import { AiFillHeart } from "react-icons/ai";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  CALENDAR_ICS_PATH,
  getCalendarIcsUrl,
  getGoogleCalendarUrl,
  VENUE_MAPS_URL,
} from "@/lib/event-links";
import ClipLoader from "react-spinners/ClipLoader";
import { INPUT_LETRAS_PATTERN } from "@/lib/rsvp-helpers";
import SiteFooter from "@/components/SiteFooter";

const TARGET_ISO = "2026-10-03T18:00:00-03:00";
const GOOGLE_CALENDAR_ADD_URL = getGoogleCalendarUrl();

const GALLERY_IMAGES_FALLBACK = [];


function pad2(n) {
  return String(n).padStart(2, "0");
}

function getCountdownParts(targetMs, nowMs) {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, done: diff <= 0 };
}

function GalleryCarousel({ images }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(4);
  const [loaded, setLoaded] = useState(() => new Set());

  // Carousel (loop) state
  const [vIndex, setVIndex] = useState(0); // virtual index (includes clones)
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDeltaX, setDragDeltaX] = useState(0);

  // Lightbox state
  const [lbIndex, setLbIndex] = useState(0);
  const [lbVIndex, setLbVIndex] = useState(1);
  const [lbTransitionEnabled, setLbTransitionEnabled] = useState(true);
  const [lbDragging, setLbDragging] = useState(false);
  const [lbStartX, setLbStartX] = useState(0);
  const [lbDeltaX, setLbDeltaX] = useState(0);

  const count = images.length;

  useEffect(() => {
    // al cambiar la lista de imágenes, reiniciamos el estado de carga
    setLoaded(new Set());
  }, [images]);

  const markLoaded = (src) =>
    setLoaded((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w <= 600) setSlidesPerView(1);
      else if (w <= 1024) setSlidesPerView(2);
      else setSlidesPerView(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const realIndexFromV = (vi) => ((vi - slidesPerView) % count + count) % count;
  const realIndex = realIndexFromV(vIndex);

  // Build clones for infinite loop (depends on slidesPerView)
  const loopImages = useMemo(() => {
    const spv = Math.min(slidesPerView, count);
    const head = images.slice(0, spv);
    const tail = images.slice(-spv);
    return [...tail, ...images, ...head];
  }, [count, images, slidesPerView]);

  // Keep virtual index aligned when slidesPerView changes
  useEffect(() => {
    const spv = Math.min(slidesPerView, count);
    setTransitionEnabled(false);
    setVIndex(spv + ((lbIndex % count) + count) % count);
    // Re-enable transition next frame (after the jump)
    const id = requestAnimationFrame(() => setTransitionEnabled(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesPerView]);

  // Initialize indices once we know slidesPerView
  useEffect(() => {
    const spv = Math.min(slidesPerView, count);
    setVIndex(spv);
    setLbIndex(0);
  }, [count, slidesPerView]);

  const goToReal = (ri) => {
    const spv = Math.min(slidesPerView, count);
    const n = ((ri % count) + count) % count;
    setVIndex(spv + n);
    setLbIndex(n);
    setLbVIndex(n + 1);
  };

  const carouselPrev = () => setVIndex((i) => i - 1);
  const carouselNext = () => setVIndex((i) => i + 1);

  const lbLoopImages = useMemo(() => {
    if (count === 0) return [];
    return [images[count - 1], ...images, images[0]];
  }, [count, images]);

  const lbRealFromV = (vi) => {
    if (count === 0) return 0;
    if (vi <= 0) return count - 1; // clone final
    if (vi >= count + 1) return 0; // clone inicial
    return vi - 1;
  };

  const onLbTransitionEnd = () => {
    // 0 = clone final, count+1 = clone inicial
    if (lbVIndex === 0) {
      setLbTransitionEnabled(false);
      setLbVIndex(count);
      setLbIndex(count - 1);
      requestAnimationFrame(() => requestAnimationFrame(() => setLbTransitionEnabled(true)));
    } else if (lbVIndex === count + 1) {
      setLbTransitionEnabled(false);
      setLbVIndex(1);
      setLbIndex(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setLbTransitionEnabled(true)));
    }
  };

  const lbPrevLoop = () => {
    setLbVIndex((i) => i - 1);
  };
  const lbNextLoop = () => {
    setLbVIndex((i) => i + 1);
  };

  useEffect(() => {
    if (lightboxOpen) return;
    const id = setInterval(() => {
      setVIndex((i) => i + 1);
    }, 4500);
    return () => clearInterval(id);
  }, [count, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.classList.add("no-scroll");
    const onKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") lbPrevLoop();
      if (e.key === "ArrowRight") lbNextLoop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const onPointerDown = (e) => {
    // En desktop dejamos click libre (swipe solo en touch)
    if (e.pointerType === "mouse") return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragDeltaX(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    setDragDeltaX(e.clientX - dragStartX);
  };
  const onPointerUp = () => {
    if (!isDragging) return;
    const threshold = 40;
    if (dragDeltaX > threshold) carouselPrev();
    else if (dragDeltaX < -threshold) carouselNext();
    setIsDragging(false);
    setDragDeltaX(0);
  };

  const onTrackTransitionEnd = () => {
    const spv = Math.min(slidesPerView, count);
    const firstReal = spv;
    const lastReal = spv + count - 1;
    if (vIndex < firstReal) {
      setTransitionEnabled(false);
      setVIndex(lastReal);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransitionEnabled(true)));
    } else if (vIndex > lastReal) {
      setTransitionEnabled(false);
      setVIndex(firstReal);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransitionEnabled(true)));
    }
  };

  const slidePct = 100 / Math.min(slidesPerView, count);
  const trackStyle = {
    transform: `translateX(calc(${-vIndex * slidePct}% + ${dragDeltaX}px))`,
    transition: transitionEnabled && !isDragging ? undefined : "none",
  };

  return (
    <>
      <div className="carousel" style={{ "--spv": slidesPerView }}>
        <button
          className="carousel-arrow carousel-arrow-left"
          type="button"
          onClick={carouselPrev}
        >
          ‹
        </button>

        <div
          className="carousel-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="carousel-track" style={trackStyle} onTransitionEnd={onTrackTransitionEnd}>
            {loopImages.map((img, i) => (
              <button
                key={`${img.src}-${i}`}
                className="carousel-slide"
                type="button"
                onClick={() => {
                  const spv = Math.min(slidesPerView, count);
                  const ri = ((i - spv) % count + count) % count;
                  goToReal(ri);
                  setLightboxOpen(true);
                }}
                aria-label="Abrir foto"
              >
                <div className="carousel-img">
                  {!loaded.has(img.src) ? (
                    <span className="carousel-spinner" aria-hidden>
                      <ClipLoader color="var(--gold)" size={22} />
                    </span>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    onLoad={() => markLoaded(img.src)}
                    onError={() => markLoaded(img.src)}
                    ref={(el) => {
                      if (el && el.complete) markLoaded(img.src);
                    }}
                  />
                  <div className="carousel-caption" aria-hidden>
                    <span className="carousel-caption-text">{img.name || img.alt}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          className="carousel-arrow carousel-arrow-right"
          type="button"
          onClick={carouselNext}
        >
          ›
        </button>
      </div>

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

        <button
          className="lightbox-arrow lightbox-arrow-left"
          type="button"
          onClick={lbPrevLoop}
        >
          ‹
        </button>

        <div
          className="lightbox-viewport"
          onClick={(e) => {
            // Si tocás/clickeás fuera de la imagen (fondo/espacios), cerramos.
            // Muchos contenedores del lightbox quedan por encima del backdrop, así que lo manejamos acá.
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
            {lbLoopImages.map((img, i) => (
              <div className="lightbox-slide" key={`lb-${img.src}-${i}`}>
                <div className="carousel-img carousel-img-lightbox">
                  {!loaded.has(img.src) ? (
                    <span className="carousel-spinner" aria-hidden>
                      <ClipLoader color="var(--gold)" size={26} />
                    </span>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    onLoad={() => markLoaded(img.src)}
                    onError={() => markLoaded(img.src)}
                    ref={(el) => {
                      if (el && el.complete) markLoaded(img.src);
                    }}
                  />
                  <div className="carousel-caption" aria-hidden>
                    <span className="carousel-caption-text">{img.name || img.alt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="lightbox-arrow lightbox-arrow-right"
          type="button"
          onClick={lbNextLoop}
        >
          ›
        </button>
      </div>
    </>
  );
}

export default function InvitationPage({ sinInvitados = false }) {
  const targetMs = useMemo(() => new Date(TARGET_ISO).getTime(), []);
  const [countdown, setCountdown] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    const tick = () => setCountdown(getCountdownParts(targetMs, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadGallery() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("gallery_images")
          .select("name,url")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) {
          setGalleryImages([]);
          setGalleryLoading(false);
          return;
        }
        const imgs = (data || [])
          .filter((r) => r?.url)
          .map((r) => ({
            src: r.url,
            alt: r.name || "Foto",
            name: r.name || "",
          }));

        setGalleryImages(imgs);
        setGalleryLoading(false);
      } catch {
        if (!cancelled) {
          setGalleryImages([]);
          setGalleryLoading(false);
        }
      }
    }
    loadGallery();
    return () => {
      cancelled = true;
    };
  }, []);

  const [rsvpPending, setRsvpPending] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);
  const [calendarIcsUrl, setCalendarIcsUrl] = useState(CALENDAR_ICS_PATH);
  const [vaAcompanado, setVaAcompanado] = useState("");
  const [restriccionTipo, setRestriccionTipo] = useState("");
  const rsvpFormRef = useRef(null);

  useEffect(() => {
    setCalendarIcsUrl(getCalendarIcsUrl(window.location.origin));
  }, []);

  useEffect(() => {
    const onPageShow = (event) => {
      if (event.persisted) {
        setSubmitted(false);
        setEmailNotice(null);
        setVaAcompanado("");
        setRestriccionTipo("");
        rsvpFormRef.current?.reset();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const formEl = rsvpFormRef.current;
    if (!formEl) return;
    const formData = new FormData(formEl);
    const nombre = String(formData.get("nombre") || "").trim();
    const apellido = String(formData.get("apellido") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const acompanado = formData.get("acompanado");
    const necesita_transporte = formData.get("necesita_transporte");
    const necesita_hospedaje = formData.get("necesita_hospedaje");

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nombre || !soloLetras.test(nombre)) {
      alert("El nombre solo puede incluir letras (y espacio o guión si hace falta).");
      return;
    }
    if (!apellido || !soloLetras.test(apellido)) {
      alert("El apellido solo puede incluir letras (y espacio o guión si hace falta).");
      return;
    }
    if (!email || !emailOk) {
      alert("Ingresá un correo electrónico válido.");
      return;
    }
    if (!sinInvitados && !acompanado) {
      alert("Indicá si vas acompañado o no.");
      return;
    }
    if (sinInvitados) {
      formData.set("rsvp_variant", "sin_invitados");
      formData.set("acompanado", "no");
    }
    if (!necesita_transporte) {
      alert("Indicá si necesitás transporte.");
      return;
    }
    if (!necesita_hospedaje) {
      alert("Indicá si necesitás hospedaje.");
      return;
    }
    const restriccionTipoVal = String(formData.get("restriccion_tipo") || "").trim();
    const restriccionOtro = String(formData.get("restriccion_otro") || "").trim();
    if (restriccionTipoVal === "otro" && !restriccionOtro) {
      alert("Completá la restricción alimentaria.");
      return;
    }
    if (!sinInvitados && acompanado === "si") {
      const aNom = String(formData.get("acompanante_nombre") || "").trim();
      const aApe = String(formData.get("acompanante_apellido") || "").trim();
      if (!aNom || !soloLetras.test(aNom)) {
        alert("Revisá el nombre del acompañante (solo letras).");
        return;
      }
      if (!aApe || !soloLetras.test(aApe)) {
        alert("Revisá el apellido del acompañante (solo letras).");
        return;
      }
    }
    setRsvpPending(true);
    setEmailNotice(null);
    const result = await submitRsvp(formData);
    setRsvpPending(false);
    if (!result.ok) {
      alert(result.error || "No se pudo enviar. Probá de nuevo.");
      return;
    }

    formEl.reset();
    setVaAcompanado("");
    setRestriccionTipo("");
    setEmailNotice(
      result.emailSent
        ? null
        : result.emailError ||
            "Guardamos tu confirmación, pero no pudimos enviar el correo. Revisá la carpeta de spam o escribinos."
    );
    setSubmitted(true);
  }

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" id="inicio">
        <p className="hero-eyebrow">nos casamos</p>
        <div className="hero-stack">
          <div className="hero-names">Vir</div>
          <div className="hero-ampersand">&</div>
          <div className="hero-names">
            <span>Seba</span>
          </div>
        </div>
        <div className="hero-divider" />
        <p className="hero-tagline">
          Dicen que lo bueno se hace esperar.
          <br />
          Diez años después, llegó el momento.
        </p>
      </section>

      {/* ── DATE & VENUE ── */}
      <section className="inv-section fade-in" id="cuando-donde">
        <p className="section-label">Cuándo y dónde</p>
        <div className="date-block">
          <div className="date-day">03</div>
          <div className="date-month">octubre</div>
          <div className="date-year">2026</div>
          <div className="date-time">Sabado · 18:00hs</div>
        </div>
        <div
          className="calendar-add-links"
          role="group"
          aria-label="Agregar al calendario"
        >
          <a
            className="btn btn-calendar"
            href={GOOGLE_CALENDAR_ADD_URL}
            target="_blank"
            rel="noreferrer"
          >
            Agendar con Google
          </a>
          <a
            className="btn btn-calendar"
            href={calendarIcsUrl}
          >
            Agendar con iPhone
          </a>
        </div>
        <div className="ornament">✦</div>
        <div className="venue-name">La Herencia</div>
        <div className="venue-address">
          Saravi 1799
          <br />
          La Lonja, Pilar · Buenos Aires
        </div>
        <a
          href={VENUE_MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="btn"
        >
          Cómo llegar
        </a>
      </section>

      {/* ── DRESS CODE ── */}
      <div className="dress-section fade-in" id="dress-code">
        <div className="dress-inner">
          <p className="section-label">Dress code</p>
          <div className="dress-word">Formal</div>
          <div className="dress-divider" />
        </div>
      </div>

      {/* ── COUNTDOWN ── */}
      <div className="countdown-section fade-in" id="countdown">
        <div className="countdown-inner">
          <p className="section-label">Faltan solo</p>
          <div className="countdown-grid">
            <div className="countdown-item">
              <div className="countdown-num">
                {countdown ? pad2(countdown.days) : "—"}
              </div>
              <div className="countdown-label">Días</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-num">
                {countdown ? pad2(countdown.hours) : "—"}
              </div>
              <div className="countdown-label">Horas</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-num">
                {countdown ? pad2(countdown.mins) : "—"}
              </div>
              <div className="countdown-label">Minutos</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-num">
                {countdown ? pad2(countdown.secs) : "—"}
              </div>
              <div className="countdown-label">Segundos</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RSVP ── */}
      <div className="rsvp-section fade-in" id="rsvp">
        <div className="rsvp-inner">
          <h2 className="section-title">
            Confirmar <em>asistencia</em>
          </h2>
          {!submitted && (
            <p className="rsvp-subtitle">
              <strong className="rsvp-please">Por favor confirma asistencia</strong>
              <br />
              Estaremos felices de compartir con vos este día.
              <br />
              ¡Te esperamos!
            </p>
          )}

          {!submitted ? (
            <form ref={rsvpFormRef} onSubmit={onSubmit} className="rsvp-form">
              {sinInvitados ? (
                <input type="hidden" name="rsvp_variant" value="sin_invitados" />
              ) : null}
              {sinInvitados ? <input type="hidden" name="acompanado" value="no" /> : null}
              <div className="form-grid">
                <div className="form-field">
                  <input
                    name="nombre"
                    type="text"
                    placeholder="Nombre *"
                    required
                    autoComplete="given-name"
                    inputMode="text"
                    pattern={INPUT_LETRAS_PATTERN}
                    title="Solo letras"
                  />
                </div>
                <div className="form-field">
                  <input
                    name="apellido"
                    type="text"
                    placeholder="Apellido *"
                    required
                    autoComplete="family-name"
                    inputMode="text"
                    pattern={INPUT_LETRAS_PATTERN}
                    title="Solo letras"
                  />
                </div>
                <div className="form-field form-full">
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email *"
                    required
                  />
                </div>
                {!sinInvitados ? (
                  <div className="form-radio-group form-full">
                    <span className="form-radio-legend">¿Voy acompañado?</span>
                    <div className="form-radio-options">
                      <label className="form-radio-option">
                        <input
                          type="radio"
                          name="acompanado"
                          value="si"
                          required
                          checked={vaAcompanado === "si"}
                          onChange={() => setVaAcompanado("si")}
                        />
                        <span>Sí</span>
                      </label>
                      <label className="form-radio-option">
                        <input
                          type="radio"
                          name="acompanado"
                          value="no"
                          checked={vaAcompanado === "no"}
                          onChange={() => setVaAcompanado("no")}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                ) : null}
                {!sinInvitados && vaAcompanado === "si" ? (
                  <div className="form-companion form-full">
                    <p className="form-companion-legend">Datos del acompañante</p>
                    <div className="form-companion-grid">
                      <div className="form-field">
                        <input
                          name="acompanante_nombre"
                          type="text"
                          placeholder="Nombre del acompañante *"
                          required
                          inputMode="text"
                          pattern={INPUT_LETRAS_PATTERN}
                          title="Solo letras"
                        />
                      </div>
                      <div className="form-field">
                        <input
                          name="acompanante_apellido"
                          type="text"
                          placeholder="Apellido del acompañante *"
                          required
                          inputMode="text"
                          pattern={INPUT_LETRAS_PATTERN}
                          title="Solo letras"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="form-radio-group form-full">
                  <span className="form-radio-legend">¿Necesitás transporte?</span>
                  <div className="form-radio-options">
                    <label className="form-radio-option">
                      <input
                        type="radio"
                        name="necesita_transporte"
                        value="si"
                        required
                      />
                      <span>Sí</span>
                    </label>
                    <label className="form-radio-option">
                      <input type="radio" name="necesita_transporte" value="no" />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div className="form-radio-group form-full">
                  <span className="form-radio-legend">¿Necesitás hospedaje?</span>
                  <div className="form-radio-options">
                    <label className="form-radio-option">
                      <input
                        type="radio"
                        name="necesita_hospedaje"
                        value="si"
                        required
                      />
                      <span>Sí</span>
                    </label>
                    <label className="form-radio-option">
                      <input type="radio" name="necesita_hospedaje" value="no" />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div className="form-field form-full">
                  <select
                    name="restriccion_tipo"
                    value={restriccionTipo}
                    onChange={(e) => setRestriccionTipo(e.target.value)}
                    className="form-select"
                    aria-label="Restricciones alimentarias"
                  >
                    <option value="">Restricciones alimentarias</option>
                    <option value="no">No</option>
                    <option value="vegano">Vegano</option>
                    <option value="vegetariano">Vegetariano</option>
                    <option value="celiaco">Celiaco</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {restriccionTipo === "otro" ? (
                  <div className="form-field form-full">
                    <input
                      name="restriccion_otro"
                      type="text"
                      placeholder="Especificá la restricción *"
                      required
                    />
                  </div>
                ) : null}
              </div>
              <button className="btn-submit" type="submit" disabled={rsvpPending}>
                {rsvpPending ? "Enviando…" : "Enviar confirmación"}
              </button>
            </form>
          ) : (
            <div className="form-success" style={{ display: "block" }}>
              <p className="form-success-title">
                ¡Gracias! Tu confirmación fue enviada{" "}
                <AiFillHeart className="form-success-heart" aria-hidden />
              </p>
              <p className="form-success-email">
                En breve te va a estar llegando un correo con toda la información.
              </p>
              {emailNotice ? (
                <p className="form-success-warn" role="status">
                  {emailNotice}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ── GALLERY ── */}
      <div className="gallery-section fade-in" id="galeria">
        <h2 className="gallery-title">✦ &nbsp; Nosotros &nbsp; ✦</h2>
        {galleryLoading ? (
          <div className="party-loading" aria-hidden>
            <ClipLoader color="var(--gold)" size={34} />
          </div>
        ) : galleryImages.length ? (
          <GalleryCarousel images={galleryImages} />
        ) : null}
      </div>

      {/* ── GIFT ── */}
      <div className="gift-section fade-in" id="regalos">
        <div className="gift-inner">
          <div className="section-label gift-label" aria-label="Regalos" title="Regalos">
            <svg
              className="gift-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 12v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 7H2v5h20V7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22V7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7H7.5a2.5 2.5 0 1 1 0-5C10 2 12 7 12 7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7h4.5a2.5 2.5 0 1 0 0-5C14 2 12 7 12 7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="gift-text">
            Nuestro mejor regalo es tu presencia, pero si querés, podés colaborar con
            nuestros proyectos.
          </p>
          <button className="btn-light" type="button" onClick={() => setGiftOpen(true)}>
            Ver datos
          </button>
          <p className="gift-thanks">¡ Gracias !</p>
        </div>
        <SiteFooter />
      </div>

      {/* ── MODAL REGALO ── */}
      <div
        className={`modal-overlay${giftOpen ? " open" : ""}`}
        id="gift-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget) setGiftOpen(false);
        }}
      >
        <div className="modal">
          <button className="modal-close" type="button" onClick={() => setGiftOpen(false)}>
            ✕
          </button>
          <h3>Datos de regalo</h3>
          <div className="modal-account">
            <p className="modal-account-title">Cuenta USD</p>
            <p>
              <strong>CBU:</strong> 0070363331004012024319
            </p>
            <p>
              <strong>Alias:</strong> VirySebi.USD
            </p>
            <p>
              <strong>Nombre:</strong> Virginia Prieto
            </p>
          </div>
          <div className="modal-account">
            <p className="modal-account-title">Cuenta pesos</p>
            <p>
              <strong>Alias:</strong> virysebi.pesos
            </p>
            <p>
              <strong>CVU:</strong> 0000003100063745490570
            </p>
            <p>
              <strong>Nombre:</strong> Sebastian Sabio Alcaraz
            </p>
          </div>
          <p className="modal-thanks">¡Gracias por tu gesto!</p>
        </div>
    </div>
    </>
  );
}
