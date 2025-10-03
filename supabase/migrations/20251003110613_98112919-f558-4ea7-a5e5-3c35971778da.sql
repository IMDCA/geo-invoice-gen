-- Add expense_type column to invoices
ALTER TABLE public.invoices 
ADD COLUMN expense_type TEXT CHECK (expense_type IN ('leasing', 'marketing'));

-- Update items structure comment for clarity
COMMENT ON COLUMN public.invoices.items IS 'For leasing: {property_address, lease_period, monthly_rent, area_sqm}. For marketing: {campaign_name, service_type, duration, rate}';