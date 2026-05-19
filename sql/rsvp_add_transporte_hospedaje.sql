-- Ejecutar en Supabase → SQL Editor si la tabla rsvp_responses ya existe
ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS necesita_transporte text CHECK (necesita_transporte IN ('si', 'no')),
  ADD COLUMN IF NOT EXISTS necesita_hospedaje text CHECK (necesita_hospedaje IN ('si', 'no'));

-- Filas previas: valor por defecto antes de NOT NULL
UPDATE public.rsvp_responses
SET
  necesita_transporte = COALESCE(necesita_transporte, 'no'),
  necesita_hospedaje = COALESCE(necesita_hospedaje, 'no')
WHERE necesita_transporte IS NULL OR necesita_hospedaje IS NULL;

ALTER TABLE public.rsvp_responses
  ALTER COLUMN necesita_transporte SET NOT NULL,
  ALTER COLUMN necesita_hospedaje SET NOT NULL;
