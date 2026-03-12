import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setStep("code");
      toast({ title: "Code sent", description: "Check your email for a 6-digit code." });
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      toast({ title: "Invalid code", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed in", description: "Welcome!" });
      navigate("/");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Code resent", description: "Check your email for a new code." });
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
              {step === "code" ? "Enter your code" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {step === "code"
                ? `We sent a 6-digit code to ${email}`
                : "Enter your email to sign in or create an account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "code" ? (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={loading || otp.length < 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Sign In"}
                </Button>
                <div className="flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" onClick={handleResend} disabled={loading}>
                    Resend code
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setStep("email"); setOtp(""); }}>
                    Different email
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendCode} className="space-y-4">
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
                      Send sign-in code
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
