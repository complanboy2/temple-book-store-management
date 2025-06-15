
-- Fix infinite recursion in users table by creating a security definer function
-- and updating RLS policies

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow users to read all users" ON public.users;

-- Create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Direct query without recursion
  RETURN (SELECT role FROM public.users WHERE email = auth.jwt() ->> 'email' LIMIT 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'personnel';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new safe RLS policies for users table
CREATE POLICY "Users can view own data and admins can view all"
ON public.users FOR SELECT
USING (
  email = (auth.jwt() ->> 'email') OR 
  public.is_current_user_admin()
);

CREATE POLICY "Users can update own data and admins can update all"
ON public.users FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email') OR 
  public.is_current_user_admin()
);

CREATE POLICY "Admins can insert users"
ON public.users FOR INSERT
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
USING (public.is_current_user_admin());
