import React, { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { validateEmail } from "@/utils/emailValidation";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordMutation = (trpc as any).auth.forgotPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.error || "Invalid email address");
      return;
    }
    setIsLoading(true);
    try {
      const result = await forgotPasswordMutation.mutateAsync({ email });
      setIsSubmitted(true);
      toast.success(result.message || "Reset instructions sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f7f9fc]">
      {/* Force light mode */}
      <style>{`
        .forgot-page, .forgot-page * { color-scheme: light !important; }
        .forgot-page .dark\\:bg-slate-950,
        .forgot-page .dark\\:bg-slate-900,
        .forgot-page .dark\\:bg-slate-800,
        .forgot-page .dark\\:text-white,
        .forgot-page .dark\\:text-slate-100,
        .forgot-page .dark\\:text-slate-200,
        .forgot-page .dark\\:text-slate-300,
        .forgot-page .dark\\:text-slate-400,
        .forgot-page .dark\\:border-slate-700,
        .forgot-page .dark\\:border-slate-600 {
          all: revert;
        }
      `}</style>

      {/* ====== LEFT PANEL ====== */}
      <div className="hidden xl:flex relative w-[45%] flex-col justify-center overflow-hidden">
        <img src="/logo/loginbackground2G.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(30, 64, 120, 0.92) 0%, rgba(59, 109, 174, 0.82) 50%, rgba(59, 109, 174, 0.65) 100%)" }} />
        
        {/* Decorative circles */}
        <div className="absolute top-[12%] left-[10%] w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute top-[28%] left-[18%] w-6 h-6 rounded-full bg-white/8" />
        <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full border border-white/8" />
        <div className="absolute bottom-[40%] right-[10%] w-10 h-10 rounded-full bg-white/5" />

        <div className="relative z-10 h-full flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="inline-block rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <img src="/logo/centrikaLogo.png" alt="Centrika" className="h-32 w-auto drop-shadow-xl" />
            </div>
          </div>
          <h1
            className="text-4xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: "-0.02em" }}
          >
            Centrika OnePortal
          </h1>
          <p className="text-blue-100/90 text-lg mb-10 max-w-sm leading-relaxed">
            Your unified workspace for managing requests, approvals and team collaboration.
          </p>
          <div className="space-y-3">
            {[
              "Streamlined leave & expense management",
              "Real-time approval tracking",
              "Secure role-based access",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "#60b5f5" }} />
                <span className="text-blue-50/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== RIGHT PANEL ====== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md">
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-semibold mb-1" style={{ color: "#1e3a5f", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                  Forgot Password?
                </h2>
                <p style={{ color: "#8ca0b8", fontSize: "14px" }}>
                  Enter your company email to receive reset instructions
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9bb5cc" }} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="username@centrika.rw"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: "40px", height: "48px", background: "#eef3f8", border: "1px solid #d4dfe9", borderRadius: "10px", color: "#1e3a5f", fontSize: "14px" }}
                      required
                    />
                  </div>
                  <p style={{ color: "#9bb5cc", fontSize: "12px" }}>
                    Use your company email: username@centrika.rw
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || !validateEmail(email)}
                  className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-full transition-colors hover:bg-slate-100"
                  style={{ color: "#3b6dae", fontSize: "14px", fontWeight: 500 }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
                  <CheckCircle className="h-12 w-12" style={{ color: "#22c55e" }} />
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: "#1e3a5f" }}>Reset Request Received</h2>
              <p className="mb-6" style={{ color: "#5a7a99", fontSize: "14px" }}>
                If an account exists for <span className="font-semibold" style={{ color: "#3b6dae" }}>{email}</span>, you will receive an email with instructions to reset your password shortly.
              </p>
              
              <div className="mb-8 p-4 rounded-xl border border-blue-100 bg-blue-50/30 text-left">
                <p style={{ color: "#3b6dae", fontSize: "13px", fontWeight: 500 }} className="mb-1">
                  Important Info
                </p>
                <p style={{ color: "#8ca0b8", fontSize: "12px" }}>
                  The reset link is only valid for 15 minutes. If you do not receive the email, please check your spam folder or contact support.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setEmail(""); setIsSubmitted(false); }}
                  className="w-full h-11 rounded-full transition-colors"
                  style={{ color: "#3b6dae", border: "1px solid #d4dfe9", fontSize: "14px", fontWeight: 500 }}
                >
                  Try Another Email
                </button>
                <Button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e8eef4" }}>
            <p className="text-center text-xs" style={{ color: "#b0c4d8" }}>
              Centrika OnePortal &middot; © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
