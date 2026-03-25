import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

  const sendOtpMutation = trpc.mfa.sendEmailOtp.useMutation({
    onSuccess: () => {
      setStep("otp");
      setTimeLeft(600); // 10 minutes
      setError("");
      setTimeout(() => otpInputRef.current?.focus(), 100);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to send OTP. Please try again.");
    },
  });

  const verifyOtpMutation = trpc.mfa.verifyOtpLogin.useMutation({
    onSuccess: async (data: any) => {
      setSuccess(true);
      setError("");
      // Ensure user info is refetched and persisted to local storage
      await utils.auth.me.invalidate();
      // Show success message, then redirect
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.message || "Invalid OTP. Please try again.");
      setOtp("");
    },
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    // Basic email validation
    if (!email.includes("@centrika.rw")) {
      setError("Please use your company email (@centrika.rw)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendOtpMutation.mutateAsync({
        email,
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
    <div className="otp-page min-h-screen w-full overflow-hidden relative" style={{ background: "#f7f9fc" }}>
      {/* Force light mode */}
      <style>{`
        .otp-page, .otp-page * { color-scheme: light !important; }
        @media (max-width: 768px) {
          .otp-left-panel { display: none !important; }
          .otp-divider { display: none !important; }
          .otp-right-panel {
            width: 100% !important;
            position: relative !important;
            min-height: 100vh;
          }
        }
      `}</style>

      {/* ====== LEFT PANEL ====== */}
      <div className="otp-left-panel absolute left-0 top-0 h-full" style={{ width: "45%" }}>
        <img src="/logo/loginbackground2G.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(30, 64, 120, 0.92) 0%, rgba(59, 109, 174, 0.82) 50%, rgba(59, 109, 174, 0.65) 100%)" }} />
        <div className="absolute top-[12%] left-[10%] w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full border border-white/8" />
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

      {/* ====== DIAGONAL DIVIDER ====== */}
      <div className="otp-divider absolute top-0 h-full z-10" style={{ left: "40%", width: "200px" }}>
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="h-full w-full" style={{ display: "block" }}>
          <polygon points="0,0 120,0 80,100 0,100" style={{ fill: "rgba(59, 109, 174, 0.82)" }} />
          <polygon points="120,0 200,0 200,100 80,100" fill="#f7f9fc" />
        </svg>
      </div>

      {/* ====== RIGHT PANEL ====== */}
      <div className="otp-right-panel absolute right-0 top-0 h-full z-20 flex items-center justify-center" style={{ width: "55%", background: "#f7f9fc" }}>
        <div className="w-full max-w-md px-12">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(59, 109, 174, 0.1)" }}>
                <Loader2 className="h-7 w-7 text-[#3b6dae] animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-semibold mb-1" style={{ color: "#1e3a5f", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
              {step === "email" ? "Login with OTP" : "Auth Verification"}
            </h2>
            <p style={{ color: "#8ca0b8", fontSize: "14px" }}>
              {step === "email" 
                ? "Enter your company email to receive a one-time login code."
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          <CardContent className="px-0 pb-8 space-y-5">
            {/* Success State */}
            {success && (
              <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-500 text-center">
                <div className="flex flex-col items-center justify-center gap-4 text-[#3b6dae]">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <span className="font-black tracking-widest uppercase text-xs">Access Granted!</span>
                </div>
                <p className="text-center text-xs font-semibold text-[#3b6dae]/40 uppercase tracking-widest">Redirecting to secure portal...</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-700 font-bold text-[10px] tracking-wide uppercase">{error}</p>
              </div>
            )}

            {!success && (
              <>
                {/* Email Step */}
                {step === "email" && (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="block text-[11px] font-bold text-[#3b6dae] uppercase tracking-wider pl-1">
                        Corporate Identity
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b6dae]/30 group-focus-within/input:text-[#3b6dae] transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@centrika.rw"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          disabled={loading}
                          className="h-12 !bg-white border-[#d4dfe9] pl-11 text-sm text-black placeholder:text-[#8ca0b8]/50 focus:border-[#3b6dae] focus:ring-4 focus:ring-[#3b6dae]/5 transition-all duration-300 font-semibold rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          "Send Login Key"
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* OTP Step */}
                {step === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex flex-col items-center pt-2 relative">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => {
                          setOtp(value);
                          setError("");
                        }}
                        disabled={loading || isOtpExpired}
                        autoFocus
                      >
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="w-[42px] h-14 sm:w-[50px] sm:h-16 text-xl font-bold text-[#1e3a5f] border-[#d4dfe9] rounded-xl !bg-[#f7f9fc] transition-all duration-300 focus-within:border-[#3b6dae] focus-within:ring-4 focus-within:ring-[#3b6dae]/5 focus-within:shadow-lg focus-within:!bg-[#f0f6ff]"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="p-3 bg-[#3b6dae]/5 border border-[#3b6dae]/10 rounded-xl text-center">
                      <p className="text-[11px] font-bold text-[#3b6dae]/70 uppercase tracking-widest leading-relaxed">
                        Security key expires in <span className="text-[#3b6dae] tabular-nums">{formatTime(timeLeft)}</span>
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={loading || otp.length !== 6 || isOtpExpired}
                        className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          "Authorize Entry"
                        )}
                      </Button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setOtp("");
                          setTimeLeft(0);
                        }}
                        className="text-xs font-bold text-[#3b6dae] hover:underline"
                      >
                        Try a different email
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            <div className="pt-6 border-t border-[#d4dfe9] text-center">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#8ca0b8]">
                🔒 Enterprise MFA Protection
              </p>
            </div>
          </CardContent>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 w-full z-20 text-center text-[#1e40af]/30 text-[10px] font-semibold tracking-widest uppercase">
        <p>OnePortal Secure Digital Environment • © 2026 Centrika Ltd • Access Strictly Controlled</p>
 </div>
    </div>
  );
}
