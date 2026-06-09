-- Add price_menu JSONB column to stores table for storing price menu data
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS price_menu JSONB;
