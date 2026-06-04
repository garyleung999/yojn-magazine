-- Add image_urls array column to stores table
-- This enables multi-image upload support for store submissions
-- The first image in the array serves as the primary/hero image

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Note: banner_url column is preserved for backward compatibility
-- New functionality uses image_urls exclusively
