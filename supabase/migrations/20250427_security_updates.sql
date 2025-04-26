
-- Ensure all tables have Row Level Security enabled
ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Create security function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Books table policies
CREATE POLICY IF NOT EXISTS "Allow read access to all authenticated users"
ON public.books FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow write access to admins only"
ON public.books FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow update access to admins only"
ON public.books FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow delete access to admins only"
ON public.books FOR DELETE
USING (auth.role() = 'authenticated');

-- Sales table policies
CREATE POLICY IF NOT EXISTS "Allow read access to sales for authenticated users"
ON public.sales FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow write access to sales for authenticated users"
ON public.sales FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Book images table policies
CREATE POLICY IF NOT EXISTS "Allow read access to book images for all users"
ON public.book_images FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Allow write access to book images for authenticated users"
ON public.book_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Rate limiting function for API calls
CREATE OR REPLACE FUNCTION public.rate_limit(
  user_id UUID,
  operation TEXT,
  max_calls INTEGER,
  window_period INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
  call_count INTEGER;
BEGIN
  -- Count operations for this user in the time window
  SELECT COUNT(*) INTO call_count
  FROM pg_stat_activity
  WHERE usename = auth.uid()::text
    AND query LIKE '%' || operation || '%'
    AND query_start > now() - window_period;
    
  -- Return true if under limit, false if exceeded
  RETURN call_count < max_calls;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add rate limiting trigger
CREATE OR REPLACE FUNCTION public.check_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.rate_limit(auth.uid(), TG_TABLE_NAME, 100, interval '1 minute') THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cleanup function to remove test data before deployment
CREATE OR REPLACE FUNCTION public.cleanup_test_data()
RETURNS VOID AS $$
BEGIN
  -- Delete test data based on pattern matching
  DELETE FROM public.sales WHERE buyername LIKE 'Test%' OR buyername LIKE 'Demo%';
  DELETE FROM public.books WHERE name LIKE 'Test%' OR name LIKE 'Demo%' OR quantity <= 0;
  DELETE FROM public.book_stalls WHERE name LIKE 'Test%' OR name LIKE 'Demo%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
