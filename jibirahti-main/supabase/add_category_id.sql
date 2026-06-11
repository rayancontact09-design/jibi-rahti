-- Run this in the Supabase SQL editor

-- 1. Create the categories table (if not already created)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  budget DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'own'
  ) THEN
    CREATE POLICY "own" ON public.categories
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Add category_id column to expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Backfill: match by exact category name (for expenses already using the new name format)
UPDATE public.expenses e
SET category_id = c.id
FROM public.categories c
WHERE e.user_id = c.user_id
  AND e.category = c.name
  AND e.category_id IS NULL;

-- 4. Backfill: map legacy English enum values to French category names
UPDATE public.expenses e
SET category_id = c.id
FROM public.categories c
WHERE e.user_id = c.user_id
  AND e.category_id IS NULL
  AND c.name = CASE e.category
    WHEN 'food'      THEN 'Nourriture'
    WHEN 'transport' THEN 'Transport'
    WHEN 'bills'     THEN 'Factures'
    WHEN 'other'     THEN 'Autre'
    ELSE NULL
  END;
