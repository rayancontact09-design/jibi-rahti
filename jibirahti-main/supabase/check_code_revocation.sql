-- Run this in the Supabase SQL editor.
-- Returns true if the user's most recently redeemed activation code is revoked.
-- Returns false if the user has no redemption (trial users are unaffected).
CREATE OR REPLACE FUNCTION check_code_revocation(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ac.is_revoked
      FROM code_redemptions cr
      JOIN activation_codes ac ON ac.id = cr.code_id
      WHERE cr.user_id = p_user_id
      ORDER BY cr.redeemed_at DESC
      LIMIT 1
    ),
    false
  );
$$;
