import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type LoginStep = "email" | "otp";

export default function OtpLoginPage() {
  const [, setLocation] = useLocation();
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
    onSuccess: (data: any) => {
      setSuccess(true);
      setError("");
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-white">
            {step === "email" ? "Login with OTP" : "Enter Verification Code"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {step === "email"
              ? "We'll send a 6-digit code to your company email"
              : `Enter the code sent to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success State */}
          {success && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Login successful!</span>
              </div>
              <p className="text-center text-sm text-slate-400">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {!success && (
            <>
              {/* Email Step */}
              {step === "email" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-200">
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
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      "Send Code to Email"
                    )}
                  </Button>
                </form>
              )}

              {/* OTP Step */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="otp" className="block text-sm font-medium text-slate-200">
                      6-Digit Code
                    </label>
                    <div className="relative">
                      <Input
                        ref={otpInputRef}
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtp(value);
                          setError("");
                        }}
                        disabled={loading || isOtpExpired}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20 text-center text-2xl tracking-widest font-mono"
                      />
                      {timeLeft > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span
                            className={`text-sm font-semibold ${timeLeft < 60 ? "text-red-400" : "text-slate-400"
                              }`}
                          >
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Message */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-300">
                      Check your email for the verification code. It expires in {formatTime(timeLeft)}.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6 || isOtpExpired}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  {/* Resend Option */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setTimeLeft(0);
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                      Use different email
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-center text-slate-500">
              🔒 Your login is protected with one-time passwords
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
