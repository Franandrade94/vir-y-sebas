-- Si ya ejecutaste rsvp_add_acompanante_restricciones.sql, corré solo esto en Supabase
ALTER TABLE public.rsvp_responses
  DROP CONSTRAINT IF EXISTS rsvp_responses_restriccion_tipo_check;

ALTER TABLE public.rsvp_responses
  ADD CONSTRAINT rsvp_responses_restriccion_tipo_check
  CHECK (
    restriccion_tipo IS NULL
    OR restriccion_tipo IN ('no', 'vegano', 'vegetariano', 'celiaco', 'otro')
  );
