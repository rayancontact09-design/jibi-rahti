-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.additional_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  income_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.additional_income ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'additional_income' AND policyname = 'own'
  ) THEN
    CREATE POLICY "own" ON public.additional_income
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
