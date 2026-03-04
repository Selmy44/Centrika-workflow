import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();

  const validateEmail = (email: string): boolean => {
    // Company email format: username@centrika.rw
    const centrikaEmailRegex = /^[a-zA-Z0-9._%+-]+@centrika\.rw$/;
    return centrikaEmailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please use your company email (username@centrika.rw)");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPasswordMutation.mutateAsync({
        email,
      });

      setIsSubmitted(true);
      toast.success("Reset instructions sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo/centrikaLogo.png" 
                alt="Centrika Logo" 
                className="h-32 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl text-white">Forgot Password?</CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Check your email for reset instructions"
                : "Enter your company email to receive password reset instructions"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Company Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="username@centrika.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Use your company email in the format: username@centrika.rw
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-md">
                  <p className="text-xs text-blue-200">
                    We'll send you an email with a link to reset your password. The link will expire in 15 minutes.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || !validateEmail(email)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <p className="text-slate-200 mb-2">Check your email!</p>
                  <p className="text-sm text-slate-400 mb-4">
                    We've sent password reset instructions to<br />
                    <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-slate-500 mb-6">
                    The reset link will expire in 15 minutes. If you don't see it, check your spam folder.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    setIsSubmitted(false);
                  }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
                >
                  Try Another Email
                </Button>

                <Button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2"
                >
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Centrika OnePortal Management System</p>
          <p>© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
