-- Add is_overdue column to invoices table
ALTER TABLE public.invoices
ADD COLUMN is_overdue boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.invoices.is_overdue IS 'Indicates if the invoice is overdue and should display warning labels';