-- Step 1: Find the trigger function name.
-- Run this first and note the function_name value.
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Replace the trigger function body to use 7 days instead of 48 hours.
--
-- The function name below is the most common Supabase default.
-- If Step 1 shows a different name, replace "handle_new_user" accordingly.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, account_status, trial_started_at, trial_expires_at)
  VALUES (
    NEW.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
