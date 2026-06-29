-- Run this in the Supabase SQL editor.
-- Idempotent: safe to run even if the column already exists.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MAD';
