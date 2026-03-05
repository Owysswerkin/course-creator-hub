import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Check your email", description: "We sent you a magic link to sign in." });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <h1 className="text-3xl font-serif text-foreground mb-1">Instructional</h1>
            <CardTitle className="text-xl">
              {sent ? "Check your inbox" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {sent
                ? `We sent a magic link to ${email}`
                : "Enter your email to sign in or create an account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to sign in. You can close this tab.
                </p>
                <Button variant="ghost" onClick={() => setSent(false)} className="text-sm">
                  Use a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
