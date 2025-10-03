import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      user_id,
      invoice_number,
      expense_type,
      client_name,
      client_address,
      client_tax_id,
      items,
      tax,
      notes,
      issue_date,
      due_date,
      is_overdue = false,
      expire_hours
    } = await req.json();

    console.log('Generating invoice:', { invoice_number, client_name, expense_type });

    // Validate required fields
    if (!user_id || !invoice_number || !expense_type || !client_name || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, invoice_number, expense_type, client_name, items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate expense type
    if (expense_type !== 'leasing' && expense_type !== 'marketing') {
      return new Response(
        JSON.stringify({ error: 'expense_type must be either "leasing" or "marketing"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate totals based on expense type
    let subtotal = 0;
    if (expense_type === 'leasing') {
      subtotal = items.reduce((sum: number, item: any) => {
        return sum + (item.monthly_rent || 0);
      }, 0);
    } else {
      subtotal = items.reduce((sum: number, item: any) => {
        return sum + ((item.duration || 0) * (item.rate || 0));
      }, 0);
    }

    const taxAmount = tax ? (subtotal * tax / 100) : 0;
    const total = subtotal + taxAmount;

    // Calculate expiration time
    let expireAt = null;
    if (expire_hours && expire_hours > 0) {
      expireAt = new Date(Date.now() + expire_hours * 60 * 60 * 1000).toISOString();
    }

    // Insert invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id,
        invoice_number,
        expense_type,
        client_name,
        client_address,
        client_tax_id,
        items,
        subtotal,
        tax: taxAmount,
        total,
        notes,
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        due_date,
        is_overdue,
        expire_at: expireAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invoiceUrl = `${req.headers.get('origin') || supabaseUrl}/invoice/${invoice.id}`;

    console.log('Invoice created successfully:', invoice.id);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoice.id,
        invoice_url: invoiceUrl,
        expires_at: expireAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-invoice function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});