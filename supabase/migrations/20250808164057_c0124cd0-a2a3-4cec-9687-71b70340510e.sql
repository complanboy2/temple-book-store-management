-- Relax RLS to allow public management of activities and user_metadata
-- Note: We drop restrictive admin-only policies and add permissive ones.

-- Activities
DROP POLICY IF EXISTS "Admins can manage activities" ON public.activities;

-- Ensure SELECT remains open (keep existing or create if missing)
CREATE POLICY IF NOT EXISTS "Public can view activities"
ON public.activities
FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert activities"
ON public.activities
AS PERMISSIVE
FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can update activities"
ON public.activities
AS PERMISSIVE
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can delete activities"
ON public.activities
AS PERMISSIVE
FOR DELETE
USING (true);


-- User Metadata
DROP POLICY IF EXISTS "Admins can manage user metadata" ON public.user_metadata;

-- Keep SELECT open (create if not present)
CREATE POLICY IF NOT EXISTS "Public can view user metadata"
ON public.user_metadata
FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert user metadata"
ON public.user_metadata
AS PERMISSIVE
FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can update user metadata"
ON public.user_metadata
AS PERMISSIVE
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can delete user metadata"
ON public.user_metadata
AS PERMISSIVE
FOR DELETE
USING (true);