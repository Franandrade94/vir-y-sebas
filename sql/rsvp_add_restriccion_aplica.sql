-- Ejecutar en Supabase → SQL Editor si la tabla rsvp_responses ya existe

ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS restriccion_aplica text;

ALTER TABLE public.rsvp_responses
  DROP CONSTRAINT IF EXISTS rsvp_responses_restriccion_aplica_check;

ALTER TABLE public.rsvp_responses
  ADD CONSTRAINT rsvp_responses_restriccion_aplica_check
  CHECK (
    restriccion_aplica IS NULL
    OR restriccion_aplica IN ('ambos', 'yo', 'invitado')
  );

COMMENT ON COLUMN public.rsvp_responses.restriccion_aplica IS
  'Para quién aplica la restricción: ambos (los dos), yo, invitado (acompañante).';
