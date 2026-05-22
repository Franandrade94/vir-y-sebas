-- =============================================================================
-- Ejecutar en Supabase → SQL Editor (todo el script, o por bloques)
-- =============================================================================

-- Hash bcrypt compatible con verify en Node (bcryptjs). Sin vencimiento: una sola fila.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Respuestas del formulario RSVP
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  email text NOT NULL,
  acompanado text NOT NULL CHECK (acompanado IN ('si', 'no')),
  necesita_transporte text NOT NULL CHECK (necesita_transporte IN ('si', 'no')),
  necesita_hospedaje text NOT NULL CHECK (necesita_hospedaje IN ('si', 'no')),
  acompanante_nombre text,
  acompanante_apellido text,
  restriccion_tipo text CHECK (
    restriccion_tipo IS NULL
    OR restriccion_tipo IN ('no', 'vegano', 'vegetariano', 'celiaco', 'otro')
  ),
  restriccion_otro text,
  restriccion_aplica text CHECK (
    restriccion_aplica IS NULL
    OR restriccion_aplica IN ('ambos', 'yo', 'invitado')
  ),
  restricciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rsvp_responses_created_at ON public.rsvp_responses (created_at DESC);

ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;

-- El sitio público inserta con la anon key (solo INSERT).
DROP POLICY IF EXISTS "Permitir insert RSVP público" ON public.rsvp_responses;
CREATE POLICY "Permitir insert RSVP público"
  ON public.rsvp_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Nadie lee por anon (las lecturas del admin usan service_role, ignora RLS).

COMMENT ON TABLE public.rsvp_responses IS 'Confirmaciones de asistencia; orden por created_at DESC.';

-- ---------------------------------------------------------------------------
-- Clave de acceso al panel /admin (una sola fila, sin expiración en DB)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_secret (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  passphrase_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_secret ENABLE ROW LEVEL SECURITY;

-- Sin políticas para anon/authenticated: solo service_role puede leer/escribir.
COMMENT ON TABLE public.admin_secret IS 'Una fila id=1; passphrase_hash = bcrypt (pgcrypto.crypt). Sin TTL.';

-- ---------------------------------------------------------------------------
-- Clave inicial: CAMBIÁ 'TuClaveMuySegura' por tu contraseña real y ejecutá UNA vez.
-- El hash se genera en Postgres (bcrypt); en la app se verifica con bcryptjs.compare.
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_secret (id, passphrase_hash)
VALUES (1, crypt('TuClaveMuySegura', gen_salt('bf')))
ON CONFLICT (id) DO UPDATE SET
  passphrase_hash = EXCLUDED.passphrase_hash,
  updated_at = now();

-- Para cambiar la clave después:
-- UPDATE public.admin_secret SET passphrase_hash = crypt('nueva_clave', gen_salt('bf')), updated_at = now() WHERE id = 1;

-- ---------------------------------------------------------------------------
-- Imágenes del carousel (se suben al bucket y se guardan como URL + name)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_sort_created
  ON public.gallery_images (sort_order ASC, created_at DESC);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Público: solo lectura (para renderizar el carousel desde el cliente)
DROP POLICY IF EXISTS "Permitir select gallery público" ON public.gallery_images;
CREATE POLICY "Permitir select gallery público"
  ON public.gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura: solo service_role (sin políticas para anon/authenticated).
COMMENT ON TABLE public.gallery_images IS 'Fotos del carousel: URL pública y name. Escritura solo service_role.';

-- ---------------------------------------------------------------------------
-- Party / live uploads (bucket privado + tabla de metadata)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.party_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bucket text NOT NULL DEFAULT 'party',
  path text NOT NULL,
  mime text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_party_photos_created_at
  ON public.party_photos (created_at DESC);

ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY;
-- Sin policies públicas: solo service_role (vía API de Next) puede leer/escribir.

COMMENT ON TABLE public.party_photos IS 'Fotos subidas en /party. Archivos en Storage bucket privado; acceso por signed URLs.';
