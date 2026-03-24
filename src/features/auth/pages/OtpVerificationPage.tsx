import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";

interface OtpVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OtpVerification({ email, onBack }: OtpVerificationProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const utils = trpc.useUtils();
  const verifyLoginOtp = trpc.auth.verifyLoginOtp.useMutation();

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyLoginOtp.mutateAsync({
        email: email,
        code: otpCode,
      });
      if (result.success) {
        toast.success("Logged in successfully!");
        await utils.auth.me.invalidate();
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    toast.success("OTP resent to your email!");
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative" style={{ background: "#f7f9fc" }}>
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
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center gap-2 mb-8 transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ color: "#3b6dae", fontSize: "14px", fontWeight: 500 }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(59, 109, 174, 0.1)" }}>
                <Mail className="h-7 w-7" style={{ color: "#3b6dae" }} />
              </div>
            </div>
            <h2 className="text-3xl font-semibold mb-1" style={{ color: "#1e3a5f", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
              Verify Your Email
            </h2>
            <p style={{ color: "#8ca0b8", fontSize: "14px" }}>
              We've sent a 6-digit code to <span className="font-semibold" style={{ color: "#3b6dae" }}>{email}</span>
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-3">
              <Label className="block text-center" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Enter Verification Code
              </Label>

              {/* OTP Boxes */}
              <div className="relative group max-w-[340px] mx-auto">
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(value);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text text-transparent selection:bg-transparent"
                  required
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                />

                <div className="flex justify-between gap-2 max-w-full pointer-events-none pb-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const isActive = otpCode.length === index;
                    const hasValue = otpCode.length > index;
                    return (
                      <div
                        key={index}
                        className="relative flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all duration-300"
                        style={{
                          borderColor: isActive ? "#3b6dae" : hasValue ? "#b0c4d8" : "#d4dfe9",
                          background: isActive ? "#f0f6ff" : hasValue ? "#eef3f8" : "#f7f9fc",
                          color: "#1e3a5f",
                          boxShadow: isActive ? "0 0 15px rgba(59, 109, 174, 0.15)" : "none",
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        {otpCode[index] || ""}
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[1.5px] h-6 animate-pulse duration-1000" style={{ background: "#3b6dae" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                "Verify Code"
              )}
            </Button>

            {/* Resend */}
            <div className="space-y-3 pt-4" style={{ borderTop: "1px solid #e8eef4" }}>
              <p className="text-center text-xs" style={{ color: "#8ca0b8" }}>
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || resendCountdown > 0}
                className="w-full h-11 rounded-full transition-colors disabled:opacity-50"
                style={{ color: "#3b6dae", border: "1px solid #d4dfe9", fontSize: "14px", fontWeight: 500 }}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
              </button>
            </div>
          </form>

          {/* Footer */}
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
