import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface LeasingItem {
  property_address: string;
  lease_period: string;
  monthly_rent: number;
  area_sqm: number;
}

interface MarketingItem {
  campaign_name: string;
  service_type: string;
  duration: number;
  rate: number;
}

type InvoiceItem = LeasingItem | MarketingItem;

interface InvoiceData {
  id: string;
  invoice_number: string;
  client_name: string;
  client_address?: string;
  client_tax_id?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  issue_date: string;
  due_date?: string;
  expire_at?: string;
  expense_type: 'leasing' | 'marketing';
  is_overdue: boolean;
  created_at: string;
}

const Invoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [overdueDays, setOverdueDays] = useState(0);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching invoice:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // Check expiration
      if (data.expire_at && new Date(data.expire_at) < new Date()) {
        setExpired(true);
      }

      // Calculate overdue days if invoice is overdue
      if (data.is_overdue && data.due_date) {
        const dueDate = new Date(data.due_date);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setOverdueDays(diffDays);
      }

      // Transform data to match InvoiceData interface
      const invoiceData: InvoiceData = {
        ...data,
        expense_type: (data.expense_type || 'leasing') as 'leasing' | 'marketing',
        items: Array.isArray(data.items) ? data.items as unknown as InvoiceItem[] : []
      };

      setInvoice(invoiceData);
      setLoading(false);
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">იტვირთება...</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">ინვოისის ვადა გასულია</h1>
          <p className="text-muted-foreground">
            ამ ინვოისის ვადა ამოიწურა და აღარ არის ხელმისაწვდომი.
          </p>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">ინვოისი ვერ მოიძებნა</h1>
          <p className="text-muted-foreground">
            მოთხოვნილი ინვოისი არ არსებობს.
          </p>
        </Card>
      </div>
    );
  }

  // Determine severity level based on overdue days
  const isSeverelyOverdue = overdueDays >= 7;
  const overdueColor = isSeverelyOverdue ? 'destructive' : 'warning';
  const overdueBorderClass = isSeverelyOverdue ? 'border-destructive' : 'border-warning';
  const overdueTextClass = isSeverelyOverdue ? 'text-destructive' : 'text-warning';

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className={`p-8 md:p-12 shadow-lg ${invoice.is_overdue ? `border-2 ${overdueBorderClass}` : ''}`}>
          {/* Overdue Warning Banner */}
          {invoice.is_overdue && (
            <Alert className={`mb-6 ${isSeverelyOverdue ? 'bg-destructive/10 border-destructive' : 'bg-warning/10 border-warning'}`}>
              <AlertTriangle className={`h-5 w-5 ${overdueTextClass}`} />
              <AlertTitle className={`${overdueTextClass} font-bold`}>
                {isSeverelyOverdue ? 'სერიოზულად გადაცდენილი ინვოისი' : 'გადაცდენილი ინვოისი'}
              </AlertTitle>
              <AlertDescription className={overdueTextClass}>
                {isSeverelyOverdue 
                  ? `ამ ინვოისის გადახდის ვადა გასულია ${overdueDays} დღის წინ. გადაუდებელი გადახდა სავალდებულოა!`
                  : 'ამ ინვოისის გადახდის ვადა ამოიწურა. გთხოვთ დაუკავშირდეთ ადმინისტრაციას.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">ინვოისი</h1>
              <p className="text-lg text-muted-foreground">#{invoice.invoice_number}</p>
            </div>
            {invoice.is_overdue && (
              <Badge 
                variant={isSeverelyOverdue ? "destructive" : "default"}
                className={isSeverelyOverdue 
                  ? '' 
                  : 'bg-warning text-warning-foreground hover:bg-warning/90'}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {isSeverelyOverdue ? `${overdueDays} დღე გადაცდენილი` : 'გადაცდენილი'}
              </Badge>
            )}
          </div>

          <Separator className="mb-8" />

          {/* Client Info & Dates */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">მომხმარებელი</h2>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{invoice.client_name}</p>
                {invoice.client_address && (
                  <p className="text-muted-foreground">{invoice.client_address}</p>
                )}
                {invoice.client_tax_id && (
                  <p className="text-sm text-muted-foreground">ს/ნ: {invoice.client_tax_id}</p>
                )}
              </div>
            </div>

            <div className="text-left md:text-right">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">გამოშვების თარიღი: </span>
                  <span className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('ka-GE')}</span>
                </div>
                {invoice.due_date && (
                  <div>
                    <span className="text-sm text-muted-foreground">ვადა: </span>
                    <span className={`font-medium ${invoice.is_overdue ? `${overdueTextClass} font-bold` : ''}`}>
                      {new Date(invoice.due_date).toLocaleDateString('ka-GE')}
                      {invoice.is_overdue && ` ⚠️ (${overdueDays} დღე)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className={`border rounded-lg overflow-hidden ${invoice.is_overdue ? overdueBorderClass : ''}`}>
              {invoice.expense_type === 'leasing' ? (
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">ქონების მისამართი</th>
                      <th className="text-center p-4 font-semibold">იჯარის პერიოდი</th>
                      <th className="text-right p-4 font-semibold">ფართობი (მ²)</th>
                      <th className="text-right p-4 font-semibold">ყოველთვიური ქირა</th>
                      <th className="text-right p-4 font-semibold">ჯამი</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const leasingItem = item as LeasingItem;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-4">{leasingItem.property_address}</td>
                          <td className="text-center p-4">{leasingItem.lease_period}</td>
                          <td className="text-right p-4">{leasingItem.area_sqm} მ²</td>
                          <td className="text-right p-4">{leasingItem.monthly_rent.toFixed(2)} ₾</td>
                          <td className="text-right p-4 font-medium">
                            {leasingItem.monthly_rent.toFixed(2)} ₾
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">კამპანიის სახელი</th>
                      <th className="text-left p-4 font-semibold">სერვისის ტიპი</th>
                      <th className="text-center p-4 font-semibold">ხანგრძლივობა</th>
                      <th className="text-right p-4 font-semibold">ტარიფი</th>
                      <th className="text-right p-4 font-semibold">ჯამი</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const marketingItem = item as MarketingItem;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-4">{marketingItem.campaign_name}</td>
                          <td className="p-4">{marketingItem.service_type}</td>
                          <td className="text-center p-4">{marketingItem.duration}</td>
                          <td className="text-right p-4">{marketingItem.rate.toFixed(2)} ₾</td>
                          <td className="text-right p-4 font-medium">
                            {(marketingItem.duration * marketingItem.rate).toFixed(2)} ₾
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>შუალედური ჯამი:</span>
                <span>{invoice.subtotal.toFixed(2)} ₾</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>დღგ:</span>
                  <span>{invoice.tax.toFixed(2)} ₾</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>სულ:</span>
                <span>{invoice.total.toFixed(2)} ₾</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">შენიშვნები</h3>
              <p className="text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Invoice;