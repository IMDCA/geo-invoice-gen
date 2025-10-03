import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@supabase/supabase-js";
import { FileText, LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">ინვოისების სისტემა</h1>
            <p className="text-muted-foreground mt-2">
              მოგესალმებით, {session.user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            გასვლა
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-primary mb-4" />
              <CardTitle>API დოკუმენტაცია</CardTitle>
              <CardDescription>
                გამოიყენეთ API ინვოისების გენერაციისთვის
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold mb-2">API Endpoint:</p>
                  <code className="block p-2 bg-muted rounded text-xs overflow-x-auto">
                    {import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice
                  </code>
                </div>
                
                <div>
                  <p className="font-semibold mb-2">მაგალითი (JSON):</p>
                  <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
{`{
  "user_id": "user-uuid",
  "invoice_number": "INV-001",
  "client_name": "კომპანია ხხხ",
  "client_address": "თბილისი, საქართველო",
  "client_tax_id": "123456789",
  "items": [
    {
      "description": "პროდუქტი 1",
      "quantity": 2,
      "unit_price": 100.50
    }
  ],
  "tax": 18,
  "notes": "შენიშვნები...",
  "expire_hours": 48
}`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold mb-2">თქვენი User ID:</p>
                  <code className="block p-2 bg-muted rounded text-xs overflow-x-auto break-all">
                    {session.user.id}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>ინვოისის პარამეტრები</CardTitle>
              <CardDescription>
                სავალდებულო და არასავალდებულო ველები
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-primary">სავალდებულო:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                    <li>user_id</li>
                    <li>invoice_number</li>
                    <li>client_name</li>
                    <li>items (მასივი)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">არასავალდებულო:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                    <li>client_address</li>
                    <li>client_tax_id</li>
                    <li>tax (პროცენტში)</li>
                    <li>notes</li>
                    <li>issue_date</li>
                    <li>due_date</li>
                    <li>expire_hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>პასუხი</CardTitle>
              <CardDescription>
                წარმატებული გენერაციის შემთხვევაში
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "invoice_id": "uuid",
  "invoice_url": "link",
  "expires_at": "timestamp"
}`}
              </pre>
              <p className="mt-4 text-sm text-muted-foreground">
                ინვოისის ბმული იქნება უნიკალური და ხელმისაწვდომი მითითებულ ვადამდე.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;