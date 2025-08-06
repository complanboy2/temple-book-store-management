-- Fix security warnings by setting proper search paths for existing functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Direct query without recursion
  RETURN (SELECT role FROM public.users WHERE email = auth.jwt() ->> 'email' LIMIT 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'personnel';
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN public.get_current_user_role() IN ('admin', 'super_admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_sale_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Restore the book stock when a sale is deleted
  UPDATE public.books 
  SET quantity = quantity + OLD.quantity
  WHERE id = OLD.bookid;
  
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_max_stores_per_admin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM book_stalls WHERE admin_id = NEW.admin_id) >= 10 THEN
    RAISE EXCEPTION 'Admin can create maximum 10 stores';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_default_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Set all other stores of this admin to non-default
    UPDATE book_stalls 
    SET is_default = FALSE 
    WHERE admin_id = NEW.admin_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;