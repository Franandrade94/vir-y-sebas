"use client";

import { useEffect, useMemo, useState } from "react";

const TARGET_ISO = "2026-10-03T18:00:00-03:00";
const GALLERY_IMAGES = [
  {
    src: "https://static.wixstatic.com/media/142a7c_195f727fcf1c4d728b0a13d31ef864b6~mv2.jpeg/v1/fit/w_600,h_800,q_90,enc_avif,quality_auto/142a7c_195f727fcf1c4d728b0a13d31ef864b6~mv2.jpeg",
    alt: "Vir y Sebas",
  },
  {
    src: "https://static.wixstatic.com/media/142a7c_896ca15ba7ef4b80b96fd2321621a917~mv2.jpeg/v1/fit/w_600,h_800,q_90,enc_avif,quality_auto/142a7c_896ca15ba7ef4b80b96fd2321621a917~mv2.jpeg",
    alt: "Vir y Sebas",
  },
  {
    src: "https://static.wixstatic.com/media/142a7c_e88469e6b9fb401ab91f03746ef7d944~mv2.jpeg/v1/fit/w_700,h_800,q_90,enc_avif,quality_auto/142a7c_e88469e6b9fb401ab91f03746ef7d944~mv2.jpeg",
    alt: "Vir y Sebas",
  },
  {
    src: "https://static.wixstatic.com/media/142a7c_c141da00906d433cbcb8eed60e9f4651~mv2.jpeg/v1/fit/w_800,h_740,q_90,enc_avif,quality_auto/142a7c_c141da00906d433cbcb8eed60e9f4651~mv2.jpeg",
    alt: "Vir y Sebas",
  },
];

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} />
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} />
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

export default function Home() {
  const targetMs = useMemo(() => new Date(TARGET_ISO).getTime(), []);
  const [countdown, setCountdown] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  function onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") || "").trim();
    const apellido = String(formData.get("apellido") || "").trim();
    if (!nombre || !apellido) {
      alert("Por favor completá tu nombre y apellido.");
      return;
    }
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
            <span>Sebas</span>
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
        <div className="ornament">✦</div>
        <div className="venue-name">La Herencia</div>
        <div className="venue-address">
          Saravi 1799
          <br />
          La Lonja, Pilar · Buenos Aires
        </div>
        <a
          href="https://www.google.com/maps/place/La+Herencia+Eventos/@-34.4491502,-58.8428629,17z"
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
          <p className="section-label">R.S.V.P.</p>
          <h2 className="section-title">
            Confirmar <em>asistencia</em>
          </h2>
          <p className="rsvp-subtitle">
            Estaremos felices de compartir con vos este día.
            <br />
            Por favor confirmar asistencia. ¡Te esperamos!
          </p>

          {!submitted ? (
            <form onSubmit={onSubmit} className="rsvp-form">
              <div className="form-grid">
                <div className="form-field">
                  <input name="nombre" type="text" placeholder="Nombre *" required />
                </div>
                <div className="form-field">
                  <input
                    name="apellido"
                    type="text"
                    placeholder="Apellido *"
                    required
                  />
                </div>
                <div className="form-field form-full">
                  <input name="email" type="email" placeholder="Email" />
                </div>
                <div className="form-field form-full">
                  <textarea
                    name="restricciones"
                    placeholder="Restricciones alimentarias"
                  />
                </div>
              </div>
              <button className="btn-submit" type="submit">
                Enviar confirmación
              </button>
            </form>
          ) : (
            <div className="form-success" style={{ display: "block" }}>
              ¡Gracias! Tu confirmación fue recibida con alegría 🤍
            </div>
          )}
        </div>
      </div>

      {/* ── GALLERY ── */}
      <div className="gallery-section fade-in" id="galeria">
        <h2 className="gallery-title">✦ &nbsp; Nosotros &nbsp; ✦</h2>
        <GalleryCarousel images={GALLERY_IMAGES} />
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
            Ver datos de regalo
          </button>
          <p className="gift-thanks">¡ Gracias !</p>
        </div>
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
          <p>Transferencia bancaria</p>
          <p>
            <strong>CBU:</strong> A completar por los novios
          </p>
          <p>
            <strong>Alias:</strong> A completar por los novios
          </p>
          <p style={{ marginTop: 16, fontSize: "0.95rem" }}>¡Gracias por tu gesto!</p>
        </div>
      </div>
    </>
  );
}
