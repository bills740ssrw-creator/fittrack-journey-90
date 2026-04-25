
DO $$ BEGIN
  CREATE TYPE public.sex_type AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_level AS ENUM ('sedentary','light','moderate','very_active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS sex public.sex_type,
  ADD COLUMN IF NOT EXISTS activity_level public.activity_level;
