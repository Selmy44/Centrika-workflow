import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Mail, Key, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { validateEmail } from "@/utils/emailValidation";

type LoginStep = "email" | "otp";

export default function OtpLoginPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const sendOtpMutation = trpc.mfa.sendEmailOtp.useMutation({
    onSuccess: () => {
      setStep("otp");
      setTimeLeft(600); // 10 minutes
      setError("");
      toast.success("Verification code sent to your email");
      setTimeout(() => otpInputRef.current?.focus(), 100);
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to send OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    },
  });

  const verifyOtpMutation = trpc.mfa.verifyOtpLogin.useMutation({
    onSuccess: async () => {
      setSuccess(true);
      setError("");
      toast.success("Login successful!");
      // Wait for auth data to be refetched with new session
      try {
        await utils.auth.me.refetch();
      } catch (err) {
        console.warn("Auth refetch failed, proceeding anyway");
      }
      setTimeout(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get("redirect");
        if (redirectUrl) {
          window.location.href = decodeURIComponent(redirectUrl);
        } else {
          window.location.href = "/";
        }
      }, 500);
    },
    onError: (err: any) => {
      const msg = err.message || "Invalid OTP. Please try again.";
      setError(msg);
      toast.error(msg);
      setOtp("");
    },
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    // Use comprehensive email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Invalid email address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendOtpMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        purpose: "login",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyOtpMutation.mutateAsync({
        email,
        code: otp,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isOtpExpired = timeLeft === 0 && step === "otp";

  return (
    <div className="min-h-screen w-full flex bg-[#f7f9fc]">
      {/* Force light mode */}
      <style>{`
        .otp-login-page, .otp-login-page * { color-scheme: light !important; }
        .otp-login-page .dark\\:bg-slate-950,
        .otp-login-page .dark\\:bg-slate-900,
        .otp-login-page .dark\\:bg-slate-800,
        .otp-login-page .dark\\:text-white,
        .otp-login-page .dark\\:text-slate-100,
        .otp-login-page .dark\\:text-slate-200,
        .otp-login-page .dark\\:text-slate-300,
        .otp-login-page .dark\\:text-slate-400,
        .otp-login-page .dark\\:border-slate-700,
        .otp-login-page .dark\\:border-slate-600 {
          all: revert;
        }
      `}</style>

      {/* ====== LEFT: Branding Panel ====== */}
      <div className="hidden xl:flex relative w-[45%] flex-col justify-center overflow-hidden">
        <img src="/logo/loginbackground2G.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(30, 64, 120, 0.92) 0%, rgba(59, 109, 174, 0.82) 50%, rgba(59, 109, 174, 0.65) 100%)" }} />
        
        {/* Decorative elements */}
        <div className="absolute top-[12%] left-[10%] w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full border border-white/8" />

        <div className="relative z-10 h-full flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="inline-block rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <img src="/logo/centrikaLogo.png" alt="Centrika" className="h-32 w-auto drop-shadow-xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">OnePortal Access</h1>
          <p className="text-blue-100/90 text-lg mb-10 max-w-sm">
            Experience seamless and secure authentication with our one-time password system.
          </p>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="h-8 w-8 text-blue-300" />
            <div>
              <p className="text-white font-bold text-sm">Enhanced Security</p>
              <p className="text-blue-100/70 text-xs">Multi-factor authentication enabled for all accounts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== RIGHT: Form Panel ====== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-50 shadow-inner">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">Authenticated!</h2>
              <p className="text-[#5a7a99] mb-8">Redirecting you to the dashboard...</p>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3b6dae]/40" />
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">
                  {step === "email" ? "Login with OTP" : "Verify Email"}
                </h2>
                <p className="text-[#8ca0b8] text-sm leading-relaxed">
                  {step === "email" 
                    ? "Enter your company email to receive a secure login code." 
                    : `We've sent a 6-digit code to ${email}. Please enter it below.`}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-xs font-semibold leading-tight">{error}</p>
                </div>
              )}

              {step === "email" ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Company Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9bb5cc]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.name@centrika.rw"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        disabled={loading}
                        className="h-12 pl-12 bg-white border-[#d4dfe9] rounded-xl focus:ring-[#3b6dae]/20 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-12 rounded-full bg-[#3b6dae] hover:bg-[#2d5385] text-white font-bold tracking-widest uppercase text-[11px] shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98]"
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Verification Code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <Label htmlFor="otp" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Verification Code</Label>
                      {timeLeft > 0 && (
                        <span className={`text-[11px] font-bold ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[#3b6dae]/60"}`}>
                          Expires in {formatTime(timeLeft)}
                        </span>
                      )}
                    </div>
                    
                    <div className="relative group">
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtp(value);
                          setError("");
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text text-transparent selection:bg-transparent"
                        required
                        disabled={loading || isOtpExpired}
                        maxLength={6}
                        autoFocus
                        ref={otpInputRef as any}
                      />
                      
                      <div className="flex justify-between gap-2 max-w-full pointer-events-none">
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const isActive = otp.length === index && !(loading || isOtpExpired);
                          const hasValue = otp.length > index;
                          return (
                            <div
                              key={index}
                              className={`relative flex h-14 w-[15%] items-center justify-center rounded-xl border-2 text-2xl font-black transition-all duration-300 ${
                                isActive
                                  ? "border-[#3b6dae] bg-white scale-105 shadow-lg shadow-[#3b6dae]/10 z-10"
                                  : hasValue
                                    ? "border-[#3b6dae]/40 bg-[#3b6dae]/5 text-[#3b6dae]"
                                    : "border-[#d4dfe9] bg-white text-transparent"
                              }`}
                            >
                              {otp[index] || ""}
                              {isActive && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-[2px] h-6 bg-[#3b6dae] animate-pulse" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {isOtpExpired && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-red-600 text-[11px] font-bold text-center uppercase tracking-wider">The code has expired. Please request a new one.</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6 || isOtpExpired}
                    className="w-full h-12 rounded-full bg-[#3b6dae] hover:bg-[#2d5385] text-white font-bold tracking-widest uppercase text-[11px] shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98]"
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Sign In"}
                  </Button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setTimeLeft(0);
                      }}
                      className="text-sm font-bold text-[#3b6dae] hover:text-[#2d5385] flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                      <ArrowLeft size={16} /> Use a different email
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="mt-12 text-center text-[10px] font-bold text-[#b0c4d8] uppercase tracking-[0.2em] pt-6 border-t border-[#e8eef4]">
            Centrika OnePortal &middot; © 2026
          </div>
        </div>
      </div>
    </div>
  );
}
