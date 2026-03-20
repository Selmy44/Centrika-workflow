import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import OtpVerificationPage from "./OtpVerificationPage";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  // const [useOAuth, setUseOAuth] = useState(false); // OAuth - Commented out, no longer needed
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation();
  const devLoginMutation = trpc.auth.devLogin.useMutation();

  // const handleOAuthLogin = () => {
  //   window.location.href = getLoginUrl();
  // }; // OAuth handler - Commented out, no longer needed

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login.mutateAsync({
        email: email,
        password: password,
      });

      if (result.success) {
        toast.success("OTP sent to your email!");
        setCurrentEmail(email);
        setShowOtpPage(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (role: "user" | "admin" | "hr" | "head_of_department" | "head_of_finance" | "ceo_md") => {
    try {
      toast.loading("Signing in...");
      await devLoginMutation.mutateAsync({ role });
      await utils.auth.me.invalidate();
      toast.dismiss();
      toast.success(`Signed in as ${role.replace(/_/g, " ")}!`);
      // Navigate directly instead of reload to avoid flash
      navigate("/");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to sign in");
    }
  };

  return (
    <>
      {showOtpPage ? (
        <OtpVerificationPage 
          email={currentEmail} 
          onBack={() => {
            setShowOtpPage(false);
            setCurrentEmail("");
          }}
        />
      ) : (
        <div className="min-h-screen bg-[#f8fcfb] relative overflow-hidden flex items-center justify-center p-4">
          {/* Background Mesh Gradients */}
          <div className="absolute top-0 -left-4 w-96 h-96 bg-[#3b6dae]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-[#c79d2d]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-[1s]" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#3b6dae]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-[2s]" />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

          <div className="w-full max-w-md relative z-10">
            <Card className="bg-white/80 border-[#3b6dae]/10 backdrop-blur-xl shadow-2xl shadow-[#3b6dae]/10 overflow-hidden">
              {/* Subtle top accent line */}
              <div className="h-1 w-full bg-linear-to-r from-[#3b6dae] to-[#c79d2d]" />
              
              <CardHeader className="space-y-6 pb-6 pt-10 px-8 text-center">
                <div className="flex justify-center items-center">
                  <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black text-[#3b6dae] tracking-tight uppercase">Welcome Back</CardTitle>
                  <CardDescription className="text-[#3b6dae]/60 font-semibold tracking-wide">
                    Access the Centrika Enterprise Portal
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#3b6dae] font-bold text-xs uppercase tracking-wider pl-1">
                      Portal Identity
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@centrika.rw"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/70 border-[#3b6dae]/10 text-[#3b6dae] placeholder:text-[#3b6dae]/30 focus:border-[#3b6dae]/30 focus:ring-[#3b6dae]/10 transition-all font-semibold rounded-xl px-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <Label htmlFor="password" className="text-[#3b6dae] font-bold text-xs uppercase tracking-wider">
                        Security Phrase
                      </Label>
                      <a
                        href="#"
                        className="text-xs text-[#3b6dae]/60 hover:text-[#3b6dae] font-bold transition-colors"
                      >
                        Recovery?
                      </a>
                    </div>
                    
                    <div className="[&>div>input]:h-12 [&>div>input]:bg-white/70 [&>div>input]:border-[#3b6dae]/10 [&>div>input]:text-[#3b6dae] [&>div>input]:focus:border-[#3b6dae]/30 [&>div>input]:focus:ring-[#3b6dae]/10 [&>div>input]:font-semibold [&>div>input]:rounded-xl [&>div]:px-0 [&>div>button]:text-[#3b6dae]/40 hover:[&>div>button]:text-[#3b6dae]">
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={setPassword}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-[#3b6dae] hover:bg-[#2d5385] text-white font-black tracking-widest uppercase text-xs shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98] rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Login Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-[#3b6dae]/50 text-xs font-semibold pt-4">
                    New to OnePortal?{" "}
                    <Link
                      href="/otp-login"
                      className="text-[#c79d2d] hover:text-[#a07e24] font-black underline decoration-2 underline-offset-4 transition-colors"
                    >
                      OTP Login
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-[#3b6dae]/30 text-[10px] font-black tracking-widest uppercase space-y-1">
              <p>Centrika OnePortal System</p>
              <p>© 2026 All rights reserved</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
