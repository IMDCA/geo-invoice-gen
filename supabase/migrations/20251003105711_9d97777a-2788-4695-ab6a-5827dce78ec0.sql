-- Fix search_path for validation function
DROP TRIGGER IF EXISTS check_invoice_expiration ON public.invoices;
DROP FUNCTION IF EXISTS validate_invoice_expiration();

CREATE OR REPLACE FUNCTION validate_invoice_expiration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expire_at IS NOT NULL AND NEW.expire_at <= now() THEN
    RAISE EXCEPTION 'Expiration time must be in the future';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_invoice_expiration
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice_expiration();

-- Fix search_path for updated_at function
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP FUNCTION IF EXISTS public.update_updated_at();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();