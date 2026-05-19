-- Ejecutar en Supabase → SQL Editor si la tabla rsvp_responses ya existe

ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS acompanante_nombre text,
  ADD COLUMN IF NOT EXISTS acompanante_apellido text,
  ADD COLUMN IF NOT EXISTS restriccion_tipo text,
  ADD COLUMN IF NOT EXISTS restriccion_otro text;

ALTER TABLE public.rsvp_responses
  DROP CONSTRAINT IF EXISTS rsvp_responses_restriccion_tipo_check;

ALTER TABLE public.rsvp_responses
  ADD CONSTRAINT rsvp_responses_restriccion_tipo_check
  CHECK (
    restriccion_tipo IS NULL
    OR restriccion_tipo IN ('vegano', 'vegetariano', 'celiaco', 'otro')
  );
