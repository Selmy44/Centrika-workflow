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
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-[#3b6dae]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-[#c79d2d]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#3b6dae]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/80 border-[#3b6dae]/10 backdrop-blur-xl shadow-2xl shadow-[#3b6dae]/10 overflow-hidden">
          {/* Subtle top accent line */}
          <div className="h-1 w-full bg-linear-to-r from-[#3b6dae] to-[#c79d2d]" />

          <CardHeader className="space-y-4 pb-6 pt-10 px-8 text-left">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#3b6dae]/70">
                Get started! 👋
              </p>
              <CardTitle className="text-3xl font-black text-[#3b6dae] tracking-tight">
                {step === "email" ? "Login with OTP" : "Email verification with OTP"}
              </CardTitle>
            </div>
            <CardDescription className="text-[#3b6dae]/60 font-medium text-sm leading-relaxed max-w-[90%]">
              {step === "email" ? (
                "Enter your company email to receive a one-time login code."
              ) : (
                <>
                  Enter the verification code sent to your email address.<br />
                  If you haven't received it, click the <span className="font-bold text-[#3b6dae]">Resend Code</span> button below to request a new one.
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            {/* Success State */}
            {success && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-[#3b6dae] mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-black tracking-widest uppercase text-xs">Login successful!</span>
                </div>
                <p className="text-center text-xs font-semibold text-[#3b6dae]/60">Redirecting to dashboard...</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 font-medium text-xs tracking-wide">{error}</AlertDescription>
              </Alert>
            )}

            {!success && (
              <>
                {/* Email Step */}
                {step === "email" && (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-xs font-bold text-[#3b6dae] uppercase tracking-wider pl-1">
                        Company Email
                      </label>
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
                        className="h-12 bg-white/70 border-[#3b6dae]/10 text-[#3b6dae] placeholder:text-[#3b6dae]/30 focus:border-[#3b6dae]/30 focus:ring-[#3b6dae]/10 transition-all font-semibold rounded-xl px-4"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full h-12 bg-[#3b6dae] hover:bg-[#2d5385] text-white font-black tracking-[0.2em] uppercase text-[11px] shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98] rounded-xl"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Code"
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* OTP Step */}
                {step === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="flex justify-center pt-2 relative">
                      <div className="relative group max-w-[340px] mx-auto">
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
                        
                        <div className="flex justify-between gap-2 max-w-full pointer-events-none pb-2">
                          {[0, 1, 2, 3, 4, 5].map((index) => {
                            const isActive = otp.length === index && !(loading || isOtpExpired);
                            const hasValue = otp.length > index;
                            return (
                              <div
                                key={index}
                                className={`relative flex h-14 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 text-2xl font-black transition-all duration-300 ${
                                  isActive
                                    ? "border-[#3b6dae] shadow-[0_0_15px_rgba(59,109,174,0.3)] bg-white scale-105 z-10"
                                    : hasValue
                                      ? "border-[#3b6dae]/40 bg-[#3b6dae]/5 text-[#3b6dae]"
                                      : "border-[#3b6dae]/10 bg-white/50 text-transparent group-focus-within:border-[#3b6dae]/30"
                                }`}
                              >
                                {otp[index] || ""}
                                {isActive && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[2px] h-6 bg-[#3b6dae] animate-pulse duration-1000" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {timeLeft > 0 && (
                        <div className="absolute -top-6 right-0 bg-white/80 px-2 py-1 rounded-md shadow-sm border border-[#3b6dae]/5">
                          <span
                            className={`text-[10px] font-black tracking-widest ${
                              timeLeft < 60 ? "text-red-500" : "text-[#3b6dae]/60"
                            }`}
                          >
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Message */}
                    <div className="p-3 bg-[#3b6dae]/5 border border-[#3b6dae]/10 rounded-xl">
                      <p className="text-xs font-semibold text-[#3b6dae]/70 text-center">
                        Check your email. Code expires in {formatTime(timeLeft)}.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={loading || otp.length !== 6 || isOtpExpired}
                        className="w-full h-14 bg-[#3b6dae] hover:bg-[#2d5385] text-white font-bold tracking-wide uppercase text-sm shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98] rounded-xl"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "SIGN IN"
                        )}
                      </Button>
                    </div>

                    {/* Resend Option */}
                    <div className="pt-2 text-center">
                      <p className="text-sm font-medium text-[#3b6dae]/60">
                        Didn't receive code?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setStep("email");
                            setOtp("");
                            setTimeLeft(0);
                          }}
                          className="font-bold text-[#3b6dae] hover:text-[#2d5385] hover:underline transition-colors"
                        >
                          Resend the Code
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Footer Form Note */}
            <div className="pt-6 border-t border-[#3b6dae]/10">
              <p className="text-[10px] text-center font-bold tracking-widest uppercase text-[#3b6dae]/40">
                🔒 Protected by single-use OTP
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Global Footer */}
        <div className="mt-8 text-center text-[#3b6dae]/30 text-[10px] font-black tracking-widest uppercase space-y-1">
          <p>Centrika OnePortal System</p>
          <p>© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
